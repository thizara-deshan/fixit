import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { authStore } from '@/lib/auth-store';
import { db } from '@/mocks/db/store';
import { FIXED_NOW } from '@/test/fixed-now';
import { createWrapper } from '@/test/render';
import { signInAs } from '@/test/sign-in';
import { useSaveStep } from './hooks';

describe('onboarding hooks', () => {
  beforeEach(() => vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] }));
  afterEach(() => vi.useRealTimers());
  it('step 1 with a mobile: PATCH /me then PUT; draft at step 2', async () => {
    const olivia = db().users['u-olivia'];
    if (!olivia) throw new Error('olivia');
    olivia.mobile = null;
    signInAs('customer');
    const { result } = renderHook(() => useSaveStep(), { wrapper: createWrapper() });
    let step = 0;
    await act(async () => {
      const own = await result.current.mutateAsync({
        step: 1,
        body: {
          businessName: 'Martinez Home Fix',
          bio: 'Small repairs and odd jobs around the house.',
          yearsExperience: 4,
        },
        mobile: '+94771234567',
      });
      step = own.onboarding.step;
    });
    expect(step).toBe(2);
    expect(authStore.getState().me?.mobile).toBe('+94771234567');
  });
});
