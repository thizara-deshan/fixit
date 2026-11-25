import { useSyncExternalStore } from 'react';
import type { AuthSession, Me } from '@fixit/contracts';

export type AuthStatus = 'booting' | 'guest' | 'signed-in';
export type SignOutReason = 'expired' | 'suspended' | 'logout';
export interface AuthState {
  status: AuthStatus;
  accessToken: string | null; // memory only (ARCH §6.2)
  me: Me | null;
  signOutReason: SignOutReason | null;
}

const INITIAL: AuthState = { status: 'booting', accessToken: null, me: null, signOutReason: null };
let state: AuthState = INITIAL;
const listeners = new Set<() => void>();

function set(next: AuthState): void {
  state = next;
  for (const l of listeners) l();
}

export const authStore = {
  getState: (): AuthState => state,
  subscribe: (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  accessToken: (): string | null => state.accessToken,
  setSession: (s: AuthSession): void => {
    set({ status: 'signed-in', accessToken: s.accessToken, me: s.user, signOutReason: null });
  },
  setMe: (me: Me): void => {
    if (state.status === 'signed-in') set({ ...state, me });
  },
  setGuest: (): void => {
    set({ status: 'guest', accessToken: null, me: null, signOutReason: null });
  },
  signOut: (reason: SignOutReason): void => {
    set({ status: 'guest', accessToken: null, me: null, signOutReason: reason });
  },
  /** D-c: after logout navigation, forget the `logout` reason so guards redirect normally again. Other reasons stay for S5's banner. */
  clearSignOutReason: (): void => {
    if (state.status === 'guest' && state.signOutReason === 'logout') set({ ...state, signOutReason: null });
  },
  /** Tests only. */
  reset: (): void => {
    set(INITIAL);
  },
};

export function useAuth(): AuthState {
  return useSyncExternalStore(authStore.subscribe, authStore.getState, authStore.getState);
}
