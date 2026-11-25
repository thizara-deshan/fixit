import { z } from 'zod';
import { colomboStartOfDay, formatInColombo } from '../common/dates';
import {
  CategoryIcon,
  PriceUnit,
  RequestActor,
  RequestStatus,
  ReviewVisibility,
  TimeSlot,
} from '../common/enums';
import { Id, IsoDate, IsoDateTime, Lkr, Mobile, MobileInput, RequestRef } from '../common/primitives';
import { bookingWindow } from './rules';

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

/** D-1: the SPEC message must be the first issue on an empty field. */
const required = (message: string) => z.string({ error: message }).min(1, message);

const longDate = (isoDate: string): string => formatInColombo(colomboStartOfDay(isoDate), 'EEE, d MMM yyyy');

/** SPEC S12 date range error, e.g. `Choose a date from Mon, 23 Nov 2026 to Thu, 21 Jan 2027.` */
export function bookingWindowMessage(now: Date): string {
  const { min, max } = bookingWindow(now);
  return `Choose a date from ${longDate(min)} to ${longDate(max)}.`;
}

export const CreateRequestBody = z.object({
  providerId: Id,
  serviceId: required('Choose a service.').pipe(Id),
  preferredDate: required('Choose a date.').pipe(IsoDate),
  slot: z.enum(TimeSlot.options, { error: 'Choose a time slot.' }),
  townId: required('Choose your town.').pipe(Id),
  addressLine1: z
    .string()
    .trim()
    .min(1, 'Enter your address.')
    .min(5, 'Enter a fuller address so the provider can find you.')
    .max(120, 'Keep each address line under 120 characters.'),
  addressLine2: z
    .string()
    .trim()
    .max(120, 'Keep each address line under 120 characters.')
    .optional()
    .transform((s) => (s === '' ? undefined : s)),
  description: z
    .string()
    .trim()
    .min(20, 'Describe the job in at least 20 characters.')
    .max(1000, 'Keep the description under 1,000 characters.'),
  mobile: MobileInput.optional(), // required only when the profile has none (rule mobile_missing)
});
export type CreateRequestBody = z.infer<typeof CreateRequestBody>;

/** Form schema: adds the BR-34 window for a given `now`. The server uses the rule `date_out_of_window` instead (D-2). */
export const makeCreateRequestSchema = (now: Date) =>
  CreateRequestBody.superRefine((v, ctx) => {
    if (typeof v.preferredDate !== 'string' || !IsoDate.safeParse(v.preferredDate).success) return;
    const { min, max } = bookingWindow(now);
    if (v.preferredDate < min || v.preferredDate > max)
      ctx.addIssue({ code: 'custom', path: ['preferredDate'], message: bookingWindowMessage(now) });
  });

export const StatusEvent = z.object({
  status: RequestStatus,
  at: IsoDateTime,
  actor: RequestActor,
  actorName: z.string().nullable(), // filled in admin views only
  reason: z.string().nullable(),
});
export type StatusEvent = z.infer<typeof StatusEvent>;

const RequestBase = z.object({
  ref: RequestRef,
  status: RequestStatus,
  service: ServiceSnapshot,
  preferredDate: IsoDate,
  slot: TimeSlot,
  town: z.object({ id: Id, name: z.string() }),
  description: z.string(),
  agreedPrice: Lkr.nullable(),
  reason: z.string().nullable(),
  closedBy: RequestActor.nullable(),
  createdAt: IsoDateTime,
  updatedAt: IsoDateTime,
  expiresAt: IsoDateTime,
  completedAt: IsoDateTime.nullable(),
  history: z.array(StatusEvent),
});

export const CustomerRequestView = RequestBase.extend({
  provider: z.object({
    id: Id,
    businessName: z.string(),
    photoUrl: z.string().nullable(),
    categoryIcon: CategoryIcon,
    verified: z.boolean(),
    rating: z.number().nullable(),
    reviewCount: z.number().int(),
    listed: z.boolean(),
    mobile: Mobile.nullable(), // only when accepted | completed (§6.3)
  }),
  addressLine1: z.string(),
  addressLine2: z.string().nullable(),
  customerMobile: Mobile,
  cancelDeadline: IsoDateTime,
  canCancel: z.boolean(),
  review: z
    .object({
      eligible: z.boolean(),
      deadline: IsoDateTime.nullable(),
      own: z
        .object({
          id: Id,
          rating: z.number().int(),
          text: z.string(),
          createdAt: IsoDateTime,
          visibility: ReviewVisibility,
        })
        .nullable(),
    })
    .nullable(), // null unless completed
});
export type CustomerRequestView = z.infer<typeof CustomerRequestView>;
