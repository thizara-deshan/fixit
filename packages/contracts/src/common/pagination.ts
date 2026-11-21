import { z } from 'zod';

export const PageQuery = z.object({ page: z.coerce.number().int().min(1).catch(1).default(1) });

export const paginated = <T extends z.ZodType>(item: T) =>
  z.object({
    items: z.array(item),
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
    total: z.number().int().min(0),
    totalPages: z.number().int().min(0),
  });
export const PAGE_SIZE = {
  discover: 10,
  myRequests: 20,
  providerRequests: 20,
  admin: 25,
  reviewsFirst: 5,
  reviewsMore: 10,
} as const;

export type PageQuery = z.infer<typeof PageQuery>;
