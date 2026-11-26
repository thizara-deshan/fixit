import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorEnvelope, OwnProvider } from '@fixit/contracts';
import type { PersonaKey } from '@fixit/fixtures';
import { FIXED_NOW } from '@/test/fixed-now';
import { signInAs } from '@/test/sign-in';

const call = (method: string, path: string, persona?: PersonaKey, body?: unknown) =>
  fetch(new URL(`/api${path}`, window.location.origin), {
    method,
    headers: {
      ...(persona ? { Authorization: `Bearer ${signInAs(persona).accessToken}` } : {}),
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
const errorOf = async (res: Response) => ErrorEnvelope.parse(await res.json()).error;
const step1 = {
  businessName: 'Martinez Home Fix',
  bio: 'Small repairs and odd jobs around the house, done well.',
  yearsExperience: 4,
};

describe('GET /me/provider · PUT onboarding/:step', () => {
  beforeEach(() => vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] }));
  afterEach(() => vi.useRealTimers());

  it('roles: anon 401, admin 403, never started 404, Kasun draft 200', async () => {
    expect((await call('GET', '/me/provider')).status).toBe(401);
    expect((await call('GET', '/me/provider', 'admin')).status).toBe(403);
    expect((await call('GET', '/me/provider', 'customer')).status).toBe(404);
    const kasun = OwnProvider.parse(await (await call('GET', '/me/provider', 'providerDraft')).json());
    expect(kasun.onboarding.step).toBe(3);
  });
  it('step 1 creates, returns step 2; bad body 400 with SPEC message; bad step 404', async () => {
    const ok = await call('PUT', '/me/provider/onboarding/1', 'customer', step1);
    expect(OwnProvider.parse(await ok.json()).onboarding.step).toBe(2);
    const bad = await call('PUT', '/me/provider/onboarding/1', 'customer', { ...step1, bio: 'short' });
    expect(bad.status).toBe(400);
    expect((await errorOf(bad)).fieldErrors?.bio).toEqual([
      'Tell customers about your business in at least 30 characters.',
    ]);
    expect((await call('PUT', '/me/provider/onboarding/7', 'customer', step1)).status).toBe(404);
  });
  it('published → 409 already_in_state; unconfirmed → 422; admin 403', async () => {
    const pub = await call('PUT', '/me/provider/onboarding/1', 'provider', step1);
    expect(pub.status).toBe(409);
    expect((await errorOf(pub)).details?.rule).toBe('already_in_state');
    const unconf = await call('PUT', '/me/provider/onboarding/1', 'customerUnconfirmed', step1);
    expect(unconf.status).toBe(422);
    expect((await call('PUT', '/me/provider/onboarding/1', 'admin', step1)).status).toBe(403);
  });
});
