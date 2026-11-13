import type { MetadataRoute } from "next";
import { library } from "@/lib/library";
import { SITE_URL } from "@/lib/site";
import { LISTENER_QUESTIONS } from "@/lib/listener-questions";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const catalogueUpdated = library.syncedAt || undefined;
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: catalogueUpdated, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/publications`, lastModified: catalogueUpdated, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}${LISTENER_QUESTIONS.path}`, changeFrequency: "yearly", priority: 0.7 }
  ];
  const categories: MetadataRoute.Sitemap = library.categories
    .filter((category) => category.publicationCount > 0)
    .map((category) => ({
      url: `${SITE_URL}/category/${category.slug}`,
      lastModified: catalogueUpdated,
      changeFrequency: "monthly",
      priority: 0.7
    }));
  const publications: MetadataRoute.Sitemap = library.publications.map((publication) => ({
    url: `${SITE_URL}/publications/${publication.slug}`,
    lastModified: publication.modifiedTime || publication.publicationDate || catalogueUpdated,
    changeFrequency: "yearly",
    priority: 0.8,
    images: publication.thumbnailUrl ? [`${SITE_URL}${publication.thumbnailUrl}`] : undefined
  }));

  return [...staticPages, ...categories, ...publications];
}
