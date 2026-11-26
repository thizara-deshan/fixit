import { describe, expect, it } from 'vitest';
import { readMultipart } from './multipart';

describe('readMultipart', () => {
  it('reads text and file parts byte-exact', async () => {
    const data = Uint8Array.from({ length: 3000 }, (_, i) => i % 256);
    const form = new FormData();
    form.append('type', 'nic_front');
    form.append('file', new File([data], 'a.png', { type: 'image/png' }));
    const parts = await readMultipart(new Request('http://x/upload', { method: 'POST', body: form }));
    expect(parts.get('type')?.text).toBe('nic_front');
    const file = parts.get('file');
    expect(file).toMatchObject({ fileName: 'a.png', mimeType: 'image/png' });
    expect(file?.bytes).toEqual(data);
  });
  it('not multipart → empty', async () => {
    expect((await readMultipart(new Request('http://x', { method: 'POST', body: '{}' }))).size).toBe(0);
  });
});
