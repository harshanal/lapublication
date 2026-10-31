"use client";

import { useState } from "react";

function ShareIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="m8.2 10.8 7.6-4.5M8.2 13.2l7.6 4.5" /></svg>;
}

function LinkIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 13.8 8.2 15.6a4 4 0 0 1-5.7-5.7l3-3a4 4 0 0 1 5.7 0" /><path d="m14 10.2 1.8-1.8a4 4 0 1 1 5.7 5.7l-3 3a4 4 0 0 1-5.7 0" /><path d="m8.5 15.5 7-7" /></svg>;
}

function WhatsAppIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 11.8a8.4 8.4 0 0 1-12.4 7.4L3.5 20.5l1.3-4.4a8.4 8.4 0 1 1 15.7-4.3Z" /><path d="M8.2 7.8c.4-.4.8-.3 1 .1l1 2c.2.4.1.7-.2 1l-.7.7c.7 1.5 1.8 2.6 3.3 3.3l.7-.8c.3-.3.6-.4 1-.2l2 1c.4.2.5.6.2 1-1 1.4-2.2 1.8-3.8 1.3a10.2 10.2 0 0 1-5.8-5.8c-.5-1.5-.1-2.7 1.3-3.6Z" /></svg>;
}

function FacebookIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 21v-8h2.8l.4-3H14V8.1c0-.9.3-1.6 1.7-1.6h1.8V3.8c-.3 0-1.4-.1-2.6-.1-2.6 0-4.3 1.6-4.3 4.5V10H7.7v3h2.9v8H14Z" /></svg>;
}

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
        <button type="button" onClick={share} aria-label="Share" title="Share"><ShareIcon /></button>
        <button type="button" onClick={copyLink} aria-label="Copy link" title="Copy link"><LinkIcon /></button>
        <a href={`https://wa.me/?text=${encodeURIComponent(`${shareText}\n${url}`)}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp වෙත Share කරන්න" title="WhatsApp"><WhatsAppIcon /></a>
        <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" aria-label="Facebook වෙත Share කරන්න" title="Facebook"><FacebookIcon /></a>
      </div>
      <p className="share-status" role="status" aria-live="polite">{message}</p>
    </section>
  );
}
