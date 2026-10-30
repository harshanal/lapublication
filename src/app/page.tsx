import Image from "next/image";
import Link from "next/link";
import { CategoryTile } from "@/components/CategoryTile";
import { PublicationCard } from "@/components/PublicationCard";
import { library } from "@/lib/library";

export default function HomePage() {
  const books = library.publications.filter((publication) => publication.categorySlug === "sadaham-poth");
  const leaflets = library.publications.filter((publication) => publication.categorySlug === "sadaham-pathrika").slice(0, 4);
  const otherPublications = library.publications.filter((publication) => !["sadaham-poth", "sadaham-pathrika"].includes(publication.categorySlug)).slice(0, 8);

  return (
    <main id="main-content" className="app-shell">
      <section className="library-hero">
        <div className="hero-copy">
          <h1 className="hero-title">ලොව්තුරු අරණ සදහම් පුස්තකාලය</h1>
          <p>අනුරාධපුර කටුකැලියායේ ශ්‍රී අරණ විහාර වාසී පූජ්‍යපාද මාපලගම සුසිලවංශ හිමියන් විසින් රචිත සහ උන්වහන්සේගේ සද්ධර්ම දේශනා ඇසුරින් සම්පාදනය කර ඇති සදහම් පොත්, පත්‍රිකා, ලිඛිත දේශනා සහ දේශනා සුචි පහසුවෙන් සොයා PDF ලෙස කියවීමට හෝ බාගැනීමට සකස් කළ නාමාවලියකි.</p>
          <form action="/publications" className="hero-search"><label className="sr-only" htmlFor="home-search">ප්‍රකාශන සොයන්න</label><input id="home-search" type="search" name="q" placeholder="මාතෘකාවක් හෝ වචනයක් සොයන්න…" /><button type="submit">ප්‍රකාශන සොයන්න</button></form>
        </div>
        <div className="hero-artwork" aria-hidden="true">
          <Image src="/library/generated/buddha-hero.png" alt="" width={1154} height={1216} priority />
        </div>
      </section>

      {library.isDemo ? (
        <aside className="notice-band"><strong>ආරම්භක නාමාවලිය</strong><span>මෙය දැනට Drive එකතුවෙන් තෝරාගත් ආරම්භක දත්ත වේ. සම්පූර්ණ එකතුව සඳහා දේශීය <code>pnpm sync:drive</code> ක්‍රියාවලිය ධාවනය කරන්න.</span></aside>
      ) : null}

      <section className="section-band">
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
