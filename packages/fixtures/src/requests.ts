import {
  addDays,
  colomboToday,
  expiresAt,
  type RequestRecord,
  type RequestStatus,
  type TimeSlot,
} from '@fixit/contracts';
import { serviceId } from './providers';
import type { FxProvider, FxService, FxUser } from './types';

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
  steps: readonly { status: Exclude<RequestStatus, 'pending'>; at: Date; reason?: string }[];
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
    closedBy: status === 'declined' || status === 'completed' ? 'provider' : null,
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
      ...s.steps.map((st) => ({
        status: st.status,
        at: st.at.toISOString(),
        actor: 'provider' as const,
        actorUserId: s.provider.userId,
        reason: st.reason ?? null,
      })),
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
