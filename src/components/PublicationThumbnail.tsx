import Image from "next/image";
import type { Publication } from "@/lib/types";
export function PublicationThumbnail({ publication: p, detail = false }: { publication: Publication; detail?: boolean }) {
  const illustrated = p.thumbnailSource === "series" || p.thumbnailSource === "generated";
  return <>{p.thumbnailUrl ? <Image src={p.thumbnailUrl} alt="" fill sizes={detail ? "300px" : "(max-width: 720px) 46vw, 230px"} priority={detail} /> : <span className="cover-fallback"><span aria-hidden="true">✦</span><strong>{p.thumbnailTitle || p.title}</strong>{p.thumbnailSubtitle ? <small>{p.thumbnailSubtitle}</small> : null}</span>}{illustrated ? <span className="thumbnail-caption" aria-hidden="true"><strong>{p.thumbnailTitle || p.title}</strong>{p.thumbnailSubtitle ? <span>{p.thumbnailSubtitle}</span> : null}</span> : null}</>;
}
