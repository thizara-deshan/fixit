import { describe, expect, it } from 'vitest';
import { server } from '@/mocks/node';
import { signInAs } from '@/test/sign-in';
import type { Access } from '@fixit/contracts';
import { MockHttpError } from './errors';
import type { MockActor } from './identity';
import { assertAccess, mockFileEndpoint } from './endpoint';

const customer: MockActor = { userId: 'u-olivia', roles: ['customer'] };
const provider: MockActor = { userId: 'u-marcus', roles: ['customer', 'provider'] };
const admin: MockActor = { userId: 'u-admin', roles: ['admin'] };

const outcome = (access: readonly Access[], actor: MockActor | null): number | 'ok' => {
  try {
    assertAccess({ access }, actor);
    return 'ok';
  } catch (e) {
    if (e instanceof MockHttpError) return e.status;
    throw e;
  }
};

describe('assertAccess', () => {
  it.each([
    [['public'], null, 'ok'],
    [['public'], admin, 'ok'],
    [['user', 'admin'], null, 401],
    [['user', 'admin'], customer, 'ok'],
    [['user', 'admin'], admin, 'ok'],
    [['user'], admin, 403],
    [['user'], provider, 'ok'],
    [['provider'], customer, 403],
    [['provider'], provider, 'ok'],
    [['provider'], admin, 403],
    [['admin'], customer, 403],
    [['admin'], admin, 'ok'],
  ] as const)('%j with %j → %s', (access, actor, expected) => {
    expect(outcome(access, actor)).toBe(expected);
  });
});

describe('mockFileEndpoint', () => {
  const def = {
    id: 'probe_file',
    domain: 'providers',
    method: 'GET',
    path: '/probe-file/:id',
    access: ['provider', 'admin'],
    owner: 'provider_or_admin',
    refs: [],
  } as const;
  it('streams the blob with headers; 401 anonymous; 403 customer', async () => {
    server.use(mockFileEndpoint(def, () => new Blob(['hi'], { type: 'text/plain' }), 'no-store'));
    const url = new URL('/api/probe-file/x', window.location.origin);
    const ok = await fetch(url, { headers: { Authorization: `Bearer ${signInAs('provider').accessToken}` } });
    expect(ok.status).toBe(200);
    expect(ok.headers.get('cache-control')).toBe('no-store');
    expect(await ok.text()).toBe('hi');
    expect((await fetch(url)).status).toBe(401);
    expect(
      (await fetch(url, { headers: { Authorization: `Bearer ${signInAs('customer').accessToken}` } })).status,
    ).toBe(403);
  });
});
