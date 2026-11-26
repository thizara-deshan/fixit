import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/mocks/db/store';
import { FIXED_NOW } from '@/test/fixed-now';
import { stageDocument, submitVerification, unstageDocument, verificationStateOf } from './verification';

const prov = (id: string) => {
  const p = db().providers[id];
  if (!p) throw new Error(id);
  return p;
};
const file = (type: 'nic_front' | 'nic_back') => ({
  type,
  fileName: `${type}.png`,
  mimeType: 'image/png',
  bytes: new Uint8Array(10),
});

const thrown = (fn: () => unknown): unknown => {
  try {
    fn();
  } catch (e) {
    return e;
  }
  throw new Error('did not throw');
};

describe('verification (mock)', () => {
  beforeEach(() => vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] }));
  afterEach(() => vi.useRealTimers());

  it('Hank (not submitted): stage, replace, unstage, submit needs both NIC sides', () => {
    const d = db();
    const hank = prov('p08');
    expect(verificationStateOf(d, hank)).toMatchObject({
      status: 'not_submitted',
      editable: true,
      documents: [],
    });
    stageDocument(d, hank, file('nic_front'), FIXED_NOW);
    const second = stageDocument(d, hank, file('nic_front'), FIXED_NOW);
    expect(verificationStateOf(d, hank).documents.map((x) => x.id)).toEqual([second.id]);
    expect(
      thrown(() => {
        submitVerification(d, hank, FIXED_NOW);
      }),
    ).toMatchObject({ status: 422 });
    stageDocument(d, hank, file('nic_back'), FIXED_NOW);
    submitVerification(d, hank, FIXED_NOW);
    const after = verificationStateOf(d, hank);
    expect(after).toMatchObject({ status: 'pending_review', editable: false });
    expect(after.documents.map((x) => x.type)).toEqual(['nic_front', 'nic_back']);
    expect(
      thrown(() => {
        unstageDocument(d, hank, second.id);
      }),
    ).toMatchObject({ status: 404 });
  });
  it('Grace (rejected): reason, prefilled staged copies, resubmit → attempt 2', () => {
    const d = db();
    const grace = prov('p10');
    const s = verificationStateOf(d, grace);
    expect(s).toMatchObject({ status: 'rejected', editable: true });
    expect(s.rejectionReason).toContain('blurry');
    expect(s.documents.map((x) => x.id)).toEqual(['d-p10-nic_front-r', 'd-p10-nic_back-r']);
    submitVerification(d, grace, FIXED_NOW);
    expect(d.submissions['s-p10-2']).toMatchObject({ attempt: 2, status: 'pending_review' });
  });
  it('Marcus (verified) and Dana (pending) are read-only', () => {
    const d = db();
    expect(thrown(() => stageDocument(d, prov('p01'), file('nic_front'), FIXED_NOW))).toMatchObject({
      status: 422,
    });
    expect(verificationStateOf(d, prov('p02')).documents).toHaveLength(2);
  });
});
