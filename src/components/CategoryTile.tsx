import Link from "next/link";
import type { Category } from "@/lib/types";

export function CategoryTile({ category, index }: { category: Category; index: number }) {
  return (
    <Link className={`category-tile category-tone-${(index % 8) + 1}`} href={`/category/${category.slug}`}>
      <strong>{category.name}</strong>
      <span>ප්‍රකාශන {category.publicationCount.toLocaleString("si-LK")}</span>
    </Link>
  );
}
