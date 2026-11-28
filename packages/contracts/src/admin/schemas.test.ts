import { describe, expect, it } from 'vitest';
import { AdminOverview, HideReviewBody, makeAccountReasonBody, RejectBody, SuspendBody } from './schemas';

const msg = (r: { success: boolean; error?: { issues: { message: string }[] } }) =>
  r.error?.issues[0]?.message;

describe('admin reason bodies', () => {
  it('reject: 9 trimmed chars fail with the SPEC message, 10 pass', () => {
    expect(msg(RejectBody.safeParse({ reason: '  123456789  ' }))).toBe(
      'Give a reason so the provider knows what to fix.',
    );
    expect(RejectBody.parse({ reason: ' 1234567890 ' }).reason).toBe('1234567890');
  });
  it('501 chars fail', () => {
    expect(RejectBody.safeParse({ reason: 'x'.repeat(501) }).success).toBe(false);
  });
  it('hide uses the moderation message', () => {
    expect(msg(HideReviewBody.safeParse({ reason: 'short' }))).toBe('Give a reason for the moderation log.');
  });
  it('account reason names the user in the form schema', () => {
    expect(msg(makeAccountReasonBody('Hank Morales').safeParse({ reason: '' }))).toBe(
      "Give a reason. It's included in the email to Hank Morales.",
    );
    expect(SuspendBody.safeParse({ reason: 'Repeated no-shows.' }).success).toBe(true);
  });
});

describe('AdminOverview', () => {
  it('accepts attention only and strips a future metrics key (D-1)', () => {
    const v = AdminOverview.parse({
      attention: { pendingVerifications: 1, oldestPendingAt: null, suspendedUsers: 0 },
      metrics: { anything: 1 },
    });
    expect(v).toEqual({ attention: { pendingVerifications: 1, oldestPendingAt: null, suspendedUsers: 0 } });
  });
});
