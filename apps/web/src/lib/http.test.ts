import { http as mswHttp, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';
import { ENDPOINTS, LoginBody } from '@fixit/contracts';
import { db } from '@/mocks/db/store';
import { armForcedError } from '@/mocks/lib/controls';
import { server } from '@/mocks/node';
import { signInAs } from '@/test/sign-in';
import { authStore } from './auth-store';
import { ApiError, http, httpBlob, pathOf } from './http';

const getMe = () => http('/auth/me', { schema: ENDPOINTS.auth_me.response });
const envelope = (code: string, extra: object = {}) => ({
  error: { code, message: code, requestId: 'test', ...extra },
});
const countRefreshes = () => {
  const counter = { n: 0 };
  server.events.on('request:start', ({ request }) => {
    if (new URL(request.url).pathname === '/api/auth/refresh') counter.n += 1;
  });
  return counter;
};
const caught = async (p: Promise<unknown>): Promise<unknown> =>
  p.then(
    () => null,
    (e: unknown) => e,
  );

describe('http()', () => {
  it('parses the response with the endpoint schema', async () => {
    signInAs('customer');
    expect((await getMe()).email).toBe('olivia@fixit.test');
  });
  it('a contract mismatch throws ZodError', async () => {
    signInAs('customer');
    server.use(mswHttp.get('/api/auth/me', () => HttpResponse.json({ nope: true })));
    expect(await caught(getMe())).toBeInstanceOf(ZodError);
  });
  it('a non-2xx ErrorEnvelope becomes ApiError with code, rule and fieldErrors', async () => {
    signInAs('customer');
    const fieldErrors = { mobile: ['Enter a Sri Lankan mobile number, like 077 123 4567.'] };
    server.use(
      mswHttp.get('/api/auth/me', () =>
        HttpResponse.json(
          envelope('RULE_VIOLATION', { details: { rule: 'open_limit_reached' }, fieldErrors }),
          { status: 422 },
        ),
      ),
    );
    const err = await caught(getMe());
    expect(err).toBeInstanceOf(ApiError);
    if (!(err instanceof ApiError)) return;
    expect([err.status, err.code, err.rule, err.fieldErrors]).toEqual([
      422,
      'RULE_VIOLATION',
      'open_limit_reached',
      fieldErrors,
    ]);
  });
  it('network failure → ApiError(0, NETWORK)', async () => {
    signInAs('customer');
    server.use(mswHttp.get('/api/auth/me', () => HttpResponse.error()));
    const err = await caught(getMe());
    expect(err).toBeInstanceOf(ApiError);
    if (err instanceof ApiError) expect([err.status, err.code]).toEqual([0, 'NETWORK']);
  });
  it('401 → refresh once → retry succeeds (AC3)', async () => {
    signInAs('customer');
    const refreshes = countRefreshes();
    armForcedError('auth_me', '401');
    expect((await getMe()).email).toBe('olivia@fixit.test');
    expect(refreshes.n).toBe(1);
    expect(authStore.getState().status).toBe('signed-in');
  });
  it('401 and refresh fails → signed out with reason expired (AC3)', async () => {
    signInAs('customer');
    armForcedError('auth_me', '401');
    armForcedError('auth_refresh', '401');
    const err = await caught(getMe());
    expect(err).toBeInstanceOf(ApiError);
    expect(authStore.getState()).toMatchObject({
      status: 'guest',
      accessToken: null,
      signOutReason: 'expired',
    });
  });
  it('suspended during refresh → reason suspended', async () => {
    signInAs('customer');
    const olivia = db().users['u-olivia'];
    if (olivia) olivia.status = 'suspended';
    await caught(getMe());
    expect(authStore.getState().signOutReason).toBe('suspended');
  });
  it('concurrent 401s share one refresh (AC7)', async () => {
    const first = signInAs('customer');
    const refreshes = countRefreshes();
    server.use(
      mswHttp.get(
        '/api/auth/me',
        ({ request }) =>
          request.headers.get('Authorization') === `Bearer ${first.accessToken}`
            ? HttpResponse.json(envelope('UNAUTHENTICATED'), { status: 401 })
            : undefined, // fall through to the real mock handler
      ),
    );
    const results = await Promise.all([getMe(), getMe(), getMe()]);
    expect(results.map((m) => m.email)).toEqual(Array(3).fill('olivia@fixit.test'));
    expect(refreshes.n).toBe(1);
  });
  it('a 401 from /auth/login never triggers a refresh', async () => {
    signInAs('customer');
    const refreshes = countRefreshes();
    const body: LoginBody = { email: 'olivia@fixit.test', password: 'wrong-pass' };
    const err = await caught(
      http('/auth/login', { method: 'POST', body, schema: ENDPOINTS.auth_login.response }),
    );
    expect(err).toBeInstanceOf(ApiError);
    if (err instanceof ApiError) expect(err.rule).toBe('invalid_credentials');
    expect(refreshes.n).toBe(0);
    expect(authStore.getState().status).toBe('signed-in');
  });
});

describe('pathOf', () => {
  it('fills and encodes params; throws when one is missing', () => {
    expect(pathOf({ path: '/me/requests/:ref' }, { ref: 'FX-2061' })).toBe('/me/requests/FX-2061');
    expect(pathOf({ path: '/x/:id' }, { id: 'a b' })).toBe('/x/a%20b');
    expect(() => pathOf({ path: '/x/:id' })).toThrow('missing :id');
  });
});

describe('httpBlob()', () => {
  it('admin downloads a verification document as a Blob', async () => {
    signInAs('admin');
    const blob = await httpBlob('/files/documents/d-p02-nic-front');
    expect(blob.size).toBeGreaterThan(0);
  });
  it('a customer is refused with an ApiError (403 — customers have no document access)', async () => {
    signInAs('customer');
    const e = await caught(httpBlob('/files/documents/d-p02-nic-front'));
    expect(e).toBeInstanceOf(ApiError);
    expect((e as ApiError).status).toBe(403);
  });
});
