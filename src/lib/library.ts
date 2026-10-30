import data from "@/data/library.generated.json";
import type { LibraryData, Publication } from "@/lib/types";

export const library = data as LibraryData;

export function getPublication(slug: string) {
  return library.publications.find((publication) => publication.slug === slug);
}

export function getCategory(slug: string) {
  return library.categories.find((category) => category.slug === slug);
}

export function getCategoryPublications(slug: string) {
  return library.publications.filter((publication) => publication.categorySlug === slug);
}

export function formatDate(date: string | null) {
  if (!date) return null;
  return new Intl.DateTimeFormat("si-LK", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(new Date(`${date}T00:00:00`));
}

export function formatFileSize(bytes: number | null) {
  if (!bytes) return null;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function newestFirst(publications: Publication[]) {
  return [...publications].sort((a, b) => {
    const left = a.publicationDate ?? a.modifiedTime ?? "";
    const right = b.publicationDate ?? b.modifiedTime ?? "";
    return right.localeCompare(left);
  });
}
