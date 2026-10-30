import { PublicationThumbnail } from "@/components/PublicationThumbnail";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PdfReaderShell } from "@/components/PdfReaderShell";
import { SaveButton } from "@/components/SaveButton";
import { PublicationCard } from "@/components/PublicationCard";
import { formatDate, formatFileSize, getPublication, library } from "@/lib/library";
export const dynamicParams = false;
export function generateStaticParams() { return library.publications.map((p) => ({ slug: p.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const p = getPublication(slug); return { title: p?.title ?? "ප්‍රකාශනය", description: p?.summary || p?.title }; }
export default async function PublicationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getPublication(slug);
  if (!p) notFound();
  const series = library.series?.find((s) => s.id === p.seriesId);
  const related = library.publications.filter((item) => item.id !== p.id && (series ? item.seriesId === series.id : item.categoryId === p.categoryId)).slice(0, 4);
  return <main id="main-content" className="app-shell">
    <nav className="breadcrumbs" aria-label="ඔබ සිටින ස්ථානය"><Link href="/publications">සියලු ප්‍රකාශන</Link><span>/</span><Link href={`/category/${p.categorySlug}`}>{p.categoryName}</Link></nav>
    <section className="publication-detail-header"><div className="detail-cover"><PublicationThumbnail publication={p} detail /></div><div className="detail-copy"><h1>{p.title}</h1>{p.author ? <p>{p.author}</p> : null}{p.summary ? <p className="detail-summary">{p.summary}</p> : null}{series ? <Link className="series-link" href={`/publications?series=${series.id}`}>{series.name} · ප්‍රකාශන මාලාව →</Link> : null}<dl className="detail-meta"><div><dt>ගොනු වර්ගය</dt><dd>PDF {formatFileSize(p.fileSize) ? `· ${formatFileSize(p.fileSize)}` : ""}</dd></div>{p.publicationDate ? <div><dt>ප්‍රකාශිත දිනය</dt><dd>{formatDate(p.publicationDate)}</dd></div> : null}</dl><div className="detail-actions"><a className="button-primary" href="#reader">කියවන්න ↓</a><a className="button-secondary" href={p.downloadUrl} target="_blank" rel="noopener noreferrer">Download PDF ↗</a><SaveButton id={p.id} /></div><p className="small-note">PDF ගොනුව Google Drive හරහා විවෘත වේ.</p></div></section>
    <div id="reader"><PdfReaderShell url={p.pdfUrl} title={p.title} downloadUrl={p.downloadUrl} /></div>
    {related.length ? <section className="section-band"><div className="section-heading"><h2>{series ? "මෙම ප්‍රකාශන මාලාවෙන්" : "තවත් කියවන්න"}</h2></div><div className="publication-grid">{related.map((item) => <PublicationCard key={item.id} publication={item} />)}</div></section> : null}
  </main>;
}
