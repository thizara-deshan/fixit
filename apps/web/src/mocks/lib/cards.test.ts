import { describe, expect, it } from 'vitest';
import { ProviderCard } from '@fixit/contracts';
import { db } from '../db/store';
import { isListed, listedCards } from './cards';

describe('listedCards', () => {
  it('every card parses as ProviderCard', () => {
    const cards = listedCards(db());
    expect(cards.length).toBeGreaterThan(0);
    for (const c of cards) expect(ProviderCard.safeParse(c).success).toBe(true);
  });
  it('excludes drafts and suspended owners', () => {
    const d = db();
    const ids = new Set(listedCards(d).map((c) => c.id));
    for (const p of Object.values(d.providers)) expect(ids.has(p.id)).toBe(isListed(d, p));
  });
  it('a suspended owner hides the listing', () => {
    const d = db();
    const p = Object.values(d.providers).find((x) => isListed(d, x));
    if (!p) throw new Error('fixture has no listed provider');
    const user = d.users[p.userId];
    if (!user) throw new Error('owner missing');
    user.status = 'suspended';
    expect(listedCards(d).some((c) => c.id === p.id)).toBe(false);
  });
});
