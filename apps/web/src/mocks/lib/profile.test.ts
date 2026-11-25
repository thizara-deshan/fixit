import { describe, expect, it } from 'vitest';
import { ProviderPublicProfile, PublicReviewPage } from '@fixit/contracts';
import { db } from '../db/store';
import { MockHttpError } from './errors';
import { eligibilityFor, listedProviderOr404, publicReviewsPage, toPublicProfile } from './profile';

describe('toPublicProfile', () => {
  it('p01: owner, services, base town first then alphabetical', () => {
    const d = db();
    const p = ProviderPublicProfile.parse(toPublicProfile(d, listedProviderOr404(d, 'p01')));
    expect(p.ownerName).toBe('Marcus Bell');
    expect(p.services).toHaveLength(5);
    expect(p.areas[0]).toMatchObject({ id: 'colombo', isBase: true });
    const rest = p.areas.slice(1).map((a) => a.name);
    expect(rest).toEqual([...rest].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' })));
  });
  it.each(['unknown', 'p11', 'p14'])('%s → 404', (id) => {
    let caught: unknown;
    try {
      listedProviderOr404(db(), id);
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(MockHttpError);
    expect((caught as MockHttpError).status).toBe(404);
  });
});
describe('publicReviewsPage', () => {
  it('5 then 10, newest first, Sarah K. on top for p01', () => {
    const one = PublicReviewPage.parse(publicReviewsPage(db(), 'p01', 1));
    expect(one.items).toHaveLength(5);
    expect(one.items[0]?.authorDisplayName).toBe('Sarah K.');
    expect(one.total).toBe(212);
    const two = publicReviewsPage(db(), 'p01', 2);
    expect(two.items).toHaveLength(10);
    expect((two.items[0]?.createdAt ?? '') <= (one.items[4]?.createdAt ?? '')).toBe(true);
  });
  it('excludes hidden reviews', () => {
    const d = db();
    const first = publicReviewsPage(d, 'p01', 1).items[0];
    const row = first && d.reviews[first.id];
    if (!row) throw new Error('no review');
    row.visibility = 'hidden';
    expect(publicReviewsPage(d, 'p01', 1).items.some((r) => r.id === row.id)).toBe(false);
  });
});
describe('eligibilityFor (fixtures)', () => {
  it.each([
    ['u-marcus', 'p01', { state: 'own_listing' }],
    ['u-olivia', 'p01', { state: 'open_with_provider', ref: 'FX-2061' }],
    ['u-dilani', 'p01', { state: 'open_limit_reached' }],
    ['u-olivia', 'p13', { state: 'provider_paused' }],
    ['u-olivia', 'p02', { state: 'ok' }],
    ['u-nimal', 'p02', { state: 'email_unconfirmed' }],
  ])('%s on %s', (user, provider, expected) => {
    expect(eligibilityFor(db(), user, provider)).toEqual(expected);
  });
});
