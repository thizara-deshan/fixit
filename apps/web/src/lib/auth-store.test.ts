import { describe, expect, it, vi } from 'vitest';
import { db } from '@/mocks/db/store';
import { buildMe } from '@/mocks/lib/me';
import { authStore } from './auth-store';

const session = () => ({ accessToken: 't0', expiresIn: 900, user: buildMe(db(), 'u-olivia') });

describe('authStore', () => {
  it('starts booting', () => {
    expect(authStore.getState().status).toBe('booting');
  });
  it('setSession → signed-in with token and me; listeners are notified', () => {
    const listener = vi.fn();
    const off = authStore.subscribe(listener);
    authStore.setSession(session());
    expect(authStore.getState()).toMatchObject({
      status: 'signed-in',
      accessToken: 't0',
      signOutReason: null,
    });
    expect(authStore.getState().me?.email).toBe('olivia@fixit.test');
    expect(listener).toHaveBeenCalledTimes(1);
    off();
  });
  it('signOut(reason) clears the session and keeps the reason', () => {
    authStore.setSession(session());
    authStore.signOut('expired');
    expect(authStore.getState()).toEqual({
      status: 'guest',
      accessToken: null,
      me: null,
      signOutReason: 'expired',
    });
  });
  it('setMe is ignored for a guest', () => {
    authStore.setGuest();
    authStore.setMe(session().user);
    expect(authStore.getState().me).toBeNull();
  });
  it('clearSignOutReason clears only the logout reason', () => {
    authStore.setSession(session());
    authStore.signOut('logout');
    authStore.clearSignOutReason();
    expect(authStore.getState().signOutReason).toBeNull();
    authStore.signOut('expired');
    authStore.clearSignOutReason();
    expect(authStore.getState().signOutReason).toBe('expired');
  });
});
