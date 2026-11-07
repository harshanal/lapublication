import Link from "next/link";
import { PublicationThumbnail } from "@/components/PublicationThumbnail";
import { formatDate } from "@/lib/library";
import type { Publication } from "@/lib/types";
import { SaveButton } from "@/components/SaveButton";

export function PublicationCard({ publication, showAuthor = true }: { publication: Publication; showAuthor?: boolean }) {
  const publicationDate = formatDate(publication.publicationDate);

  return (
    <article className="publication-card">
      <Link className="publication-cover" href={`/publications/${publication.slug}`} aria-label={`${publication.title} කියවන්න`}>
        <PublicationThumbnail publication={publication} />
      </Link>
      <div className="publication-card-body">
        <Link className="category-label" href={`/category/${publication.categorySlug}`}>
          {publication.categoryName}
        </Link>
        <h3><Link href={`/publications/${publication.slug}`}>{publication.title}</Link></h3>
        {showAuthor && publication.author ? <p className="author-line">{publication.author}</p> : null}
        {publicationDate ? <div className="publication-meta"><span>{publicationDate}</span></div> : null}
        <div className="card-actions"><Link href={`/publications/${publication.slug}`}>කියවන්න →</Link><SaveButton id={publication.id} /></div>
      </div>
    </article>
  );
}
