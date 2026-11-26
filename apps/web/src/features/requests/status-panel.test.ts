import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { seedDb } from '@/mocks/db/seed';
import { customerViewOf } from '@/mocks/lib/requests';
import { FIXED_NOW } from '@/test/fixed-now';
import { statusPanel } from './status-panel';

const view = (ref: string) => {
  const d = seedDb(FIXED_NOW);
  const r = Object.values(d.requests).find((x) => x.ref === ref);
  if (!r) throw new Error(ref);
  return customerViewOf(d, r, FIXED_NOW);
};

describe('statusPanel (S15)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] });
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  it('pending', () => {
    const p = statusPanel(view('FX-2061'));
    expect(p.title).toBe('Waiting for Bell & Sons Plumbing to reply');
    expect(p.lines[0]).toMatch(/^They have until .+ to accept or decline\. We'll email you either way\.$/);
    expect([p.showCancel, p.showContact]).toEqual([true, false]);
  });
  it('accepted before the cut-off', () => {
    const p = statusPanel(view('FX-2030'));
    expect(p.title).toBe('Fresh Nest Cleaning accepted your request');
    expect(p.lines).toEqual(['You can cancel until 11:59 PM on Thu, 26 Nov.']);
    expect(p.agreedPrice).toMatch(/^Agreed price: LKR /);
    expect([p.showCancel, p.showContact]).toEqual([true, true]);
  });
  it('accepted today → too late', () => {
    const p = statusPanel(view('FX-2031'));
    expect(p.lines).toEqual(["It's too late to cancel online. Contact GreenLeaf Gardens directly."]);
    expect(p.showCancel).toBe(false);
  });
  it.each([
    ['FX-2033', 'Oak & Iron Carpentry declined this request', ['Reason: Fully booked that week.']],
    ['FX-2034', 'ApplianceDoc declined this request', ['Reason: Provider unavailable']],
    ['FX-2035', 'Fixit cancelled this request', ['Reason: The provider reported a family emergency.']],
    ['FX-2036', 'This request expired', ["Fresh Nest Cleaning didn't reply in time."]],
  ])('%s', (ref, title, lines) => {
    const v = view(ref);
    const p = statusPanel(v);
    expect([p.title, p.lines]).toEqual([title, lines]);
    expect(p.findAnotherHref).toBe(`/discover?cat=${v.provider.categoryId}&loc=${v.town.id}`);
  });
  it('completed', () => {
    const p = statusPanel(view('FX-2046'));
    expect(p.title).toMatch(/^Job completed on /);
    expect(p.showReview).toBe(true);
  });
});
