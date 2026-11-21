import { z } from 'zod';
import { PriceUnit } from '../common/enums';
import { Lkr } from '../common/primitives';

export const ServiceSnapshot = z.object({ name: z.string(), price: Lkr, unit: PriceUnit });
export type ServiceSnapshot = z.infer<typeof ServiceSnapshot>;
