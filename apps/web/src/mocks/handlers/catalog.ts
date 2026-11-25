import { ENDPOINTS as E, selectFeatured } from '@fixit/contracts';
import { mockEndpoint } from '../lib/endpoint';
import { listedCards } from '../lib/cards';
import { discoverSearch } from '../lib/discover';

// Keep /providers/featured before /providers/:id (M07).
export const catalogHandlers = [
  mockEndpoint(E.catalog_get, ({ db: d }) => {
    const districts = [...d.districts].sort((a, b) => a.order - b.order);
    const districtOrder = new Map(districts.map((x, i) => [x.id, i]));
    const towns = d.towns
      .filter((t) => t.active && districtOrder.has(t.districtId))
      .sort(
        (a, b) =>
          (districtOrder.get(a.districtId) ?? 0) - (districtOrder.get(b.districtId) ?? 0) ||
          a.order - b.order,
      );
    return {
      categories: d.categories
        .filter((c) => c.active)
        .sort((a, b) => a.order - b.order)
        .map(({ id, name, blurb, icon, order }) => ({ id, name, blurb, icon, order })),
      districts: districts.map(({ id, name, order }) => ({ id, name, order })),
      towns: towns.map(({ id, name, districtId }) => ({ id, name, districtId })),
    };
  }),
  mockEndpoint(E.providers_featured, ({ db: d }) => selectFeatured(listedCards(d))),
  mockEndpoint(E.providers_search, ({ db: d, query }) => discoverSearch(d, query)),
];
