import { describe, expect, it } from 'vitest';
import { LIMIT_HELPER, toRequestAction } from './request-action';

const p = { id: 'p01', businessName: 'Bell & Sons Plumbing', paused: false };
describe('toRequestAction (SPEC S3.E7)', () => {
  it('admin and unavailable → hidden', () => {
    expect(toRequestAction({ state: 'admin' }, p)).toEqual({ kind: 'hidden' });
    expect(toRequestAction({ state: 'provider_unavailable' }, p)).toEqual({ kind: 'hidden' });
  });
  it('own listing → edit', () => {
    expect(toRequestAction({ state: 'own_listing' }, p)).toEqual({
      kind: 'edit',
      to: '/dashboard/profile',
      helper: 'This is your listing.',
    });
  });
  it('paused → disabled with business copy', () => {
    expect(toRequestAction({ state: 'provider_paused' }, p)).toEqual({
      kind: 'disabled',
      helper: "Bell & Sons Plumbing isn't taking new requests right now.",
    });
  });
  it('guest → login with next; guest on a paused provider → paused (paused precedes guest)', () => {
    expect(toRequestAction({ state: 'guest' }, p)).toEqual({
      kind: 'request',
      to: '/login?next=/providers/p01/request',
    });
    expect(toRequestAction({ state: 'guest' }, { ...p, paused: true }).kind).toBe('disabled');
  });
  it('open with provider → view with ref', () => {
    expect(toRequestAction({ state: 'open_with_provider', ref: 'FX-2061' }, p)).toEqual({
      kind: 'view',
      to: '/requests/FX-2061',
      helper: 'You already have an open request with Bell & Sons Plumbing.',
    });
  });
  it('limit → disabled with limit copy', () => {
    expect(toRequestAction({ state: 'open_limit_reached' }, p)).toEqual({
      kind: 'disabled',
      helper: LIMIT_HELPER,
    });
  });
  it('ok and email_unconfirmed → request form', () => {
    expect(toRequestAction({ state: 'ok' }, p)).toEqual({ kind: 'request', to: '/providers/p01/request' });
    expect(toRequestAction({ state: 'email_unconfirmed' }, p)).toEqual({
      kind: 'request',
      to: '/providers/p01/request',
    });
  });
});
