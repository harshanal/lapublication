import { describe, expect, it } from "vitest";
import type { Publication } from "./types";
import { selectVariedPublications } from "./homepage-selection";

function publication(id: string, categorySlug: string): Publication {
  return {
    id,
    driveFileId: id,
    title: id,
    slug: id,
    categoryId: categorySlug,
    categoryName: categorySlug,
    categorySlug,
    author: null,
    publicationDate: null,
    summary: "",
    language: "si",
    featured: false,
    pdfUrl: "",
    downloadUrl: "",
    thumbnailUrl: null,
    fileSize: null,
    modifiedTime: null
  };
}

describe("varied homepage selection", () => {
  const catalogue = [
    ...Array.from({ length: 7 }, (_, index) => publication(`news-${index}`, "news")),
    ...Array.from({ length: 6 }, (_, index) => publication(`worship-${index}`, "worship")),
    publication("index-1", "indexes"),
    publication("index-2", "indexes"),
    publication("english-1", "english"),
    publication("other-1", "other")
  ];

  it("rotates through categories before repeating them", () => {
    const selected = selectVariedPublications(catalogue, 8, "catalogue-update");
    expect(new Set(selected.slice(0, 5).map((item) => item.categorySlug)).size).toBe(5);
    const counts = Object.values(Object.groupBy(selected, (item) => item.categorySlug)).map((items) => items?.length ?? 0);
    expect(Math.max(...counts)).toBeLessThanOrEqual(2);
  });

  it("is stable for one catalogue seed and changes with a new seed", () => {
    const first = selectVariedPublications(catalogue, 8, "catalogue-update").map((item) => item.id);
    expect(selectVariedPublications(catalogue, 8, "catalogue-update").map((item) => item.id)).toEqual(first);
    expect(selectVariedPublications(catalogue, 8, "next-update").map((item) => item.id)).not.toEqual(first);
  });
});
