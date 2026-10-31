"use client";

import { useState } from "react";

export function SharePublication({ title, url }: { title: string; url: string }) {
  const [message, setMessage] = useState("");
  const shareText = `${title} | ලොව්තුරු අරණ සදහම් පුස්තකාලය`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setMessage("Link එක Copy කළා.");
    } catch {
      setMessage("Link එක Copy කළ නොහැකි විය. Browser address bar එකෙන් Copy කරන්න.");
    }
  }

  async function share() {
    if (!navigator.share) {
      await copyLink();
      return;
    }

    try {
      await navigator.share({ title, text: shareText, url });
      setMessage("");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setMessage("Share කළ නොහැකි විය. Copy link භාවිතා කරන්න.");
    }
  }

  return (
    <section className="share-publication" aria-label="මෙම ප්‍රකාශනය Share කරන්න">
      <strong>Share</strong>
      <div className="share-actions">
        <button type="button" onClick={share}>Share</button>
        <button type="button" onClick={copyLink}>Copy link</button>
        <a href={`https://wa.me/?text=${encodeURIComponent(`${shareText}\n${url}`)}`} target="_blank" rel="noopener noreferrer">WhatsApp ↗</a>
        <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer">Facebook ↗</a>
      </div>
      <p className="share-status" role="status" aria-live="polite">{message}</p>
    </section>
  );
}
