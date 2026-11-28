import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FIXED_NOW } from '@/test/fixed-now';
import { db } from '../db/store';
import {
  approveSubmission,
  nextPendingId,
  queuePage,
  rejectSubmission,
  submissionOr404,
  verificationDetailOf,
} from './admin-verification';
import { MockHttpError } from './errors';
import { verificationStateOf } from './verification';

beforeEach(() => {
  vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] });
});
afterEach(() => {
  vi.useRealTimers();
});

describe('admin verification (mock)', () => {
  it('pending queue lists p02 first (oldest first) and approved lists p01', () => {
    const d = db();
    expect(queuePage(d, { status: 'pending_review', page: 1 }).items[0]?.provider.id).toBe('p02');
    expect(queuePage(d, { status: 'approved', page: 1 }).items.map((r) => r.provider.id)).toContain('p01');
  });
  it('detail: p02 has NIC front + back and no previous decisions', () => {
    const v = verificationDetailOf(db(), submissionOr404(db(), 's-p02-1'));
    expect(v.documents.map((x) => x.type)).toEqual(['nic_front', 'nic_back']);
    expect(v.previous).toEqual([]);
    expect(v.provider.accountName).toBe(v.provider.ownerName);
  });
  it('approve: provider verified, audit row, second approve → 409 already_in_state', () => {
    const d = db();
    const s = submissionOr404(d, 's-p02-1');
    approveSubmission(d, s, 'u-admin', new Date());
    expect(d.providers.p02?.verificationStatus).toBe('verified');
    expect(d.audit.at(-1)).toMatchObject({
      action: 'verification_approve',
      targetId: 's-p02-1',
      adminId: 'u-admin',
    });
    expect(nextPendingId(d, 's-p02-1')).toBeNull();
    try {
      approveSubmission(d, s, 'u-admin', new Date());
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(MockHttpError);
      expect((e as MockHttpError).status).toBe(409);
    }
  });
  it('reject: provider rejected with reason; S26 state shows the reason and prefilled staged docs', () => {
    const d = db();
    rejectSubmission(
      d,
      submissionOr404(d, 's-p02-1'),
      'u-admin',
      'The NIC photo is cut off on the left.',
      new Date(),
    );
    const p = d.providers.p02;
    if (!p) throw new Error('p02 missing');
    const state = verificationStateOf(d, p);
    expect(state.status).toBe('rejected');
    expect(state.rejectionReason).toBe('The NIC photo is cut off on the left.');
    expect(state.documents.map((x) => x.type)).toEqual(['nic_front', 'nic_back']);
  });
});
