import { z } from 'zod';
import { PriceUnit } from '../common/enums';
import { Lkr, RequestRef } from '../common/primitives';

export const ServiceSnapshot = z.object({ name: z.string(), price: Lkr, unit: PriceUnit });
export type ServiceSnapshot = z.infer<typeof ServiceSnapshot>;

export const Eligibility = z.discriminatedUnion('state', [
  z.object({ state: z.literal('ok') }),
  z.object({ state: z.literal('guest') }), // only produced client-side
  z.object({ state: z.literal('admin') }), // client-side on S3 (D-2); kept for completeness
  z.object({ state: z.literal('own_listing') }),
  z.object({ state: z.literal('provider_unavailable') }),
  z.object({ state: z.literal('provider_paused') }),
  z.object({ state: z.literal('email_unconfirmed') }),
  z.object({ state: z.literal('open_with_provider'), ref: RequestRef }),
  z.object({ state: z.literal('open_limit_reached') }),
]); // order of evaluation = SPEC S3.E7 table; mobile_missing is not a block (S12 asks inline)
export type Eligibility = z.infer<typeof Eligibility>;
