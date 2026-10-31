import { Suspense } from "react";
import { CatalogueBrowser } from "@/components/CatalogueBrowser";
import { library } from "@/lib/library";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "සියලු ප්‍රකාශන", alternates: { canonical: "/publications" } };
export default function PublicationsPage() {
  return <main id="main-content" className="app-shell"><div className="page-heading"><p className="eyebrow">Browse the library</p><h1>සියලු ප්‍රකාශන</h1><p>ප්‍රකාශන මාතෘකාවක් සොයන්න හෝ Category අනුව Filter කරන්න.</p></div><Suspense fallback={<p>නාමාවලිය සූදානම් කරමින්…</p>}><CatalogueBrowser publications={library.publications} categories={library.categories} series={library.series} /></Suspense></main>;
}
