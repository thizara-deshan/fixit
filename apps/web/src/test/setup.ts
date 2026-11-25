import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';
import { authStore } from '@/lib/auth-store';
import { resetDemoData } from '@/mocks/db/store';
import { setLatency } from '@/mocks/lib/controls';
import { server } from '@/mocks/node';
import { FIXED_NOW } from './fixed-now';
import { installMatchMedia } from './media';

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});
beforeEach(() => {
  installMatchMedia();
  authStore.reset();
  localStorage.clear();
  resetDemoData(FIXED_NOW);
  setLatency('zero');
});
afterEach(() => {
  cleanup();
  server.resetHandlers();
  server.events.removeAllListeners();
});
afterAll(() => {
  server.close();
});
