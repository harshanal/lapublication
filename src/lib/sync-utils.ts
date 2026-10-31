import type { Category, Publication } from "@/lib/types";

export type FileRole = "main" | "cover" | "ignore";

const COVER_PATTERN = /(cover|front[ _-]?page|පිට[ _-]?කවර|කවරය)/iu;
const IGNORE_PATTERN = /(correction|errata|නිවැරදි[ _-]?කිරීම්|print[ _-]?(a[45]|booklet))/iu;

const CATEGORY_SLUGS: Record<string, string> = {
  "1rTV7SDQ6OOdiTS_wO0_ZmOko20X8pfi8": "sadaham-poth",
  "1rMI9f3cpgg-_G_BlzV0kQe_utbv-f85q": "wandana-poth-saha-pathrika",
  "1wRQt0rnCRM0Qc_BsOSEWbtQvac14QDHl": "deshana-suchi",
  "1rhZyqlE59z04Y87rLcgjFMUX7yYMLRgs": "sadaham-pathrika",
  "1riBDcWWI0vzdaEK3eD51reDPlXDq--iE": "likhitha-deshana",
  "1JI-SpaWfyp5zEdymOyoFIOA10C4OvSkS": "english-publications",
  "1tKDV3ZUzs1rDMUiF3LHYjeGXgHUKCAvG": "wenath-prakashana",
  "1DthYI_gQsld_VoXvhpSC4KxUa5eAw0Q9": "puwathpath-lipi",
  "1o3OB1GGDKrjzPyudZ4_U3-JGPoF5lDXY": "sadaham-poth",
  "1oBKID1pPgrYcyX9q0O2Y_RqBQiu8UTwe": "wandana-poth-saha-pathrika",
  "1A4jKaIHbdVcveaDZh3V-I5IC9ryDK0xN": "deshana-suchi",
  "1JmHAjSmh4ikJJ7S-0zEqURvyaQT4Zi3k": "sadaham-pathrika",
  "1gI76qbY3AO2_jEjPdIk03S9pedZ0--oS": "likhitha-deshana",
  "1fxeczchVAzAQSJguU14vlLd6OK2M9y3n": "english-publications"
};

const CATEGORY_ORDER = [
  "sadaham-poth",
  "likhitha-deshana",
  "sadaham-pathrika",
  "puwathpath-lipi",
  "wandana-poth-saha-pathrika",
  "deshana-suchi",
  "english-publications",
  "wenath-prakashana"
];

export function inferRole(name: string, mimeType: string): FileRole {
  if (mimeType.startsWith("image/") || COVER_PATTERN.test(name)) return "cover";
  if (IGNORE_PATTERN.test(name)) return "ignore";
  return mimeType === "application/pdf" ? "main" : "ignore";
}

export function cleanTitle(name: string) {
  return name
    .replace(/\.pdf$/iu, "")
    .replaceAll("_", " ")
    .replace(/\s*[-–—]?\s*\b(?:a[345]\s*(?:page\s*size|size)?|page\s*size|single\s*page)\b/giu, " ")
    .replace(/\s*[-–—]?\s*\b(?:large|larger|small|smaller)\s*fonts?\b/giu, " ")
    .replace(/\s*[-–—]?\s*\b\d+\s*(?:pg|pages?)\b\s*[-–—]?\s*/giu, " ")
    .replace(/පිටු\s*\d+\s*(?:පොත)?/gu, " ")
    .replace(/\b(?:version|ver)\s*\.?\s*\d+(?:\.\d+)*\b/giu, " ")
    .replace(/\bv\d+(?:\.\d+)*\b/giu, " ")
    .replace(/\)\s*(?=\S)/gu, ") ")
    .replace(/(?:\s*[-–—]\s*){2,}/gu, " - ")
    .replace(/\s*[-–—]\s*$/gu, "")
    .replace(/\s{2,}/gu, " ")
    .replace(/\s+([,.;:!?])/gu, "$1")
    .replace(/([([])\s+/gu, "$1")
    .replace(/\s+([)\]])/gu, "$1")
    .trim();
}

export function asciiSlug(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function categorySlug(id: string, name: string) {
  return CATEGORY_SLUGS[id] ?? (asciiSlug(name) || `category-${id.slice(0, 8).toLowerCase()}`);
}

export function publicationSlug(id: string, title: string, previous?: string) {
  return previous || asciiSlug(title) || `publication-${id.replace(/[^a-z0-9]/gi, "").slice(0, 12).toLowerCase()}`;
}

export function duplicateContentPairs<T extends { name: string; md5Checksum?: string }>(files: T[]) {
  const firstByHash = new Map<string, T>();
  const duplicates: Array<{ original: T; duplicate: T }> = [];
  for (const file of files) {
    if (!file.md5Checksum) continue;
    const hash = file.md5Checksum.toLowerCase();
    const original = firstByHash.get(hash);
    if (original) duplicates.push({ original, duplicate: file });
    else firstByHash.set(hash, file);
  }
  return duplicates;
}

export function buildCounts(categories: Omit<Category, "publicationCount">[], publications: Publication[]): Category[] {
  return [...categories]
    .sort((left, right) => {
      const leftRank = CATEGORY_ORDER.indexOf(left.slug);
      const rightRank = CATEGORY_ORDER.indexOf(right.slug);
      return (leftRank < 0 ? CATEGORY_ORDER.length : leftRank) - (rightRank < 0 ? CATEGORY_ORDER.length : rightRank);
    })
    .map((category) => ({ ...category, publicationCount: publications.filter((item) => item.categoryId === category.id).length }));
}
