import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

for (const filename of [".env.local", ".env"]) {
  const path = resolve(process.cwd(), filename);
  if (!existsSync(path)) continue;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
}
