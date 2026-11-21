// apps/web/src/mocks/db/store.ts
import { MOCK_DB_KEY, MOCK_DB_VERSION, type MockDb } from './schema';
import { seedDb } from './seed';

let cache: MockDb | null = null;

function read(): MockDb | null {
  try {
    const raw = localStorage.getItem(MOCK_DB_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<MockDb>; // written only by persist() below
    return parsed.version === MOCK_DB_VERSION ? (parsed as MockDb) : null;
  } catch {
    return null;
  }
}

function persist(d: MockDb): MockDb {
  try {
    localStorage.setItem(MOCK_DB_KEY, JSON.stringify(d));
  } catch (e) {
    console.warn('[mocks] could not persist the mock db; keeping it in memory', e);
  }
  return d;
}

/** The mock database: loaded from localStorage, or seeded from fixtures with `new Date()`. */
export function db(): MockDb {
  cache ??= read() ?? persist(seedDb(new Date()));
  return cache;
}

/** Persist after a successful handler (mockEndpoint calls this). */
export function commit(): void {
  if (cache) persist(cache);
}

/** DevPanel "Reset demo data" and the test harness (fixed `now`). */
export function resetDemoData(now: Date = new Date()): MockDb {
  cache = persist(seedDb(now));
  return cache;
}

/** Tests only: drop the in-memory copy so the next db() reads localStorage. */
export function forgetDbCache(): void {
  cache = null;
}
