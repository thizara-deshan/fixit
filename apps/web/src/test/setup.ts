import '@testing-library/jest-dom/vitest';
import { Blob as NodeBlob, File as NodeFile } from 'node:buffer';
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

/**
 * D-8: Node's fetch only serialises its own FormData/File, so every test gets Node's classes.
 * `new FormData(formElement)` (React DOM's form-submit listener) still needs jsdom's, so the wrapper
 * delegates to it for an element argument.
 */
const JsdomFormData = globalThis.FormData;
const NodeFormDataBase = (
  await new Response('a=1', { headers: { 'content-type': 'application/x-www-form-urlencoded' } }).formData()
).constructor as typeof FormData;
class TestFormData extends NodeFormDataBase {
  constructor(form?: HTMLFormElement) {
    super();
    if (form !== undefined) {
      for (const [k, v] of new JsdomFormData(form)) this.append(k, v);
    }
  }
}
let objectUrlSeq = 0;

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});
beforeEach(() => {
  installMatchMedia();
  vi.stubGlobal('FormData', TestFormData);
  vi.stubGlobal('File', NodeFile);
  vi.stubGlobal('Blob', NodeBlob);
  Object.assign(URL, {
    createObjectURL: () => `blob:test-${String(++objectUrlSeq)}`,
    revokeObjectURL: () => undefined,
  });
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
