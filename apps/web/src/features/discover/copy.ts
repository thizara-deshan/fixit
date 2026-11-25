import type { CatalogResponse, DiscoverQuery } from '@fixit/contracts';
import { tickedCategories } from './url-state';

export const resultsTitle = (n: number) => (n === 1 ? '1 provider found' : `${String(n)} providers found`);
export const showCountLabel = (n: number) => (n === 1 ? 'Show 1 provider' : `Show ${String(n)} providers`);

/** `Showing {label} in {Town | all locations}` (S2.E8). */
export function contextLine(state: DiscoverQuery, catalog: CatalogResponse): string {
  const ticked = tickedCategories(state, catalog.categories).filter((id) =>
    catalog.categories.some((c) => c.id === id),
  );
  const freeText = state.q && ticked.length === 0 ? state.q : null;
  let label = 'all services';
  if (ticked.length === 1) label = catalog.categories.find((c) => c.id === ticked[0])?.name ?? 'all services';
  else if (ticked.length > 1) label = `${String(ticked.length)} categories`;
  else if (freeText) label = `“${freeText}”`;
  const town = catalog.towns.find((t) => t.id === state.loc)?.name ?? 'all locations';
  return `Showing ${label} in ${town}`;
}
