import { buildWorld, DEMO_PASSWORD } from '@fixit/fixtures';
import { MOCK_DB_VERSION, type MockDb } from './schema';

const byId = <T extends { id: string }>(rows: readonly T[]): Record<string, T> =>
  Object.fromEntries(rows.map((r) => [r.id, r]));

/** ARCH §8.3: the mock seeds from the shared fixtures with dates relative to `now`. */
export function seedDb(now: Date): MockDb {
  const w = buildWorld(now);
  return {
    version: MOCK_DB_VERSION,
    seededAt: now.toISOString(),
    categories: w.categories,
    districts: w.districts,
    towns: w.towns,
    users: byId(
      w.users.map((u) => ({ ...u, password: u.authMethods.includes('password') ? DEMO_PASSWORD : null })),
    ),
    providers: byId(w.providers),
    services: byId(w.services),
    areas: w.areas,
    requests: byId(w.requests),
    reviews: byId(w.reviews),
    submissions: byId(w.submissions),
    documents: byId(w.documents),
    saved: [],
    audit: w.audit,
    refSeq: 2062, // ARCH §8.1 request_ref_seq START 2062
    authTokens: [],
    lastEmailLink: null,
  };
}
