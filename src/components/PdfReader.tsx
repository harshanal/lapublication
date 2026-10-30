"use client";
import { useRef, useState } from "react";
export function PdfReader({ url, title, downloadUrl }: { url: string; title: string; downloadUrl: string }) {
  const container = useRef<HTMLElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");
  const openUrl = url.includes("drive.google.com/file/") ? url.replace(/\/preview$/, "/view") : url;
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (container.current?.requestFullscreen) await container.current.requestFullscreen();
      else setMessage("පූර්ණ තිරය සඳහා Google Drive සබැඳිය විවෘත කරන්න.");
    } catch { setMessage("පූර්ණ තිරය සඳහා Google Drive සබැඳිය විවෘත කරන්න."); }
  }
  return <section ref={container} className="pdf-reader" aria-label={`${title} PDF කියවනය`}>
    <div className="reader-toolbar"><span>PDF කියවනය</span><button type="button" onClick={fullscreen}>Full screen</button><a href={openUrl} target="_blank" rel="noopener noreferrer">වෙනම විවෘත කරන්න ↗</a><a href={downloadUrl} target="_blank" rel="noopener noreferrer">Download ↗</a></div>
    <p className="reader-help">{message || "කියවනය නොපෙනේ නම් වෙනම විවෘත කරන්න හෝ PDF ගොනුව බාගන්න."}</p>
    {!loaded ? <p className="reader-help" role="status">PDF ගොනුව විවෘත කරමින්…</p> : null}
    <div className="reader-stage"><iframe src={url} title={title} onLoad={() => setLoaded(true)} allowFullScreen /></div>
  </section>;
}
