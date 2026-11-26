import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DocumentMeta, VerificationState } from '@fixit/contracts';
import type { PersonaKey } from '@fixit/fixtures';
import { FIXED_NOW } from '@/test/fixed-now';
import { signInAs } from '@/test/sign-in';

const auth = (p?: PersonaKey): Record<string, string> =>
  p ? { Authorization: `Bearer ${signInAs(p).accessToken}` } : {};
const url = (path: string) => new URL(`/api${path}`, window.location.origin);
export const uploadDoc = (persona: PersonaKey, type: string, file: File) => {
  const form = new FormData();
  form.append('type', type);
  form.append('file', file);
  return fetch(url('/me/provider/verification/documents'), {
    method: 'POST',
    headers: auth(persona),
    body: form,
  });
};
const png = (name = 'nic.png', size = 1000) => new File([new Uint8Array(size)], name, { type: 'image/png' });

describe('verification handlers', () => {
  beforeEach(() => vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] }));
  afterEach(() => vi.useRealTimers());

  it('GET: roles and states', async () => {
    expect((await fetch(url('/me/provider/verification'))).status).toBe(401);
    expect((await fetch(url('/me/provider/verification'), { headers: auth('customer') })).status).toBe(403);
    expect((await fetch(url('/me/provider/verification'), { headers: auth('admin') })).status).toBe(403);
    const hank = VerificationState.parse(
      await (await fetch(url('/me/provider/verification'), { headers: auth('providerNotSubmitted') })).json(),
    );
    expect(hank).toMatchObject({ status: 'not_submitted', editable: true });
    const marcus = VerificationState.parse(
      await (await fetch(url('/me/provider/verification'), { headers: auth('provider') })).json(),
    );
    expect(marcus).toMatchObject({ status: 'verified', editable: false });
  });
  it('upload: 200 meta, bad type 415, 6 MB 413, bad type field 400, verified 422', async () => {
    const meta = DocumentMeta.parse(
      await (await uploadDoc('providerNotSubmitted', 'nic_front', png())).json(),
    );
    expect(meta).toMatchObject({ type: 'nic_front', fileName: 'nic.png', sizeBytes: 1000 });
    const docx = new File(['x'], 'id.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    expect((await uploadDoc('providerNotSubmitted', 'nic_back', docx)).status).toBe(415);
    expect(
      (await uploadDoc('providerNotSubmitted', 'nic_back', png('big.png', 6 * 1024 * 1024))).status,
    ).toBe(413);
    expect((await uploadDoc('providerNotSubmitted', 'passport', png())).status).toBe(400);
    expect((await uploadDoc('provider', 'nic_front', png())).status).toBe(422);
  });
  it("delete: own staged 204; another provider's document 404", async () => {
    const meta = DocumentMeta.parse(
      await (await uploadDoc('providerNotSubmitted', 'nic_front', png())).json(),
    );
    expect(
      (
        await fetch(url(`/me/provider/verification/documents/d-p10-nic_front-r`), {
          method: 'DELETE',
          headers: auth('providerNotSubmitted'),
        })
      ).status,
    ).toBe(404);
    expect(
      (
        await fetch(url(`/me/provider/verification/documents/${meta.id}`), {
          method: 'DELETE',
          headers: auth('providerNotSubmitted'),
        })
      ).status,
    ).toBe(204);
  });
});
