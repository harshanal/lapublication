import { readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import sharp from "sharp";
let before = 0, after = 0;
for (const folder of ["thumbnails", "series", "generated"]) {
  const dir = resolve("public/library", folder);
  if (!existsSync(dir)) continue;
  for (const file of await readdir(dir)) {
    if (!/\.(png|jpg)$/i.test(file)) continue;
    const path = resolve(dir, file), bytes = await readFile(path);
    const image = sharp(bytes).rotate().resize({ width: 640, height: 900, fit: "inside", withoutEnlargement: true });
    const result = await (file.endsWith(".png") ? image.png({ palette: true, quality: 90 }) : image.jpeg({ quality: 82 })).toBuffer();
    before += bytes.length;
    if (result.length < bytes.length) { await writeFile(path, result); after += result.length; } else after += bytes.length;
  }
}
console.log(`Thumbnail assets: ${(before / 1024 / 1024).toFixed(2)} MB → ${(after / 1024 / 1024).toFixed(2)} MB.`);
