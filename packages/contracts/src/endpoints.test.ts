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
});
