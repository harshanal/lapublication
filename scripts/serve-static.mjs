import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { resolve, sep, extname } from "node:path";
const root = resolve("out");
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".txt": "text/plain", ".jpg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".woff": "font/woff", ".woff2": "font/woff2" };
createServer(async (req, res) => {
  try {
    if (!["GET", "HEAD"].includes(req.method)) { res.writeHead(405); return res.end(); }
    const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    const base = resolve(root, "." + pathname);
    if (base !== root && !base.startsWith(root + sep)) { res.writeHead(403); return res.end(); }
    let file;
    for (const candidate of [base, base + ".html", resolve(base, "index.html")]) { if ((await stat(candidate).catch(() => null))?.isFile()) { file = candidate; break; } }
    if (!file) { res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" }); return createReadStream(resolve(root, "404.html")).on("error", () => res.end("Build the website first with pnpm build.")).pipe(res); }
    res.writeHead(200, { "Content-Type": types[extname(file)] || "application/octet-stream", "X-Content-Type-Options": "nosniff" });
    if (req.method === "HEAD") return res.end();
    createReadStream(file).pipe(res);
  } catch { res.writeHead(400); res.end("Invalid request"); }
}).listen(3012, "127.0.0.1", () => console.log("Static library preview: http://127.0.0.1:3012"));
