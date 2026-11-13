import { mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const target = new URL(".library/google-questions/", root);
const secretFile = new URL(".library/question-shared-secret.txt", root);
await mkdir(target, { recursive: true });
let secret;
try { secret = (await readFile(secretFile, "utf8")).trim(); }
catch (error) {
  if (error.code !== "ENOENT") throw error;
  secret = randomBytes(32).toString("hex");
  await writeFile(secretFile, secret, { flag: "wx", mode: 0o600 });
}
if (!/^[a-f0-9]{64}$/.test(secret)) throw new Error("Existing shared secret has an unexpected format; it was preserved.");
await copyFile(new URL("integrations/google-questions/Code.gs", root), new URL("Code.gs", target));
await copyFile(new URL("integrations/google-questions/appsscript.json", root), new URL("appsscript.json", target));
await writeFile(new URL("Secrets.gs", target), `// Private deployment file; never commit.\nconst BOOTSTRAP_SHARED_SECRET = ${JSON.stringify(secret)};\n`, { mode: 0o600 });
console.log(`Prepared private Apps Script source: ${fileURLToPath(target)}`);
console.log("The shared secret remains in the ignored .library folder and is not printed.");
