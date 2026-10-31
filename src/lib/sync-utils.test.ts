import { describe, expect, it } from "vitest";
import { buildCounts, categorySlug, cleanTitle, duplicateContentPairs, inferRole, publicationSlug } from "./sync-utils";

describe("Drive catalogue inference", () => {
  it("recognizes cover and correction files", () => {
    expect(inferRole("Book Cover HD.png", "image/png")).toBe("cover");
    expect(inferRole("පිට කවරය.pdf", "application/pdf")).toBe("cover");
    expect(inferRole("නිවැරදි කිරීම්.pdf", "application/pdf")).toBe("ignore");
  });

  it("publishes ordinary PDFs", () => {
    expect(inferRole("සෝවාන් ඵලය.pdf", "application/pdf")).toBe("main");
  });

  it("cleans common filename noise and keeps stable fallback slugs", () => {
    expect(cleanTitle("නිබ්බාන_පටිපදා.pdf")).toBe("නිබ්බාන පටිපදා");
    expect(cleanTitle("The Extraordinary Qualities of The Supreme Lord Buddha-6Pg-v2.pdf")).toBe("The Extraordinary Qualities of The Supreme Lord Buddha");
    expect(cleanTitle("නිබ්බාන පටිපදා-Larger Fonts 09-2022.pdf")).toBe("නිබ්බාන පටිපදා 09-2022");
    expect(cleanTitle("මහා ඤාණ පූජාව පිටු 32 පොත 01 වෙනි සංස්කරණය.pdf")).toBe("මහා ඤාණ පූජාව 01 වෙනි සංස්කරණය");
    expect(cleanTitle("වන්දනා කරමු! (26.03.2025 Ed 01).pdf")).toBe("වන්දනා කරමු! (26.03.2025 Ed 01)");
    expect(publicationSlug("ABC_123", "සිංහල මාතෘකාව")).toBe("publication-abc123");
    expect(publicationSlug("ABC_123", "Title", "existing-slug")).toBe("existing-slug");
  });

  it("uses the stable top-level category mapping", () => {
    expect(categorySlug("1JmHAjSmh4ikJJ7S-0zEqURvyaQT4Zi3k", "anything")).toBe("sadaham-pathrika");
    expect(categorySlug("1DthYI_gQsld_VoXvhpSC4KxUa5eAw0Q9", "anything")).toBe("puwathpath-lipi");
    expect(buildCounts([
      { id: "other", name: "Other", slug: "wenath-prakashana" },
      { id: "leaflets", name: "Leaflets", slug: "sadaham-pathrika" },
      { id: "books", name: "Books", slug: "sadaham-poth" }
    ], []).map((category) => category.slug)).toEqual(["sadaham-poth", "sadaham-pathrika", "wenath-prakashana"]);
  });

  it("detects the same PDF uploaded again under a different name", () => {
    const files = [
      { name: "පළමු නම.pdf", md5Checksum: "ABC123" },
      { name: "වෙනත් නම.pdf", md5Checksum: "abc123" },
      { name: "වෙනත් ලිපිය.pdf", md5Checksum: "def456" }
    ];
    expect(duplicateContentPairs(files)).toEqual([{ original: files[0], duplicate: files[1] }]);
  });
});
