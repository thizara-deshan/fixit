import { describe, expect, it } from 'vitest';
import { toBlock, type BlockContext } from './blocked-state';

const c: BlockContext = {
  providerId: 'p13',
  businessName: 'Lanka Paint Works',
  categoryId: 'painting',
  email: 'nimal@fixit.test',
  loc: 'colombo',
};
describe('toBlock', () => {
  it('no data / ok → none', () => {
    expect(toBlock(undefined, c)).toEqual({ kind: 'none' });
    expect(toBlock({ state: 'ok' }, c)).toEqual({ kind: 'none' });
  });
  it('guest / admin → none', () => {
    expect(toBlock({ state: 'guest' }, c)).toEqual({ kind: 'none' });
    expect(toBlock({ state: 'admin' }, c)).toEqual({ kind: 'none' });
  });
  it('unavailable → not_found', () => {
    expect(toBlock({ state: 'provider_unavailable' }, c)).toEqual({ kind: 'not_found' });
  });
  it('paused → discover link with cat and loc', () => {
    expect(toBlock({ state: 'provider_paused' }, c)).toMatchObject({
      title: "Lanka Paint Works isn't taking new requests right now",
      action: { label: 'Find another provider', to: '/discover?cat=painting&loc=colombo' },
    });
    expect(toBlock({ state: 'provider_paused' }, { ...c, loc: null })).toMatchObject({
      action: { to: '/discover?cat=painting' },
    });
  });
  it('own listing', () => {
    expect(toBlock({ state: 'own_listing' }, c)).toMatchObject({
      icon: 'lock',
      title: "You can't request your own listing",
      action: { to: '/dashboard' },
    });
  });
  it('email', () => {
    expect(toBlock({ state: 'email_unconfirmed' }, c)).toMatchObject({
      icon: 'mail',
      body: 'We sent a link to nimal@fixit.test. Confirm it, then come back to send your request.',
      action: { resend: true },
      secondary: { to: '/providers/p13' },
    });
  });
  it('open with provider', () => {
    expect(toBlock({ state: 'open_with_provider', ref: 'FX-2061' }, c)).toMatchObject({
      action: { label: 'View request', to: '/requests/FX-2061' },
    });
  });
  it('limit', () => {
    expect(toBlock({ state: 'open_limit_reached' }, c)).toMatchObject({
      title: 'You have 5 open requests',
      action: { to: '/requests' },
    });
  });
});
