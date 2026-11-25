import { PAGE_SIZE } from '../common/pagination';

/** S3.E13: base town first, the rest alphabetical by name (en, case-insensitive). */
export function orderAreas<T extends { name: string; isBase: boolean }>(areas: readonly T[]): T[] {
  const base = areas.filter((a) => a.isBase);
  const rest = areas
    .filter((a) => !a.isBase)
    .sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));
  return [...base, ...rest];
}

/** Decision 003: page 1 = 5 newest, page n ≥ 2 = next 10. */
export function reviewsWindow(page: number): { offset: number; limit: number } {
  if (page <= 1) return { offset: 0, limit: PAGE_SIZE.reviewsFirst };
  return {
    offset: PAGE_SIZE.reviewsFirst + (page - 2) * PAGE_SIZE.reviewsMore,
    limit: PAGE_SIZE.reviewsMore,
  };
}

export function reviewsTotalPages(total: number): number {
  if (total === 0) return 0;
  if (total <= PAGE_SIZE.reviewsFirst) return 1;
  return 1 + Math.ceil((total - PAGE_SIZE.reviewsFirst) / PAGE_SIZE.reviewsMore);
}
