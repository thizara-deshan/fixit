import { ENDPOINTS as E, type CatalogResponse, type ProviderCard } from '@fixit/contracts';
import { http, pathOf } from '@/lib/http';

export const fetchCatalog = (): Promise<CatalogResponse> =>
  http(pathOf(E.catalog_get), { schema: E.catalog_get.response });

export const fetchFeatured = (): Promise<ProviderCard[]> =>
  http(pathOf(E.providers_featured), { schema: E.providers_featured.response });
