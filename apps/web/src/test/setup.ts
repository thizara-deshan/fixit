import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';
import { resetDemoData } from '@/mocks/db/store';
import { server } from '@/mocks/node';
import { FIXED_NOW } from './fixed-now';

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});
beforeEach(() => {
  localStorage.clear();
  resetDemoData(FIXED_NOW);
});
afterEach(() => {
  server.resetHandlers();
  server.events.removeAllListeners();
});
afterAll(() => {
  server.close();
});
