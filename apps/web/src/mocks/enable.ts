import { parseMockDomains, type MockDomain } from './domains';

let active: readonly MockDomain[] = [];
export const activeMockDomains = (): readonly MockDomain[] => active;
export const isMocked = (d: MockDomain): boolean => active.includes(d);

/** Registers only the listed domains' handlers; unlisted → bypass → Vite proxy → API (D23). */
export async function enableMocks(): Promise<void> {
  if (import.meta.env.DEV) {
    const domains = parseMockDomains(import.meta.env.VITE_MOCK_DOMAINS);
    if (domains.length === 0) return;
    const [{ setupWorker }, { handlersByDomain }] = await Promise.all([
      import('msw/browser'),
      import('./handlers'),
    ]);
    const worker = setupWorker(...domains.flatMap((d) => handlersByDomain[d]));
    await worker.start({ onUnhandledRequest: 'bypass', quiet: true });
    active = domains;
  }
}
