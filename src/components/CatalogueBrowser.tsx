"use client";
import { useDeferredValue } from "react";
import { useSearchParams } from "next/navigation";
import { PublicationCard } from "@/components/PublicationCard";
import { useSaved } from "@/components/SaveButton";
import { normalizeSearch } from "@/lib/catalogue";
import type { Category, Publication, Series } from "@/lib/types";
export function CatalogueBrowser({ publications, categories, series = [] }: { publications: Publication[]; categories: Category[]; series?: Series[] }) {
  const params = useSearchParams();
  const query = params.get("q") ?? "";
  const needle = normalizeSearch(useDeferredValue(query));
  const category = params.get("category") ?? "";
  const seriesId = params.get("series") ?? "";
  const savedOnly = params.get("saved") === "1";
  const view = params.get("view") === "list" ? "list" : "grid";
  const saved = useSaved();
  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value); else next.delete(key);
    window.history.replaceState(null, "", `${window.location.pathname}${next.size ? `?${next}` : ""}`);
  }
  const tokens = needle.split(/\s+/u).filter(Boolean);
  const filtered = publications.filter((p) => {
    const text = normalizeSearch([p.title, p.author, p.summary, p.categoryName, ...(p.tags ?? []), series.find((s) => s.id === p.seriesId)?.name].filter(Boolean).join(" "));
    return tokens.every((token) => text.includes(token)) && (!category || p.categorySlug === category) && (!seriesId || p.seriesId === seriesId) && (!savedOnly || saved.includes(p.id));
  }).sort((a, b) => -1 * (a.publicationDate ?? a.modifiedTime ?? "").localeCompare(b.publicationDate ?? b.modifiedTime ?? ""));
  const active = !!(query || category || seriesId || savedOnly);
  const reset = () => window.history.replaceState(null, "", window.location.pathname);
  return <>
    <section className="catalogue-controls" aria-label="ප්‍රකාශන සෙවුම් සහ Filters">
      <label className="search-field"><span>ප්‍රකාශන සොයන්න</span><input type="search" value={query} onChange={(e) => update("q", e.target.value)} placeholder="මාතෘකාව, කර්තෘ හෝ වචනයක්…" /></label>
      {categories.length > 1 ? <label><span>Category</span><select value={category} onChange={(e) => update("category", e.target.value)}><option value="">සියලු Categories</option>{categories.map((c) => <option key={c.id} value={c.slug}>{c.name} ({c.publicationCount})</option>)}</select></label> : null}
    </section>
    <div className="results-heading"><strong role="status">Results {filtered.length}</strong><div className="view-controls"><button type="button" aria-pressed={savedOnly} onClick={() => update("saved", savedOnly ? "" : "1")}>♡ Bookmark</button><button type="button" aria-label="කවර ලෙස බලන්න" aria-pressed={view === "grid"} onClick={() => update("view", "")}>▦</button><button type="button" aria-label="ලැයිස්තුව ලෙස බලන්න" aria-pressed={view === "list"} onClick={() => update("view", "list")}>☷</button>{active ? <button type="button" onClick={reset}>Filter ඉවත් කරන්න</button> : null}</div></div>
    {savedOnly ? <p className="small-note">Bookmark කළ ප්‍රකාශන මෙම browser එකේ පමණක් තබාගනී.</p> : null}
    {filtered.length ? <div className={`publication-grid ${view === "list" ? "publication-list" : ""}`}>{filtered.map((p) => <PublicationCard key={p.id} publication={p} />)}</div> : <div className="empty-state"><h2>{savedOnly ? "තවම Bookmark කළ ප්‍රකාශන නොමැත" : "ගැළපෙන ප්‍රකාශන හමු නොවීය"}</h2><p>{savedOnly ? "පසුව කියවීමට ප්‍රකාශනයක හදවත සලකුණ තෝරන්න." : "වෙනත් වචනයක් සොයන්න හෝ Filter ඉවත් කරන්න."}</p><button className="button-secondary" onClick={reset}>සියලු ප්‍රකාශන</button></div>}
  </>;
}
