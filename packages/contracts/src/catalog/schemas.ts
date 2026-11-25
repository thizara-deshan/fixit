import { z } from 'zod';
import { CategoryIcon, PriceUnit, SortKey } from '../common/enums';
import { paginated } from '../common/pagination';
import { Id, Lkr } from '../common/primitives';

export const Category = z.object({
  id: Id,
  name: z.string(),
  blurb: z.string(),
  icon: CategoryIcon,
  order: z.number().int(),
});
export type Category = z.infer<typeof Category>;

export const District = z.object({ id: Id, name: z.string(), order: z.number().int() });
export type District = z.infer<typeof District>;

export const Town = z.object({ id: Id, name: z.string(), districtId: Id });
export type Town = z.infer<typeof Town>;

export const TownRef = Town.pick({ id: true, name: true });
export type TownRef = z.infer<typeof TownRef>;

/** Active categories and towns only. Categories by admin `order`; districts by `order`; towns by district order, then town order. */
export const CatalogResponse = z.object({
  categories: z.array(Category),
  districts: z.array(District),
  towns: z.array(Town),
});
export type CatalogResponse = z.infer<typeof CatalogResponse>;

export const StartingPrice = z.object({ amount: Lkr, unit: PriceUnit });
export type StartingPrice = z.infer<typeof StartingPrice>;

export const ProviderCard = z.object({
  id: Id,
  businessName: z.string(),
  photoUrl: z.string().nullable(), // "/api/files/photos/…" or null → category-icon tile
  category: Category.pick({ id: true, name: true, icon: true }),
  baseTown: TownRef,
  yearsExperience: z.number().int(),
  bio: z.string(),
  verified: z.boolean(),
  paused: z.boolean(),
  rating: z.number().min(1).max(5).nullable(), // 1 dp, null → "New" (BR-27)
  reviewCount: z.number().int().min(0),
  startingPrice: StartingPrice, // BR-10
});
export type ProviderCard = z.infer<typeof ProviderCard>;

const csvIds = z
  .string()
  .transform((s) => [
    ...new Set(
      s
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean),
    ),
  ])
  .pipe(z.array(Id).max(20));

/** URL params and GET /providers query share this shape (SPEC §8.2). Invalid values → defaults (.catch). */
export const DiscoverQuery = z.object({
  q: z
    .string()
    .trim()
    .max(80)
    .optional()
    .catch(undefined)
    .transform((s) => (s ? s : undefined)),
  loc: Id.optional().catch(undefined),
  cat: csvIds
    .optional()
    .catch(undefined)
    .transform((a) => (a && a.length > 0 ? a : undefined)),
  rating: z.enum(['3.5', '4', '4.5']).optional().catch(undefined),
  verified: z.literal('1').optional().catch(undefined),
  price: z.enum(['2000', '5000', '10000']).optional().catch(undefined),
  sort: SortKey.catch('rating').default('rating'),
  page: z.coerce.number().int().min(1).catch(1).default(1),
});
export type DiscoverQuery = z.infer<typeof DiscoverQuery>;

export const DiscoverResult = paginated(ProviderCard).extend({
  categoryCounts: z.record(Id, z.number().int()), // per category, all OTHER filters applied (BR-05)
  matchedCategoryId: Id.nullable(), // BR-02
});
export type DiscoverResult = z.infer<typeof DiscoverResult>;
