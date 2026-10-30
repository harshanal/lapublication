import "./load-env";
import { createServer } from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, sep } from "node:path";
import { paths, readJson, atomicJson, rebuildCatalogue, assetPaths } from "./catalogue-store";
import { applyDrivePreview, scanDrive, type DrivePreview } from "./sync-drive";
import { buildThumbnailQueue } from "./thumbnail-queue";
import { applyOverrides } from "../src/lib/catalogue";
import type { CatalogueOverrides, LibraryData, Series } from "../src/lib/types";
import { inferRole } from "../src/lib/sync-utils";
import sharp from "sharp";

const port = Number(process.env.LIBRARY_MANAGER_PORT || 3013);
const origin = `http://127.0.0.1:${port}`;
let busy = false;
const text = (value: unknown, max = 2000) => { if (typeof value !== "string" || value.length > max) throw new Error("Invalid text field"); return value.trim(); };
function date(value: unknown) { const v = text(value, 10); if (v && (!/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(Date.parse(v)) || new Date(v).toISOString().slice(0, 10) !== v)) throw new Error("Use a valid YYYY-MM-DD publication date"); return v || null; }

createServer(async (request, response) => {
  const send = (status: number, body: unknown) => { response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }); response.end(JSON.stringify(body)); };
  if (request.headers.host !== `127.0.0.1:${port}`) return send(403, { error: `Open ${origin} to use the local manager.` });
  const url = new URL(request.url || "/", origin);
  const write = request.method === "POST";
  if (write && (request.headers.origin !== origin || !request.headers["content-type"]?.startsWith("application/json"))) return send(403, { error: "Use the local manager to make changes." });
  if (write && busy) return send(409, { error: "Another change is running. Please wait." });
  if (write) busy = true;
  try {
    if (request.method === "GET" && url.pathname === "/") {
      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'none'" });
      return response.end(await readFile(resolve("scripts/manager.html"), "utf8"));
    }
    if (request.method === "GET" && url.pathname.startsWith("/library/")) {
      const root = resolve("public/library");
      const file = resolve("public", decodeURIComponent(url.pathname).slice(1));
      if (!file.startsWith(root + sep) || !/\.(png|jpg|webp)$/i.test(file)) return send(404, { error: "Image not found" });
      response.writeHead(200, { "Content-Type": file.endsWith(".png") ? "image/png" : file.endsWith(".webp") ? "image/webp" : "image/jpeg", "Cache-Control": "no-store" });
      return response.end(await readFile(file));
    }
    if (request.method === "GET" && url.pathname === "/api/state") {
      const source = await readJson<LibraryData>(existsSync(paths.source) ? paths.source : paths.catalogue);
      const overrides = await readJson<CatalogueOverrides>(paths.overrides);
      const allOverrides: CatalogueOverrides = { ...overrides, publications: Object.fromEntries(Object.entries(overrides.publications ?? {}).map(([id, meta]) => [id, { ...meta, status: "published" }])) };
      const preview = existsSync(paths.pending) ? await readJson<DrivePreview>(paths.pending) : null;
      return send(200, { source, overrides, catalogue: applyOverrides(source, allOverrides, await assetPaths()), preview: preview ? { ...preview, files: preview.files.map((f) => ({ ...f, inferredRole: inferRole(f.name, f.mimeType) })) } : null, busy });
    }
    if (!write) return send(404, { error: "Not found" });
    let raw = "";
    for await (const chunk of request) { raw += chunk.toString(); if (Buffer.byteLength(raw) > 7 * 1024 * 1024) throw new Error("Request too large. Use a PNG under 5 MB."); }
    const body = JSON.parse(raw || "{}");
    if (url.pathname === "/api/scan") return send(200, await scanDrive());
    if (url.pathname === "/api/apply") { const result = await applyDrivePreview(body.acceptRemovals === true); await buildThumbnailQueue(); return send(200, result); }
    if (url.pathname === "/api/queue") return send(200, await buildThumbnailQueue());
    const source = await readJson<LibraryData>(existsSync(paths.source) ? paths.source : paths.catalogue);
    const overrides = await readJson<CatalogueOverrides>(paths.overrides);
    if (url.pathname === "/api/publication") {
      const id = text(body.id, 150);
      if (!source.publications.some((p) => p.id === id)) throw new Error("Unknown publication");
      if (!source.categories.some((c) => c.id === body.categoryId)) throw new Error("Unknown category");
      if (!["si", "en"].includes(body.language) || !["published", "hidden"].includes(body.status) || !["auto", "cover", "generated", "series", "page"].includes(body.thumbnailMode)) throw new Error("Invalid selection");
      const seriesId = text(body.seriesId, 100) || null;
      if (seriesId && !overrides.series?.some((s) => s.id === seriesId)) throw new Error("Unknown series");
      const title = text(body.title, 500);
      if (!title) throw new Error("Title is required");
      overrides.publications ??= {};
      overrides.publications[id] = { ...overrides.publications[id], title, summary: text(body.summary, 4000), author: text(body.author, 300) || null, publicationDate: date(body.publicationDate), categoryId: body.categoryId, language: body.language, status: body.status, featured: body.featured === true, seriesId, tags: text(body.tags, 1000).split(",").map((t) => t.trim()).filter(Boolean).slice(0, 30), thumbnailMode: body.thumbnailMode, thumbnailTitle: text(body.thumbnailTitle ?? "", 180), thumbnailSubtitle: text(body.thumbnailSubtitle ?? "", 100), thumbnailFileId: text(body.thumbnailFileId ?? "", 150) || undefined };
    } else if (url.pathname === "/api/series") {
      const id = text(body.id, 80);
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) throw new Error("Use a short series ID such as monthly-news");
      const item: Series = { id, name: text(body.name, 200), description: text(body.description, 1000), imagePrompt: text(body.imagePrompt, 2000), thumbnailUrl: `/library/series/${id}.png` };
      if (!item.name) throw new Error("Series name is required");
      overrides.series = [...(overrides.series ?? []).filter((s) => s.id !== id), item];
    } else if (url.pathname === "/api/file-role") {
      const id = text(body.id, 150);
      const preview = existsSync(paths.pending) ? await readJson<DrivePreview>(paths.pending) : null;
      if (!preview?.files.some((f) => f.id === id) || !["main", "cover", "ignore"].includes(body.role)) throw new Error("Scan Drive first and select a valid file role");
      const publicationId = text(body.publicationId ?? "", 150);
      if (publicationId && !source.publications.some((p) => p.id === publicationId)) throw new Error("Unknown publication");
      overrides.files ??= {};
      overrides.files[id] = { role: body.role, ...(publicationId ? { publicationId } : {}) };
      await atomicJson(paths.overrides, overrides);
      return send(200, { message: "File role saved. Scan Drive again, then apply the new preview." });
    } else if (url.pathname === "/api/image") {
      const id = text(body.id, 150);
      const isSeries = body.kind === "series";
      if (isSeries ? !overrides.series?.some((s) => s.id === id) : !source.publications.some((p) => p.id === id)) throw new Error("Unknown image target");
      if (!/^[a-zA-Z0-9_-]+$/.test(id)) throw new Error("Invalid ID");
      const encoded = text(body.image, 7 * 1024 * 1024);
      if (!encoded.startsWith("data:image/png;base64,")) throw new Error("Choose a PNG image");
      const bytes = Buffer.from(encoded.slice(22), "base64");
      if (bytes.length > 5 * 1024 * 1024 || bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") throw new Error("Choose a valid PNG under 5 MB");
      const dir = resolve("public/library", isSeries ? "series" : "generated");
      await mkdir(dir, { recursive: true });
      const file = resolve(dir, `${id}.png`);
      if (existsSync(file)) { await mkdir(resolve(".library/image-history"), { recursive: true }); await writeFile(resolve(".library/image-history", `${id}-${Date.now()}.png`), await readFile(file)); }
      await writeFile(file, await sharp(bytes, { limitInputPixels: 25000000 }).resize({ width: 640, height: 900, fit: "inside", withoutEnlargement: true }).png({ palette: true, quality: 90 }).toBuffer());
      if (!isSeries) { overrides.publications ??= {}; overrides.publications[id] = { ...overrides.publications[id], thumbnailMode: "generated" }; }
    } else return send(404, { error: "Unknown action" });
    // Validate the full derived catalogue before saving metadata.
    applyOverrides(source, overrides, await assetPaths());
    await atomicJson(paths.overrides, overrides);
    await rebuildCatalogue();
    await buildThumbnailQueue();
    send(200, { message: "Saved locally. Preview the website, then build and deploy when ready." });
  } catch (error) { send(400, { error: error instanceof Error ? error.message : "The operation failed" }); }
  finally { if (write) busy = false; }
}).listen(port, "127.0.0.1", () => console.log(`Library manager: ${origin}\nLocal edits only. No changes to Drive or your published website.`));
