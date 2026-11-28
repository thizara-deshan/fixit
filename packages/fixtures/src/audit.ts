import type { FxAudit } from './types';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/** D-13: admin history for S34 / S37 / S32 that matches the seeded states. */
export function buildAudit(now: Date): FxAudit[] {
  const ago = (ms: number) => new Date(now.getTime() - ms).toISOString();
  return [
    {
      id: 'a-s-p01-1',
      adminId: 'u-admin',
      action: 'verification_approve',
      targetType: 'submission',
      targetId: 's-p01-1',
      reason: null,
      at: ago(370 * DAY),
    },
    {
      id: 'a-s-p10-1',
      adminId: 'u-admin',
      action: 'verification_reject',
      targetType: 'submission',
      targetId: 's-p10-1',
      reason: 'The photo of the back of your NIC is blurry. Upload a clearer photo.',
      at: ago(2 * DAY),
    },
    {
      id: 'a-u-ruwan',
      adminId: 'u-admin',
      action: 'user_suspend',
      targetType: 'user',
      targetId: 'u-ruwan',
      reason: 'Several providers reported repeated no-shows and abusive messages.',
      at: ago(10 * DAY),
    },
    {
      id: 'a-v-FX-2028',
      adminId: 'u-admin',
      action: 'review_hide',
      targetType: 'review',
      targetId: 'v-FX-2028',
      reason: 'Personal remarks about the provider that break the review rules.',
      at: ago(330 * HOUR),
    },
  ];
}
