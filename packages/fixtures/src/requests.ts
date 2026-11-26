import {
  addDays,
  colomboToday,
  expiresAt,
  type RequestRecord,
  type RequestStatus,
  type TimeSlot,
} from '@fixit/contracts';
import { serviceId } from './providers';
import type { FxProvider, FxReview, FxService, FxUser } from './types';

const HOUR = 3_600_000;

export interface RequestSeed {
  ref: string;
  customer: Pick<FxUser, 'id' | 'mobile'>;
  provider: Pick<FxProvider, 'id' | 'userId'>;
  service: FxService;
  townId: string;
  preferredDate: string;
  slot: TimeSlot;
  addressLine1: string;
  description: string;
  createdAt: Date;
  /** Provider-made transitions after creation, oldest first. */
  steps: readonly {
    status: Exclude<RequestStatus, 'pending'>;
    at: Date;
    reason?: string;
    actor?: 'provider' | 'admin' | 'system'; // default provider (D-2)
  }[];
}

export function makeRequest(s: RequestSeed): RequestRecord {
  if (!s.customer.mobile) throw new Error(`makeRequest ${s.ref}: customer ${s.customer.id} has no mobile`);
  const last = s.steps.at(-1);
  const status: RequestStatus = last?.status ?? 'pending';
  const accepted = s.steps.some((st) => st.status === 'accepted');
  return {
    id: `r-${s.ref}`,
    ref: s.ref,
    customerId: s.customer.id,
    providerId: s.provider.id,
    providerUserId: s.provider.userId,
    serviceId: s.service.id,
    service: { name: s.service.name, price: s.service.price, unit: s.service.unit },
    preferredDate: s.preferredDate,
    slot: s.slot,
    townId: s.townId,
    addressLine1: s.addressLine1,
    addressLine2: null,
    description: s.description,
    customerMobile: s.customer.mobile,
    agreedPrice: accepted ? s.service.price : null,
    status,
    reason: last?.reason ?? null,
    closedBy: status === 'pending' || status === 'accepted' ? null : (last?.actor ?? 'provider'),
    createdAt: s.createdAt.toISOString(),
    updatedAt: (last?.at ?? s.createdAt).toISOString(),
    expiresAt: expiresAt(s.createdAt, s.preferredDate).toISOString(),
    completedAt: status === 'completed' && last ? last.at.toISOString() : null,
    events: [
      {
        status: 'pending',
        at: s.createdAt.toISOString(),
        actor: 'customer',
        actorUserId: s.customer.id,
        reason: null,
      },
      ...s.steps.map((st) => {
        const actor = st.actor ?? 'provider';
        return {
          status: st.status,
          at: st.at.toISOString(),
          actor,
          actorUserId: actor === 'provider' ? s.provider.userId : actor === 'admin' ? 'u-admin' : null,
          reason: st.reason ?? null,
        };
      }),
    ],
  };
}

interface ProtoRow {
  ref: string;
  customerId: string;
  service: number;
  townId: string;
  slot: TimeSlot;
  address: string;
  note: string;
  prefDays: number;
  createdHoursAgo: number;
  steps: readonly { status: Exclude<RequestStatus, 'pending'>; hoursAgo: number; reason?: string }[];
}

/** The prototype's 8 sample requests (provider p01), shifted relative to `now`. `service` = index in p01's services. */
const PROTOTYPE_REQUESTS: readonly ProtoRow[] = [
  {
    ref: 'FX-2061',
    customerId: 'u-olivia',
    service: 0,
    townId: 'colombo',
    slot: 'morning',
    address: '24 Galle Road',
    note: 'Water dripping under the kitchen sink cabinet.',
    prefDays: 3,
    createdHoursAgo: 2,
    steps: [],
  },
  {
    ref: 'FX-2059',
    customerId: 'u-james-carter',
    service: 2,
    townId: 'maharagama',
    slot: 'afternoon',
    address: '8 High Level Road',
    note: 'Old 150-litre geyser failed, need a replacement quote.',
    prefDays: 6,
    createdHoursAgo: 20,
    steps: [],
  },
  {
    ref: 'FX-2058',
    customerId: 'u-aisha-rahman',
    service: 1,
    townId: 'dehiwala-mount-lavinia',
    slot: 'evening',
    address: '15 Hill Street',
    note: 'Shower drains very slowly.',
    prefDays: 4,
    createdHoursAgo: 30,
    steps: [],
  },
  {
    ref: 'FX-2054',
    customerId: 'u-ethan-brooks',
    service: 3,
    townId: 'colombo',
    slot: 'morning',
    address: '41 Duplication Road',
    note: 'Swap two bathroom faucets.',
    prefDays: 0,
    createdHoursAgo: 96,
    steps: [{ status: 'accepted', hoursAgo: 72 }],
  },
  {
    ref: 'FX-2050',
    customerId: 'u-sophia-nguyen',
    service: 4,
    townId: 'colombo',
    slot: 'evening',
    address: '3 Flower Road',
    note: 'Burst pipe in the garage.',
    prefDays: 2,
    createdHoursAgo: 48,
    steps: [{ status: 'accepted', hoursAgo: 24 }],
  },
  {
    ref: 'FX-2046',
    customerId: 'u-olivia',
    service: 0,
    townId: 'dehiwala-mount-lavinia',
    slot: 'afternoon',
    address: '27 Station Road',
    note: 'Toilet base leaking.',
    prefDays: -3,
    createdHoursAgo: 144,
    steps: [
      { status: 'accepted', hoursAgo: 120 },
      { status: 'completed', hoursAgo: 48 },
    ],
  },
  {
    ref: 'FX-2041',
    customerId: 'u-rachel-owens',
    service: 1,
    townId: 'maharagama',
    slot: 'morning',
    address: '102 Old Kesbewa Road',
    note: 'Kitchen sink fully blocked.',
    prefDays: -40,
    createdHoursAgo: 1080,
    steps: [
      { status: 'accepted', hoursAgo: 1056 },
      { status: 'completed', hoursAgo: 936 },
    ],
  },
  {
    ref: 'FX-2037',
    customerId: 'u-marcus-lee',
    service: 2,
    townId: 'sri-jayawardenepura-kotte',
    slot: 'morning',
    address: '6 Parliament Road',
    note: 'Outside service area.',
    prefDays: -50,
    createdHoursAgo: 1296,
    steps: [{ status: 'declined', hoursAgo: 1272, reason: 'Outside my service area.' }],
  },
];

export function buildPrototypeRequests(
  now: Date,
  ctx: { users: readonly FxUser[]; providers: readonly FxProvider[]; services: readonly FxService[] },
): RequestRecord[] {
  const today = colomboToday(now);
  const at = (hoursAgo: number) => new Date(now.getTime() - hoursAgo * HOUR);
  const p01 = ctx.providers.find((p) => p.id === 'p01');
  if (!p01) throw new Error('fixtures: p01 missing');
  return PROTOTYPE_REQUESTS.map((row) => {
    const customer = ctx.users.find((u) => u.id === row.customerId);
    const service = ctx.services.find((s) => s.id === serviceId('p01', row.service));
    if (!customer || !service) throw new Error(`fixtures: bad prototype request ${row.ref}`);
    return makeRequest({
      ref: row.ref,
      customer,
      provider: p01,
      service,
      townId: row.townId,
      preferredDate: addDays(today, row.prefDays),
      slot: row.slot,
      addressLine1: row.address,
      description: row.note,
      createdAt: at(row.createdHoursAgo),
      steps: row.steps.map((st) => ({
        status: st.status,
        at: at(st.hoursAgo),
        ...(st.reason ? { reason: st.reason } : {}),
      })),
    });
  });
}

/** M07: Dilani has 5 pending requests (BR-33 limit), one each to p03–p07. */
export function buildLimitRequests(
  now: Date,
  ctx: { users: readonly FxUser[]; providers: readonly FxProvider[]; services: readonly FxService[] },
): RequestRecord[] {
  const today = colomboToday(now);
  const customer = ctx.users.find((u) => u.id === 'u-dilani');
  if (!customer) throw new Error('fixtures: u-dilani missing');
  return ['p03', 'p04', 'p05', 'p06', 'p07'].map((pid, i) => {
    const provider = ctx.providers.find((p) => p.id === pid);
    const service = ctx.services.find((s) => s.id === serviceId(pid, 0));
    const area = provider?.baseTownId;
    if (!provider || !service || !area) throw new Error(`fixtures: bad limit request for ${pid}`);
    return makeRequest({
      ref: `FX-${String(1990 + i)}`,
      customer,
      provider,
      service,
      townId: area,
      preferredDate: addDays(today, 4 + i),
      slot: 'morning',
      addressLine1: `${String(10 + i)} Temple Road`,
      description: 'Please come and take a look; details on the phone.',
      createdAt: new Date(now.getTime() - (5 + i) * HOUR),
      steps: [],
    });
  });
}

interface JourneyRow {
  ref: string;
  providerId: string;
  prefDays: number;
  createdHoursAgo: number;
  steps: readonly {
    status: Exclude<RequestStatus, 'pending'>;
    hoursAgo: number;
    actor?: 'provider' | 'admin' | 'system';
    reason?: string;
  }[];
  hiddenReview?: { rating: number; text: string; hoursAgo: number };
}

/** M09 (D-1): Olivia's requests in every state S15 renders. Providers p04–p07, p09, p10 are not used by other tests. */
const JOURNEY: readonly JourneyRow[] = [
  // Accepted, cut-off in the future (AC5)
  {
    ref: 'FX-2030',
    providerId: 'p04',
    prefDays: 5,
    createdHoursAgo: 30,
    steps: [{ status: 'accepted', hoursAgo: 20 }],
  },
  // Accepted, preferred date today → past the cut-off (AC5)
  {
    ref: 'FX-2031',
    providerId: 'p05',
    prefDays: 0,
    createdHoursAgo: 50,
    steps: [{ status: 'accepted', hoursAgo: 40 }],
  },
  // Pending that expires 6 minutes after seeding (AC6 mock sweep)
  { ref: 'FX-2032', providerId: 'p06', prefDays: 4, createdHoursAgo: 71.9, steps: [] },
  // Declined with a reason
  {
    ref: 'FX-2033',
    providerId: 'p07',
    prefDays: -5,
    createdHoursAgo: 300,
    steps: [{ status: 'declined', hoursAgo: 290, reason: 'Fully booked that week.' }],
  },
  // Declined by the system (provider suspended)
  {
    ref: 'FX-2034',
    providerId: 'p09',
    prefDays: -2,
    createdHoursAgo: 200,
    steps: [{ status: 'declined', hoursAgo: 190, actor: 'system', reason: 'Provider unavailable' }],
  },
  // Accepted, then cancelled by an admin
  {
    ref: 'FX-2035',
    providerId: 'p10',
    prefDays: -1,
    createdHoursAgo: 150,
    steps: [
      { status: 'accepted', hoursAgo: 140 },
      {
        status: 'cancelled',
        hoursAgo: 100,
        actor: 'admin',
        reason: 'The provider reported a family emergency.',
      },
    ],
  },
  // Expired at createdAt + 72 h
  {
    ref: 'FX-2036',
    providerId: 'p04',
    prefDays: -10,
    createdHoursAgo: 400,
    steps: [{ status: 'expired', hoursAgo: 328, actor: 'system' }],
  },
  // Completed 35 days ago → review window closed (AC8)
  {
    ref: 'FX-2029',
    providerId: 'p09',
    prefDays: -36,
    createdHoursAgo: 900,
    steps: [
      { status: 'accepted', hoursAgo: 890 },
      { status: 'completed', hoursAgo: 840 },
    ],
  },
  // Completed, reviewed, review hidden by an admin (S15.E6 Hidden pill)
  {
    ref: 'FX-2028',
    providerId: 'p10',
    prefDays: -15,
    createdHoursAgo: 400,
    steps: [
      { status: 'accepted', hoursAgo: 390 },
      { status: 'completed', hoursAgo: 350 },
    ],
    hiddenReview: { rating: 2, text: 'Arrived very late and left a mess behind.', hoursAgo: 340 },
  },
];

export function buildCustomerJourneyRequests(
  now: Date,
  ctx: { users: readonly FxUser[]; providers: readonly FxProvider[]; services: readonly FxService[] },
): { requests: RequestRecord[]; reviews: FxReview[] } {
  const today = colomboToday(now);
  const at = (hoursAgo: number) => new Date(now.getTime() - hoursAgo * HOUR);
  const customer = ctx.users.find((u) => u.id === 'u-olivia');
  if (!customer) throw new Error('fixtures: u-olivia missing');
  const requests: RequestRecord[] = [];
  const reviews: FxReview[] = [];
  for (const row of JOURNEY) {
    const provider = ctx.providers.find((p) => p.id === row.providerId);
    const service = ctx.services.find((s) => s.id === serviceId(row.providerId, 0));
    if (!provider?.baseTownId || !service) throw new Error(`fixtures: bad journey request ${row.ref}`);
    const r = makeRequest({
      ref: row.ref,
      customer,
      provider,
      service,
      townId: provider.baseTownId,
      preferredDate: addDays(today, row.prefDays),
      slot: 'afternoon',
      addressLine1: '24 Galle Road',
      description: 'Please take a look and tell me what it will cost.',
      createdAt: at(row.createdHoursAgo),
      steps: row.steps.map((st) => ({
        status: st.status,
        at: at(st.hoursAgo),
        ...(st.actor ? { actor: st.actor } : {}),
        ...(st.reason ? { reason: st.reason } : {}),
      })),
    });
    requests.push(r);
    if (row.hiddenReview)
      reviews.push({
        id: `v-${row.ref}`,
        requestId: r.id,
        providerId: provider.id,
        authorId: customer.id,
        rating: row.hiddenReview.rating,
        text: row.hiddenReview.text,
        visibility: 'hidden',
        createdAt: at(row.hiddenReview.hoursAgo).toISOString(),
        replyText: null,
        replyCreatedAt: null,
        replyUpdatedAt: null,
      });
  }
  return { requests, reviews };
}
