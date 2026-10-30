import { Suspense } from "react";
import { CatalogueBrowser } from "@/components/CatalogueBrowser";
import { library } from "@/lib/library";
export const metadata = { title: "සියලු ප්‍රකාශන" };
export default function PublicationsPage() {
  return <main id="main-content" className="app-shell"><div className="page-heading"><p className="eyebrow">Browse the library</p><h1>සියලු ප්‍රකාශන</h1><p>මාතෘකාවක් සොයන්න. Category හෝ භාෂාව අනුව Filter කරන්න.</p></div><Suspense fallback={<p>නාමාවලිය සූදානම් කරමින්…</p>}><CatalogueBrowser publications={library.publications} categories={library.categories} series={library.series} /></Suspense></main>;
}
