import { setupServer } from 'msw/node';
import { allHandlers } from './handlers';

/** Vitest: every domain mocked (ARCH §9.4). */
export const server = setupServer(...allHandlers);
