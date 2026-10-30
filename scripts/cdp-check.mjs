import { writeFile } from "node:fs/promises";

const port = process.argv[2] ?? "9223";
const screenshotPath = process.argv[3];
const pages = await fetch(`http://127.0.0.1:${port}/json`).then((response) => response.json());
const page = pages.find((item) => item.type === "page");
if (!page) throw new Error("No Chrome page found");

const socket = new WebSocket(page.webSocketDebuggerUrl);
const pending = new Map();
const errors = [];
let nextId = 1;

socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.method === "Runtime.exceptionThrown") errors.push(message.params.exceptionDetails.text);
  if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") errors.push("console.error");
  if (message.id && pending.has(message.id)) {
    pending.get(message.id)(message);
    pending.delete(message.id);
  }
});

await new Promise((resolve) => socket.addEventListener("open", resolve, { once: true }));
function send(method, params = {}) {
  const id = nextId++;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve) => pending.set(id, resolve));
}

await send("Runtime.enable");
await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
await send("Page.reload", { ignoreCache: true });
await new Promise((resolve) => setTimeout(resolve, 10000));
const result = await send("Runtime.evaluate", {
  returnByValue: true,
  expression: `JSON.stringify({
    title: document.title,
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    hasContent: document.body.innerText.trim().length > 100,
    errorOverlay: Boolean(document.querySelector('[data-nextjs-dialog], #webpack-dev-server-client-overlay')),
    readerLoading: document.body.innerText.includes('PDF කියවනය සූදානම් කරමින්'),
    readerToolbar: Boolean(document.querySelector('.reader-toolbar')),
    readerIframe: Boolean(document.querySelector('.reader-stage iframe'))
  })`
});
console.log(result.result.result.value);
console.log(JSON.stringify({ errors }));
if (screenshotPath) {
  const capture = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  await writeFile(screenshotPath, Buffer.from(capture.result.data, "base64"));
}
socket.close();
