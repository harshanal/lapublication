import { resolve } from "node:path";
import { assetPaths, atomicJson, paths, readJson } from "./catalogue-store";
import type { LibraryData } from "../src/lib/types";
export async function buildThumbnailQueue() {
  const data = await readJson<LibraryData>(paths.catalogue);
  const assets = await assetPaths();
  const queue: { kind: string; id: string; title: string; outputPath: string; referenceImagePaths: string[]; prompt: string }[] = [];
  const style = "Portrait 4:5 editorial illustration for a Sinhala Buddhist publication library. Maroon, antique gold, cream and restrained green. Symbolic nature, warm light, lotus, manuscripts or temple architecture. No people, no Buddha or monk figures, no text, no watermark. Keep the real title as website text, not in the image.";
  for (const series of data.series ?? []) {
    const output = series.thumbnailUrl ?? `/library/series/${series.id}.png`;
    if (assets.has(output)) continue;
    const members = data.publications.filter((p) => p.seriesId === series.id);
    queue.push({ kind: "series", id: series.id, title: series.name, outputPath: `public${output}`, referenceImagePaths: members.filter((p) => p.coverThumbnailUrl && assets.has(p.coverThumbnailUrl)).slice(0, 3).map((p) => resolve("public", p.coverThumbnailUrl!.slice(1))), prompt: `${style} Create one reusable visual identity for the series “${series.name}”. ${series.imagePrompt ?? series.description ?? ""} Reuse this same artwork across issues; dates and numbers are website text. Use supplied cover references for visual motifs without copying their lettering.` });
  }
  for (const item of data.publications) {
    if (item.seriesId || (item.thumbnailUrl && item.thumbnailSource !== "page" && item.thumbnailSource !== "none")) continue;
    const reference = item.coverThumbnailUrl ?? item.pageThumbnailUrl;
    queue.push({ kind: "publication", id: item.id, title: item.title, outputPath: `public/library/generated/${item.id}.png`, referenceImagePaths: reference && assets.has(reference) ? [resolve("public", reference.slice(1))] : [], prompt: `${style} Subject: “${item.title}”, category “${item.categoryName}”. ${item.summary ? `Context: ${item.summary}` : "Inspect the supplied cover and title to select a relevant motif; do not invent factual content."} Use the supplied cover as a visual reference if available. Preserve the publication's identity.` });
  }
  await atomicJson(paths.queue, queue);
  return queue;
}
if (process.argv[1]?.replaceAll("\\", "/").endsWith("/thumbnail-queue.ts")) console.log(`Prepared ${(await buildThumbnailQueue()).length} image requests. Generate chosen images, then rebuild the catalogue.`);
