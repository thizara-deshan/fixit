import { z } from 'zod';
import { CategoryIcon, PriceUnit } from '../common/enums';
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
