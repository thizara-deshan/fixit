export const MOCK_DOMAINS = ['auth', 'catalog', 'providers', 'requests', 'reviews', 'admin'] as const;
export type MockDomain = (typeof MOCK_DOMAINS)[number];

export function parseMockDomains(raw: string | undefined): MockDomain[] {
  const value = (raw ?? 'none').trim().toLowerCase();
  if (value === 'all') return [...MOCK_DOMAINS];
  if (value === '' || value === 'none') return [];
  const list = value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const unknown = list.filter((d) => !(MOCK_DOMAINS as readonly string[]).includes(d));
  if (unknown.length > 0) throw new Error(`VITE_MOCK_DOMAINS: unknown domain(s): ${unknown.join(', ')}`);
  return [...new Set(list)] as MockDomain[];
}
