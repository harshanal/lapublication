import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CatalogueBrowser } from "@/components/CatalogueBrowser";
import { getCategory, library } from "@/lib/library";
import type { Metadata } from "next";
export const dynamicParams = false;
export function generateStaticParams() { return library.categories.map((c) => ({ slug: c.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; const category = getCategory(slug); return { title: category?.name ?? "Category", description: category ? `${category.name} — ලොව්තුරු අරණ සදහම් ප්‍රකාශන ${category.publicationCount}` : undefined, alternates: { canonical: `/category/${slug}` } }; }
export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();
  return <main id="main-content" className="app-shell"><div className="page-heading"><Link className="back-link" href="/publications">← සියලු ප්‍රකාශන</Link><h1>{category.name}</h1><p>ප්‍රකාශන {category.publicationCount}</p></div><Suspense fallback={<p>නාමාවලිය සූදානම් කරමින්…</p>}><CatalogueBrowser publications={library.publications.filter((p) => p.categorySlug === slug)} categories={[category]} series={library.series} /></Suspense></main>;
}
