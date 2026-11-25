import { describe, expect, it } from 'vitest';
import { ENDPOINTS } from './endpoints';

describe('ENDPOINTS', () => {
  const defs = Object.entries(ENDPOINTS);
  it('every key equals its id', () => {
    for (const [key, def] of defs) expect(def.id).toBe(key);
  });
  it('method + path pairs are unique', () => {
    const pairs = defs.map(([, d]) => `${d.method} ${d.path}`);
    expect(new Set(pairs).size).toBe(pairs.length);
  });
  it('auth rows match ARCHITECTURE §3.1', () => {
    expect(ENDPOINTS.auth_login.access).toEqual(['public']);
    expect(ENDPOINTS.auth_refresh.access).toEqual(['public']);
    expect(ENDPOINTS.auth_logout.access).toEqual(['public']);
    expect(ENDPOINTS.auth_me.access).toEqual(['user', 'admin']);
    expect('response' in ENDPOINTS.auth_logout).toBe(false); // 204
  });
  it('M04 auth rows match ARCHITECTURE §3.1', () => {
    const rows = Object.fromEntries(Object.values(ENDPOINTS).map((d) => [`${d.method} ${d.path}`, d.access]));
    expect(rows).toMatchObject({
      'POST /auth/register': ['public'],
      'POST /auth/admin/login': ['public'],
      'GET /auth/google': ['public'],
      'GET /auth/google/callback': ['public'],
      'POST /auth/confirm-email': ['public'],
      'POST /auth/resend-confirmation': ['user'],
      'POST /auth/forgot-password': ['public'],
      'POST /auth/reset-password': ['public'],
      'PATCH /me': ['user'],
      'POST /me/password': ['user'],
    });
    for (const id of [
      'auth_register',
      'auth_resend_confirmation',
      'auth_forgot_password',
      'auth_reset_password',
      'me_password',
    ] as const)
      expect('response' in ENDPOINTS[id]).toBe(false); // 204
  });
  it('M05 catalog rows match ARCHITECTURE §3.2', () => {
    expect(ENDPOINTS.catalog_get).toMatchObject({
      method: 'GET',
      path: '/catalog',
      access: ['public'],
      domain: 'catalog',
    });
    expect(ENDPOINTS.providers_featured).toMatchObject({
      method: 'GET',
      path: '/providers/featured',
      access: ['public'],
      domain: 'catalog',
    });
  });
  it('M06 discover row matches ARCHITECTURE §3.2', () => {
    expect(ENDPOINTS.providers_search).toMatchObject({
      method: 'GET',
      path: '/providers',
      access: ['public'],
      domain: 'catalog',
      owner: 'none',
    });
  });
});
