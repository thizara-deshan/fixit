export interface NamedCategory {
  id: string;
  name: string;
  order: number;
}

/**
 * BR-02: trimmed, case-insensitive. Equal to a category name → that category.
 * Else a prefix of a category name and ≥ 4 characters → that category (first by `order` if several).
 * Otherwise null (the text is used as free text, BR-03).
 */
export function matchCategory<C extends NamedCategory>(
  q: string | undefined,
  categories: readonly C[],
): C | null {
  const t = (q ?? '').trim().toLowerCase();
  if (!t) return null;
  const sorted = [...categories].sort((a, b) => a.order - b.order);
  const exact = sorted.find((c) => c.name.toLowerCase() === t);
  if (exact) return exact;
  if (t.length < 4) return null;
  return sorted.find((c) => c.name.toLowerCase().startsWith(t)) ?? null;
}
