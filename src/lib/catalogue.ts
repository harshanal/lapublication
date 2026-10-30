import type { CatalogueOverrides, LibraryData, Publication } from "./types";

export function normalizeSearch(value: string) {
  return value.normalize("NFC").replace(/[\u200B-\u200D\uFEFF]/gu, "").toLocaleLowerCase("si").trim();
}

export function applyOverrides(source: LibraryData, overrides: CatalogueOverrides, assets: Set<string>): LibraryData {
  const series = overrides.series ?? source.series ?? [];
  const slugs = new Set<string>();
  const ids = new Set<string>();
  const publications = source.publications.map((item): Publication => {
    const meta = overrides.publications?.[item.id] ?? {};
    const category = source.categories.find((c) => c.id === (meta.categoryId ?? item.categoryId));
    if (!category) throw new Error(`Unknown category for ${item.title}`);
    const publication = { ...item, ...meta, categoryId: category.id, categoryName: category.name, categorySlug: category.slug };
    if (ids.has(publication.id)) throw new Error(`Duplicate publication ID: ${publication.id}. Choose one main PDF per publication.`);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(publication.slug) || slugs.has(publication.slug)) throw new Error(`Invalid or duplicate URL slug: ${publication.slug}`);
    ids.add(publication.id);
    slugs.add(publication.slug);
    const generated = `/library/generated/${item.id}.png`;
    const seriesCover = series.find((s) => s.id === publication.seriesId)?.thumbnailUrl;
    const candidates = {
      cover: item.coverThumbnailUrl,
      generated: assets.has(generated) ? generated : null,
      series: seriesCover && assets.has(seriesCover) ? seriesCover : null,
      page: item.pageThumbnailUrl
    };
    const mode = meta.thumbnailMode ?? "auto";
    const choice = mode === "auto"
      ? (Object.entries(candidates).find(([, url]) => url && assets.has(url)) ?? ["none", null])
      : [mode, candidates[mode] && assets.has(candidates[mode]!) ? candidates[mode] : null];
    publication.thumbnailUrl = choice[1] || null;
    publication.thumbnailSource = (choice[1] ? choice[0] : "none") as Publication["thumbnailSource"];
    return publication;
  });
  return { ...source, series, publications: publications.filter((p) => p.status !== "hidden"), categories: source.categories.map((c) => ({ ...c, publicationCount: publications.filter((p) => p.categoryId === c.id && p.status !== "hidden").length })) };
}

export function compareCatalogues(previous: LibraryData, next: LibraryData) {
  const before = new Map(previous.publications.map((p) => [p.id, p]));
  const after = new Map(next.publications.map((p) => [p.id, p]));
  return {
    added: next.publications.filter((p) => !before.has(p.id)),
    updated: next.publications.filter((p) => { const old = before.get(p.id); return old && (old.modifiedTime !== p.modifiedTime || old.title !== p.title || old.categoryId !== p.categoryId || old.driveFileId !== p.driveFileId); }),
    removed: previous.publications.filter((p) => !after.has(p.id))
  };
}
