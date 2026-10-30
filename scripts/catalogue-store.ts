import { existsSync } from "node:fs";
import { readFile, writeFile, rename, readdir, mkdir } from "node:fs/promises";
import { resolve, relative } from "node:path";
import { applyOverrides } from "../src/lib/catalogue";
import type { CatalogueOverrides, LibraryData } from "../src/lib/types";

export const paths = {
  source: resolve("src/data/library.source.json"),
  catalogue: resolve("src/data/library.generated.json"),
  overrides: resolve("src/data/catalog.overrides.json"),
  pending: resolve(".library/drive-preview.json"),
  queue: resolve("src/data/thumbnail-queue.generated.json")
};

export async function readJson<T>(path: string): Promise<T> { return JSON.parse(await readFile(path, "utf8")) as T; }
export async function atomicJson(path: string, value: unknown) {
  await mkdir(resolve(path, ".."), { recursive: true });
  const temp = `${path}.${process.pid}.tmp`;
  await writeFile(temp, JSON.stringify(value, null, 2) + "\n", "utf8");
  await rename(temp, path);
}
export async function assetPaths() {
  const root = resolve("public");
  const assets = new Set<string>();
  async function walk(dir: string) {
    if (!existsSync(dir)) return;
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = resolve(dir, entry.name);
      if (entry.isDirectory()) await walk(path);
      else assets.add("/" + relative(root, path).replaceAll("\\", "/"));
    }
  }
  await walk(resolve(root, "library"));
  return assets;
}
export async function rebuildCatalogue() {
  const source = await readJson<LibraryData>(existsSync(paths.source) ? paths.source : paths.catalogue);
  const overrides = await readJson<CatalogueOverrides>(paths.overrides);
  const data = applyOverrides(source, overrides, await assetPaths());
  await atomicJson(paths.catalogue, data);
  return data;
}
