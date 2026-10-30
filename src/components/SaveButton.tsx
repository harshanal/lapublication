"use client";
import { useSyncExternalStore, useState } from "react";
const key = "dhamma-library:saved:v1";
const subscribe = (callback: () => void) => { window.addEventListener("storage", callback); window.addEventListener("library-saved", callback); return () => { window.removeEventListener("storage", callback); window.removeEventListener("library-saved", callback); }; };
const snapshot = () => { try { return localStorage.getItem(key) ?? "[]"; } catch { return "[]"; } };
const serverSnapshot = () => "[]";
export function useSaved() {
  const raw = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  try { const data: unknown = JSON.parse(raw); return Array.isArray(data) ? data.filter((v): v is string => typeof v === "string") : []; } catch { return []; }
}
export function SaveButton({ id }: { id: string }) {
  const saved = useSaved();
  const [error, setError] = useState(false);
  const active = saved.includes(id);
  const label = active ? "Bookmark ලැයිස්තුවෙන් ඉවත් කරන්න" : "පසුව කියවීමට Bookmark කරන්න";
  return <span className="save-control"><button className="save-button" type="button" aria-label={label} title={label} aria-pressed={active} onClick={() => { try { localStorage.setItem(key, JSON.stringify(active ? saved.filter((v) => v !== id) : [...saved, id])); window.dispatchEvent(new Event("library-saved")); setError(false); } catch { setError(true); } }}><span aria-hidden="true">{active ? "♥" : "♡"}</span></button>{error ? <small role="status">මෙම browser එකේ Bookmark කළ නොහැක.</small> : null}</span>;
}
