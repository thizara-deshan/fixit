import { PROTOTYPE_PROVIDER_IDS, WRITTEN_REVIEWS } from './prototype-reviews';
import type { AccountStatus, AuthMethod } from '@fixit/contracts';
import type { FxUser } from './types';

/** Dev/test seeds only (ARCH §8.3). */
export const DEMO_PASSWORD = 'demo1234';
/** M04: the mock "Continue with Google" always signs in as this Google-only user. */
export const GOOGLE_MOCK_USER_ID = 'u-sanduni';
export const FILLER_CUSTOMER_COUNT = 40;
const DAY = 86_400_000;

export const mobileNo = (n: number): string => `+9477${String(n).padStart(7, '0')}`;
export const fillerCustomerId = (i: number): string => `u-c${String(i + 1).padStart(2, '0')}`;
export const writtenAuthorId = (providerId: string, index: number): string =>
  `u-w-${providerId}-${String(index + 1)}`;

const SURNAME_BY_INITIAL: Record<string, string> = {
  A: 'Amarasinghe',
  B: 'Bandara',
  C: 'Cooray',
  D: 'Dissanayake',
  E: 'Ekanayake',
  F: 'Fonseka',
  G: 'Gunawardena',
  H: 'Herath',
  J: 'Jayasuriya',
  K: 'Karunaratne',
  L: 'Liyanage',
  M: 'Mendis',
  N: 'Nanayakkara',
  O: 'Obeyesekere',
  P: 'Peiris',
  R: 'Ratnayake',
  S: 'Senanayake',
  T: 'Tennakoon',
  V: 'Vithana',
  W: 'Wickramasinghe',
  Y: 'Yapa',
  Z: 'Zoysa',
};
const FILLER_FIRST = [
  'Amal',
  'Chamari',
  'Dilshan',
  'Fathima',
  'Gayan',
  'Harini',
  'Isuru',
  'Janani',
  'Kavindu',
  'Lakmini',
];
const FILLER_LAST = ['Perera', 'Fernando', 'Silva', 'Jayasinghe'];

interface UserSeed {
  id: string;
  email: string;
  fullName: string;
  mobile: string | null;
  isAdmin?: boolean;
  confirmed?: boolean;
  status?: AccountStatus;
  authMethods?: AuthMethod[];
}

const CORE_USERS: readonly UserSeed[] = [
  { id: 'u-admin', email: 'admin@fixit.test', fullName: 'Fixit Admin', mobile: null, isAdmin: true },
  { id: 'u-olivia', email: 'olivia@fixit.test', fullName: 'Olivia Martinez', mobile: mobileNo(1001) },
  { id: 'u-nimal', email: 'nimal@fixit.test', fullName: 'Nimal Perera', mobile: null, confirmed: false },
  { id: 'u-kasun', email: 'kasun@fixit.test', fullName: 'Kasun Silva', mobile: mobileNo(1002) },
  // M04: Google-only account (mock "Continue with Google" signs in here) and a suspended account
  {
    id: 'u-sanduni',
    email: 'sanduni@fixit.test',
    fullName: 'Sanduni Wijesinghe',
    mobile: mobileNo(1003),
    authMethods: ['google'],
  },
  {
    id: 'u-ruwan',
    email: 'ruwan@fixit.test',
    fullName: 'Ruwan Jayasekara',
    mobile: mobileNo(1004),
    status: 'suspended',
  },
  // provider owners (p01–p10)
  { id: 'u-marcus', email: 'marcus@fixit.test', fullName: 'Marcus Bell', mobile: mobileNo(1101) },
  { id: 'u-dana', email: 'dana@fixit.test', fullName: 'Dana Ortiz', mobile: mobileNo(1102) },
  { id: 'u-priya', email: 'priya@fixit.test', fullName: 'Priya Nair', mobile: mobileNo(1103) },
  { id: 'u-alicia', email: 'alicia@fixit.test', fullName: 'Alicia Gomez', mobile: mobileNo(1104) },
  { id: 'u-tom', email: 'tom@fixit.test', fullName: 'Tom Whitaker', mobile: mobileNo(1105) },
  { id: 'u-jamal', email: 'jamal@fixit.test', fullName: 'Jamal Carter', mobile: mobileNo(1106) },
  { id: 'u-lena', email: 'lena@fixit.test', fullName: 'Lena Fischer', mobile: mobileNo(1107) },
  { id: 'u-hank', email: 'hank@fixit.test', fullName: 'Hank Morales', mobile: mobileNo(1108) },
  { id: 'u-kevin', email: 'kevin@fixit.test', fullName: 'Kevin Tran', mobile: mobileNo(1109) },
  { id: 'u-grace', email: 'grace@fixit.test', fullName: 'Grace Kim', mobile: mobileNo(1110) },
  // named customers from the prototype sample requests
  {
    id: 'u-james-carter',
    email: 'james.carter@fixit.test',
    fullName: 'James Carter',
    mobile: mobileNo(1201),
  },
  {
    id: 'u-aisha-rahman',
    email: 'aisha.rahman@fixit.test',
    fullName: 'Aisha Rahman',
    mobile: mobileNo(1202),
  },
  {
    id: 'u-ethan-brooks',
    email: 'ethan.brooks@fixit.test',
    fullName: 'Ethan Brooks',
    mobile: mobileNo(1203),
  },
  {
    id: 'u-sophia-nguyen',
    email: 'sophia.nguyen@fixit.test',
    fullName: 'Sophia Nguyen',
    mobile: mobileNo(1204),
  },
  { id: 'u-daniel-kim', email: 'daniel.kim@fixit.test', fullName: 'Daniel Kim', mobile: mobileNo(1205) },
  {
    id: 'u-rachel-owens',
    email: 'rachel.owens@fixit.test',
    fullName: 'Rachel Owens',
    mobile: mobileNo(1206),
  },
  { id: 'u-marcus-lee', email: 'marcus.lee@fixit.test', fullName: 'Marcus Lee', mobile: mobileNo(1207) },
];

function writtenAuthorSeeds(): UserSeed[] {
  let n = 0;
  return PROTOTYPE_PROVIDER_IDS.flatMap((pid) =>
    WRITTEN_REVIEWS[pid].map((w, i) => {
      n += 1;
      const [first = '', initial = ''] = w.author.split(' ');
      const letter = initial.charAt(0);
      return {
        id: writtenAuthorId(pid, i),
        email: `reviewer.${pid}.${String(i + 1)}@fixit.test`,
        fullName: `${first} ${SURNAME_BY_INITIAL[letter] ?? letter}`,
        mobile: mobileNo(4000 + n),
      };
    }),
  );
}

function fillerSeeds(): UserSeed[] {
  return Array.from({ length: FILLER_CUSTOMER_COUNT }, (_, i) => ({
    id: fillerCustomerId(i),
    email: `customer${String(i + 1).padStart(2, '0')}@fixit.test`,
    fullName: `${FILLER_FIRST[i % FILLER_FIRST.length] ?? 'Amal'} ${FILLER_LAST[Math.floor(i / FILLER_FIRST.length)] ?? 'Perera'}`,
    mobile: mobileNo(3000 + i),
  }));
}

export function buildUsers(now: Date): FxUser[] {
  const createdAt = new Date(now.getTime() - 400 * DAY).toISOString();
  return [...CORE_USERS, ...writtenAuthorSeeds(), ...fillerSeeds()].map((s) => ({
    id: s.id,
    email: s.email,
    fullName: s.fullName,
    isAdmin: s.isAdmin ?? false,
    status: s.status ?? 'active',
    emailConfirmedAt: s.confirmed === false ? null : createdAt,
    mobile: s.mobile,
    authMethods: s.authMethods ?? ['password'],
    createdAt,
  }));
}

/** DevPanel "Sign in as" (ARCH §4.5), test `signInAs`, and e2e logins. */
export const DEMO_PERSONAS = [
  { key: 'customer', label: 'Customer (Olivia Martinez)', email: 'olivia@fixit.test', userId: 'u-olivia' },
  {
    key: 'customerUnconfirmed',
    label: 'Customer, unconfirmed (Nimal Perera)',
    email: 'nimal@fixit.test',
    userId: 'u-nimal',
  },
  {
    key: 'provider',
    label: 'Provider, verified (Marcus Bell / Bell & Sons)',
    email: 'marcus@fixit.test',
    userId: 'u-marcus',
  },
  {
    key: 'providerNotSubmitted',
    label: 'Provider, not submitted (Hank Morales)',
    email: 'hank@fixit.test',
    userId: 'u-hank',
  },
  {
    key: 'providerDraft',
    label: 'Provider draft (Kasun Silva, onboarding step 3)',
    email: 'kasun@fixit.test',
    userId: 'u-kasun',
  },
  { key: 'admin', label: 'Admin', email: 'admin@fixit.test', userId: 'u-admin' },
] as const;
export type PersonaKey = (typeof DEMO_PERSONAS)[number]['key'];
