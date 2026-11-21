import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';
import { authStore } from '@/lib/auth-store';
import { resetDemoData } from '@/mocks/db/store';
import { setLatency } from '@/mocks/lib/controls';
import { server } from '@/mocks/node';
import { FIXED_NOW } from './fixed-now';

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});
beforeEach(() => {
  authStore.reset();
  localStorage.clear();
  resetDemoData(FIXED_NOW);
  setLatency('zero');
});
afterEach(() => {
  server.resetHandlers();
  server.events.removeAllListeners();
});
afterAll(() => {
  server.close();
});
