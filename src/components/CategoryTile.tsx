import Image from "next/image";
import Link from "next/link";
import type { Category } from "@/lib/types";

const categoryArtwork: Record<string, string> = {
  "sadaham-poth": "/library/category-backgrounds/sadaham-poth.webp",
  "likhitha-deshana": "/library/category-backgrounds/likhitha-deshana.webp",
  "sadaham-pathrika": "/library/category-backgrounds/sadaham-pathrika.webp",
  "puwathpath-lipi": "/library/category-backgrounds/puwathpath-lipi.webp",
  "wandana-poth-saha-pathrika": "/library/category-backgrounds/wandana-poth-saha-pathrika.webp",
  "deshana-suchi": "/library/category-backgrounds/deshana-suchi.webp",
  "english-publications": "/library/category-backgrounds/english-publications.webp",
  "wenath-prakashana": "/library/category-backgrounds/wenath-prakashana.webp",
};

export function CategoryTile({ category, index }: { category: Category; index: number }) {
  const artwork = categoryArtwork[category.slug];
  return (
    <Link className={`category-tile category-tone-${(index % 8) + 1}`} href={`/category/${category.slug}`}>
      {artwork ? <Image className="category-tile-art" src={artwork} alt="" aria-hidden="true" fill sizes="(max-width: 720px) 50vw, 232px" /> : null}
      <strong>{category.name}</strong>
      <span>ප්‍රකාශන {category.publicationCount.toLocaleString("si-LK")}</span>
    </Link>
  );
}
