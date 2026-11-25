import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest';
import { authStore } from '@/lib/auth-store';
import { resetDemoData } from '@/mocks/db/store';
import { setLatency } from '@/mocks/lib/controls';
import { server } from '@/mocks/node';
import { FIXED_NOW } from './fixed-now';
import { installMatchMedia } from './media';

// The first render of a lazy route cold-loads its chunk; on a busy machine that can exceed the 1000 ms default.
configure({ asyncUtilTimeout: 4000 });

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});
beforeEach(() => {
  installMatchMedia();
  window.scrollTo = () => undefined; // jsdom: not implemented (React Router scroll restoration)
  authStore.reset();
  localStorage.clear();
  resetDemoData(FIXED_NOW);
  setLatency('zero');
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  server.resetHandlers();
  server.events.removeAllListeners();
});
afterAll(() => {
  server.close();
});
