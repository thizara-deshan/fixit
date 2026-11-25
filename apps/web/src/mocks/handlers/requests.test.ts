import { describe, expect, it } from 'vitest';
import { Eligibility } from '@fixit/contracts';
import type { PersonaKey } from '@fixit/fixtures';
import { signInAs } from '@/test/sign-in';

const call = async (providerId: string, persona?: PersonaKey) => {
  const headers: Record<string, string> = {};
  if (persona) headers.Authorization = `Bearer ${signInAs(persona).accessToken}`;
  return fetch(new URL(`/api/me/request-eligibility/${providerId}`, window.location.origin), { headers });
};

describe('GET /me/request-eligibility/:providerId', () => {
  it.each([
    ['provider', 'p01', { state: 'own_listing' }],
    ['customer', 'p01', { state: 'open_with_provider', ref: 'FX-2061' }],
    ['customerAtLimit', 'p01', { state: 'open_limit_reached' }],
    ['customer', 'p13', { state: 'provider_paused' }],
    ['customer', 'p02', { state: 'ok' }],
  ] as const)('%s on %s', async (persona, providerId, expected) => {
    const res = await call(providerId, persona);
    expect(res.status).toBe(200);
    expect(Eligibility.parse(await res.json())).toEqual(expected);
  });
  it('anonymous → 401, admin → 403', async () => {
    expect((await call('p01')).status).toBe(401);
    expect((await call('p01', 'admin')).status).toBe(403);
  });
});
