import type { Publication } from "./types";

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
  return hash >>> 0;
}

export function selectVariedPublications(publications: Publication[], limit: number, seed: string) {
  if (limit <= 0) return [];
  const groups = new Map<string, Publication[]>();
  for (const publication of publications) {
    const group = groups.get(publication.categorySlug) ?? [];
    group.push(publication);
    groups.set(publication.categorySlug, group);
  }

  const categoryOrder = [...groups.keys()].sort((left, right) => {
    const rank = stableHash(`${seed}:category:${left}`) - stableHash(`${seed}:category:${right}`);
    return rank || left.localeCompare(right);
  });
  for (const [category, items] of groups) {
    items.sort((left, right) => {
      const rank = stableHash(`${seed}:${left.id}`) - stableHash(`${seed}:${right.id}`);
      return rank || left.id.localeCompare(right.id);
    });
    groups.set(category, items);
  }

  const selected: Publication[] = [];
  for (let round = 0; selected.length < limit; round++) {
    let added = false;
    for (const category of categoryOrder) {
      const publication = groups.get(category)?.[round];
      if (!publication) continue;
      selected.push(publication);
      added = true;
      if (selected.length === limit) break;
    }
    if (!added) break;
  }
  return selected;
}
