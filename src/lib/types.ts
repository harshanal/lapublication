export type Category = {
  id: string;
  name: string;
  slug: string;
  publicationCount: number;
};

export type Publication = {
  id: string;
  driveFileId: string;
  title: string;
  slug: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  author: string | null;
  publicationDate: string | null;
  summary: string;
  language: "si" | "en";
  featured: boolean;
  pdfUrl: string;
  downloadUrl: string;
  thumbnailUrl: string | null;
  fileSize: number | null;
  modifiedTime: string | null;
  seriesId?: string | null;
  tags?: string[];
  status?: "published" | "hidden";
  coverThumbnailUrl?: string | null;
  pageThumbnailUrl?: string | null;
  thumbnailSource?: "cover" | "page" | "generated" | "series" | "none";
  thumbnailTitle?: string;
  thumbnailSubtitle?: string;
};

export type Series = { id: string; name: string; description?: string; imagePrompt?: string; thumbnailUrl?: string | null };

export type LibraryData = {
  version: 1;
  syncedAt: string | null;
  sourceFolderUrl: string;
  isDemo: boolean;
  categories: Category[];
  publications: Publication[];
  series?: Series[];
};

export type CatalogueOverrides = {
  publications?: Record<
    string,
    Partial<
      Pick<
        Publication,
        | "title"
        | "slug"
        | "author"
        | "publicationDate"
        | "summary"
        | "language"
        | "featured"
        | "seriesId"
        | "tags"
        | "categoryId"
        | "thumbnailTitle"
        | "thumbnailSubtitle"
      >
    > & { status?: "published" | "hidden"; thumbnailFileId?: string; thumbnailMode?: "auto" | "cover" | "generated" | "series" | "page" }
  >;
  files?: Record<string, { role: "main" | "cover" | "ignore"; publicationId?: string }>;
  series?: Series[];
};
