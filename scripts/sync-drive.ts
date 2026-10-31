import "./load-env";
import { existsSync } from "node:fs";
import { mkdir, writeFile, rename } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";
import { createHash } from "node:crypto";
import { buildCounts, categorySlug, cleanTitle, duplicateContentPairs, inferRole, publicationSlug } from "../src/lib/sync-utils";
import { compareCatalogues } from "../src/lib/catalogue";
import { atomicJson, paths, readJson, rebuildCatalogue } from "./catalogue-store";
import type { CatalogueOverrides, LibraryData, Publication } from "../src/lib/types";

type DriveFile = { id: string; name: string; mimeType: string; size?: string; md5Checksum?: string; modifiedTime?: string; thumbnailLink?: string; webContentLink?: string; categoryId: string; categoryName: string; parentId: string };
export type DrivePreview = { scannedAt: string; configurationSignature: string; library: LibraryData; files: DriveFile[]; changes: ReturnType<typeof compareCatalogues> };
const rootId = () => process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || "13c8bRvGo7Q8PXgodwPIULewzQfsjP0Nq";
const assetsId = () => process.env.GOOGLE_DRIVE_ASSETS_FOLDER_ID || "";
function configurationSignature(overrides: CatalogueOverrides) { return createHash("sha256").update(JSON.stringify({ root: rootId(), assets: assetsId(), files: overrides.files, covers: Object.entries(overrides.publications ?? {}).filter(([, p]) => p.thumbnailFileId).map(([id, p]) => [id, p.thumbnailFileId]) })).digest("hex"); }
function apiUrl(path: string, params: Record<string, string>) {
  const url = new URL(`https://www.googleapis.com/drive/v3/${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return url;
}
async function googleJson<T>(url: URL): Promise<T> {
  const key = process.env.GOOGLE_DRIVE_API_KEY;
  if (!key) throw new Error("Add GOOGLE_DRIVE_API_KEY to .env.local first.");
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(url, { headers: { "X-Goog-Api-Key": key }, signal: AbortSignal.timeout(30000) });
    if (response.ok) return response.json() as Promise<T>;
    if ((response.status === 429 || response.status >= 500) && attempt < 2) { await new Promise((done) => setTimeout(done, 500 * (attempt + 1))); continue; }
    throw new Error(`Google API returned ${response.status}. Check the API key, enabled Drive API, and public folder access.`);
  }
  throw new Error("Google API unavailable. Previous catalogue is unchanged.");
}
async function children(folderId: string) {
  const files: DriveFile[] = [];
  let pageToken = "";
  do {
    const result = await googleJson<{ files: DriveFile[]; nextPageToken?: string }>(apiUrl("files", {
      q: `'${folderId}' in parents and trashed = false`, fields: "nextPageToken,files(id,name,mimeType,size,md5Checksum,modifiedTime,thumbnailLink,webContentLink)", pageSize: "1000", ...(pageToken ? { pageToken } : {})
    }));
    files.push(...result.files);
    pageToken = result.nextPageToken ?? "";
  } while (pageToken);
  return files;
}
export async function scanDrive(): Promise<DrivePreview> {
  if (process.env.GOOGLE_CATALOG_SHEET_ID) throw new Error("This manager uses local catalogue overrides. Clear GOOGLE_CATALOG_SHEET_ID after migrating any Sheet metadata to catalog.overrides.json.");
  const previous = await readJson<LibraryData>(existsSync(paths.source) ? paths.source : paths.catalogue);
  const overrides = await readJson<CatalogueOverrides>(paths.overrides);
  const root = await children(rootId());
  const folders = root.filter((f) => f.mimeType === "application/vnd.google-apps.folder");
  const scanned: DriveFile[] = [];
  const visited = new Set<string>();
  async function walk(id: string, categoryId: string, categoryName: string, initial?: DriveFile[]) {
    if (visited.has(id)) return;
    visited.add(id);
    for (const file of initial ?? await children(id)) {
      if (file.mimeType === "application/vnd.google-apps.folder") await walk(file.id, categoryId, categoryName);
      else if (file.mimeType === "application/pdf" || file.mimeType.startsWith("image/")) scanned.push({ ...file, categoryId, categoryName, parentId: id });
    }
  }
  for (const folder of folders) await walk(folder.id, folder.id, folder.name);
  const rootFiles = root.filter((f) => f.mimeType !== "application/vnd.google-apps.folder");
  if (rootFiles.some((f) => f.mimeType === "application/pdf")) {
    folders.push({ id: rootId(), name: "වෙනත් ප්‍රකාශන", mimeType: "application/vnd.google-apps.folder" } as DriveFile);
    await walk(rootId(), rootId(), "වෙනත් ප්‍රකාශන", rootFiles);
  }
  async function walkAssets(id: string) {
    if (visited.has(id)) return;
    visited.add(id);
    for (const file of await children(id)) {
      if (file.mimeType === "application/vnd.google-apps.folder") await walkAssets(file.id);
      else if (file.mimeType === "application/pdf" || file.mimeType.startsWith("image/")) scanned.push({ ...file, categoryId: assetsId(), categoryName: "Assets", parentId: id });
    }
  }
  if (assetsId()) await walkAssets(assetsId());
  const role = (file: DriveFile) => overrides.files?.[file.id]?.role ?? inferRole(file.name, file.mimeType);
  const mains = scanned.filter((f) => f.mimeType === "application/pdf" && role(f) === "main");
  const duplicate = duplicateContentPairs(mains)[0];
  if (duplicate) throw new Error(`Duplicate PDF content: "${duplicate.duplicate.name}" matches "${duplicate.original.name}". Keep one publication and mark the other file as ignore.`);
  const old = new Map(previous.publications.map((p) => [p.id, p]));
  const slugs = new Set<string>();
  const ids = new Set<string>();
  const publications: Publication[] = mains.map((file) => {
    const id = overrides.files?.[file.id]?.publicationId ?? file.id;
    if (ids.has(id)) throw new Error(`More than one main PDF maps to ${id}. Set the alternate file role to ignore before syncing.`);
    ids.add(id);
    const title = cleanTitle(file.name);
    const base = publicationSlug(id, title, old.get(id)?.slug);
    let slug = base;
    let suffix = 1;
    while (slugs.has(slug)) slug = `${base}-${suffix++}`;
    slugs.add(slug);
    const explicitId = overrides.publications?.[id]?.thumbnailFileId;
    const explicit = scanned.find((f) => f.id === explicitId);
    const mapped = scanned.filter((f) => role(f) === "cover" && overrides.files?.[f.id]?.publicationId === id);
    const siblings = scanned.filter((f) => role(f) === "cover" && f.parentId === file.parentId && !overrides.files?.[f.id]?.publicationId);
    const cover = explicit ?? (mapped.length === 1 ? mapped[0] : undefined) ?? (mains.filter((f) => f.parentId === file.parentId).length === 1 && siblings.length === 1 ? siblings[0] : undefined);
    return { id, driveFileId: file.id, title, slug, categoryId: file.categoryId, categoryName: file.categoryName, categorySlug: categorySlug(file.categoryId, file.categoryName), author: null, publicationDate: null, summary: "", language: file.categoryName.toLowerCase().includes("english") ? "en" : "si", featured: false, status: "published", pdfUrl: `https://drive.google.com/file/d/${file.id}/preview`, downloadUrl: file.webContentLink ?? `https://drive.google.com/uc?export=download&id=${file.id}`, thumbnailUrl: null, coverThumbnailUrl: cover ? `/library/thumbnails/cover-${cover.id}.jpg` : null, pageThumbnailUrl: file.thumbnailLink ? `/library/thumbnails/page-${file.id}.jpg` : null, fileSize: file.size ? Number(file.size) : null, modifiedTime: file.modifiedTime ?? null };
  });
  const library: LibraryData = { version: 1, syncedAt: new Date().toISOString(), sourceFolderUrl: `https://drive.google.com/drive/folders/${rootId()}`, isDemo: false, categories: buildCounts(folders.map((f) => ({ id: f.id, name: f.name, slug: categorySlug(f.id, f.name) })), publications), publications };
  const preview = { scannedAt: library.syncedAt!, configurationSignature: configurationSignature(overrides), library, files: scanned, changes: compareCatalogues(previous, library) };
  await atomicJson(paths.pending, preview);
  return preview;
}
export async function applyDrivePreview(acceptRemovals = false) {
  if (!existsSync(paths.pending)) throw new Error("Scan Drive first to review the changes.");
  const preview = await readJson<DrivePreview>(paths.pending);
  if (preview.configurationSignature !== configurationSignature(await readJson<CatalogueOverrides>(paths.overrides))) throw new Error("File roles, cover mappings or the Drive source changed. Scan Drive again before applying.");
  if (preview.changes.removed.length && !acceptRemovals) throw new Error(`${preview.changes.removed.length} publications disappeared from Drive. Review removals before accepting.`);
  if (Date.now() - new Date(preview.scannedAt).getTime() > 3600000) throw new Error("The scan is over an hour old. Scan Drive again before applying.");
  const cachePath = resolve(".library/thumbnail-cache.json");
  const cache = existsSync(cachePath) ? await readJson<Record<string, string>>(cachePath) : {};
  const warnings: string[] = [];
  await mkdir(resolve("public/library/thumbnails"), { recursive: true });
  for (const publication of preview.library.publications) {
    for (const field of ["coverThumbnailUrl", "pageThumbnailUrl"] as const) {
      const asset = publication[field];
      if (!asset) continue;
      const id = asset.replace(/^.*\/(cover-|page-)/, "").replace(/\.jpg$/, "");
      const file = preview.files.find((f) => f.id === id);
      const path = resolve("public", asset.slice(1));
      const signature = `${id}:${file?.modifiedTime ?? "unknown"}`;
      if (existsSync(path) && cache[asset] === signature) continue;
      const url = file?.mimeType.startsWith("image/") ? apiUrl(`files/${id}`, { alt: "media" }) : file?.thumbnailLink;
      try {
        if (!url) throw new Error("No Drive thumbnail");
        const response = await fetch(url, { headers: url instanceof URL ? { "X-Goog-Api-Key": process.env.GOOGLE_DRIVE_API_KEY! } : {}, signal: AbortSignal.timeout(30000) });
        if (!response.ok || !response.headers.get("content-type")?.startsWith("image/")) throw new Error("Thumbnail not available");
        const image = new Uint8Array(await response.arrayBuffer());
        if (image.length > 10 * 1024 * 1024) throw new Error("Cover exceeds 10 MB");
        const optimized = await sharp(image).rotate().resize({ width: 640, height: 900, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 82 }).toBuffer();
        await writeFile(`${path}.tmp`, optimized);
        await rename(`${path}.tmp`, path);
        cache[asset] = signature;
      } catch {
        if (!existsSync(path)) publication[field] = null;
        warnings.push(`Thumbnail unavailable: ${publication.title}. Use the image queue or upload a cover.`);
      }
    }
  }
  await atomicJson(cachePath, cache);
  await atomicJson(paths.source, preview.library);
  const data = await rebuildCatalogue();
  return { count: data.publications.length, warnings };
}
if (process.argv[1]?.replaceAll("\\", "/").endsWith("/sync-drive.ts")) {
  try {
    if (process.argv.includes("--apply")) console.log(JSON.stringify(await applyDrivePreview(process.argv.includes("--accept-removals")), null, 2));
    else { const preview = await scanDrive(); console.log(JSON.stringify({ publications: preview.library.publications.length, added: preview.changes.added.map((p) => p.title), updated: preview.changes.updated.map((p) => p.title), removed: preview.changes.removed.map((p) => p.title) }, null, 2)); console.log("Preview saved. Review, then run pnpm sync:apply. Nothing has been published."); }
  } catch (error) { console.error(error instanceof Error ? error.message : "Drive scan failed"); process.exitCode = 1; }
}
