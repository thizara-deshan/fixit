import { describe, expect, it } from 'vitest';
import { waitFor } from '@testing-library/react';
import { authStore } from '@/lib/auth-store';
import { renderRoute } from '@/test/render';
import { googleMockSignIn } from '../api';

describe('/auth/google/done', () => {
  it('after the mock Google step, lands on next', async () => {
    authStore.setGuest();
    await googleMockSignIn();
    const r = renderRoute('/auth/google/done?next=%2Frequests');
    await waitFor(() => {
      expect(r.location()).toBe('/requests');
    });
    expect(authStore.getState().me?.email).toBe('sanduni@fixit.test');
  });

  it('no session → /login?error=google_cancelled', async () => {
    authStore.setGuest();
    const r = renderRoute('/auth/google/done');
    await waitFor(() => {
      expect(r.location()).toBe('/login?error=google_cancelled');
    });
  });
});
