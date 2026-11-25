import { z } from 'zod';
import { PriceUnit } from '../common/enums';
import { Id, Lkr } from '../common/primitives';

export const Service = z.object({ id: Id, name: z.string(), price: Lkr, unit: PriceUnit });
export type Service = z.infer<typeof Service>;
