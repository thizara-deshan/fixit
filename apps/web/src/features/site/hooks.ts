import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/query-keys';
import { fetchCatalog, fetchFeatured } from './api';

/** Active categories/districts/towns. Changes rarely (admin F-34). */
export const useCatalog = () =>
  useQuery({ queryKey: qk.catalog, queryFn: fetchCatalog, staleTime: 5 * 60_000 });

/** BR-08 featured providers (≤ 4). */
export const useFeatured = () => useQuery({ queryKey: qk.featured, queryFn: fetchFeatured });
