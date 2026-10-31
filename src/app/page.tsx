import Image from "next/image";
import Link from "next/link";
import { CategoryTile } from "@/components/CategoryTile";
import { PublicationCard } from "@/components/PublicationCard";
import { selectVariedPublications } from "@/lib/homepage-selection";
import { library } from "@/lib/library";
import type { Metadata } from "next";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function HomePage() {
  const books = library.publications.filter((publication) => publication.categorySlug === "sadaham-poth");
  const leaflets = library.publications.filter((publication) => publication.categorySlug === "sadaham-pathrika").slice(0, 4);
  const otherPublications = selectVariedPublications(
    library.publications.filter((publication) => !["sadaham-poth", "sadaham-pathrika"].includes(publication.categorySlug)),
    8,
    library.syncedAt ?? "lowthuru-arana-library"
  );

  return (
    <main id="main-content" className="app-shell">
      <section className="library-hero">
        <div className="hero-copy">
          <h1 className="hero-title">ලොව්තුරු අරණ සදහම් පුස්තකාලය</h1>
          <div className="hero-description">
            <p>බුදුරජාණන් වහන්සේ විසින් දේශිත ශ්‍රී සද්ධර්මය අනාගත පරපුර වෙනුවෙන් සුරක්ෂිත කරමින්, ධර්මාවබෝධය අපේක්ෂා කරන සියලු දෙනාගේ ප්‍රයෝජනය පිණිස සකස් කරන ලද ලොව්තුරු අරණ සදහම් පුස්තකාලය වෙත ඔබ සැම සාදරයෙන් පිළිගනිමු.</p>
            <p>අනුරාධපුර, කටුකැලියේ ශ්‍රී අරණ විහාරවාසී පූජ්‍යපාද මාපලගම සුසිලවංශ හිමිපාණන් වහන්සේ විසින් රචිත සදහම් ග්‍රන්ථ මෙන්ම, උන්වහන්සේගේ අර්ථපූර්ණ සද්ධර්ම දේශනා ඇසුරින් සම්පාදනය කරන ලද පොත්පත්, පත්‍රිකා, ලිඛිත ධර්ම දේශනා සහ දේශනා සුචි ද මෙහි අන්තර්ගත වේ.</p>
            <p>මෙම නාමාවලිය තුළින් සදහම් ග්‍රන්ථ හා දේශනා පහසුවෙන් සොයාගෙන, PDF ආකාරයෙන් කියවීමට හෝ බාගත කරගැනීමට අවස්ථාව සලසා ඇත.</p>
            <p>ධර්මය ශ්‍රවණය කිරීමෙන්, කියවීමෙන්, විමසීමෙන් හා නුවණින් මෙනෙහි කිරීමෙන් සම්මා දිට්ඨිය වර්ධනය කරගෙන, නිවන් මඟ අවබෝධ කරගැනීමට මෙම සදහම් පුස්තකාලය සියලු දෙනාට උපකාරී වේවා!</p>
            <p>මෙම උතුම් ධර්ම දානය සියලු සත්වයන්ගේ නිවන් අවබෝධය පිණිසම හේතු වාසනා වේවා!</p>
          </div>
          <form action="/publications" className="hero-search"><label className="sr-only" htmlFor="home-search">ප්‍රකාශනය සොයන්න</label><input id="home-search" type="search" name="q" placeholder="ප්‍රකාශන මාතෘකාව සොයන්න…" /><button type="submit">ප්‍රකාශනය සොයන්න</button></form>
        </div>
        <figure className="hero-artwork">
          <Image src="/library/generated/buddha-hero.png" alt="" aria-hidden="true" width={1154} height={1216} priority />
          <figcaption className="hero-quote">
            <blockquote>
              <p>“සබ්බදානං ධම්මදානං ජිනාති”</p>
              <p>“සියලු දානයන් අතර ධර්ම දානය උතුම් වන්නේය.”</p>
            </blockquote>
            <cite>(ධම්මපදය)</cite>
          </figcaption>
        </figure>
      </section>

      {library.isDemo ? (
        <aside className="notice-band"><strong>ආරම්භක නාමාවලිය</strong><span>මෙය දැනට Drive එකතුවෙන් තෝරාගත් ආරම්භක දත්ත වේ. සම්පූර්ණ එකතුව සඳහා දේශීය <code>pnpm sync:drive</code> ක්‍රියාවලිය ධාවනය කරන්න.</span></aside>
      ) : null}

      <section id="categories" className="section-band">
        <div className="section-heading"><div><p className="eyebrow">Categories</p><h2>ඔබට අවශ්‍ය සදහම් ප්‍රකාශනය තෝරන්න</h2></div><Link href="/publications">සියලු ප්‍රකාශන</Link></div>
        <div className="category-grid">{library.categories.map((category, index) => <CategoryTile key={category.id} category={category} index={index} />)}</div>
      </section>

      {books.length ? (
        <section className="section-band">
          <div className="section-heading"><div><p className="eyebrow">Books</p><h2>සදහම් පොත්</h2></div><Link href="/category/sadaham-poth">සියලු පොත්</Link></div>
          <div className="publication-grid">{books.map((publication) => <PublicationCard key={publication.id} publication={publication} />)}</div>
        </section>
      ) : null}

      {leaflets.length ? (
        <section className="section-band">
          <div className="section-heading"><div><p className="eyebrow">පහසුවෙන් කියවන්න</p><h2>සදහම් පත්‍රිකා</h2></div><Link href="/category/sadaham-pathrika">සියලු පත්‍රිකා</Link></div>
          <div className="publication-grid">{leaflets.map((publication) => <PublicationCard key={publication.id} publication={publication} />)}</div>
        </section>
      ) : null}

      <section className="section-band">
        <div className="section-heading"><div><p className="eyebrow">පුස්තකාලයෙන්</p><h2>අනෙකුත් ප්‍රකාශන</h2></div><Link href="/publications">සියලු ප්‍රකාශන</Link></div>
        <div className="publication-grid">{otherPublications.map((publication) => <PublicationCard key={publication.id} publication={publication} />)}</div>
      </section>
    </main>
  );
}
