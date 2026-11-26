import { describe, expect, it } from 'vitest';
import { checkUpload, missingRequiredDocuments, MAX_UPLOAD_BYTES } from './uploads';

describe('uploads', () => {
  it('documents: JPG/PNG/PDF ≤ 5 MB', () => {
    expect(checkUpload('document', { mimeType: 'application/pdf', sizeBytes: MAX_UPLOAD_BYTES })).toBeNull();
    expect(checkUpload('document', { mimeType: 'image/webp', sizeBytes: 10 })).toBe('type');
    expect(
      checkUpload('document', {
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        sizeBytes: 10,
      }),
    ).toBe('type');
    expect(checkUpload('document', { mimeType: 'image/png', sizeBytes: 6 * 1024 * 1024 })).toBe('size');
  });
  it('photos: JPG/PNG/WebP, type before size', () => {
    expect(checkUpload('photo', { mimeType: 'image/webp', sizeBytes: 1 })).toBeNull();
    expect(checkUpload('photo', { mimeType: 'application/pdf', sizeBytes: 9e9 })).toBe('type');
    expect(checkUpload('photo', { mimeType: '', sizeBytes: 1 })).toBe('type');
  });
  it('missing NIC sides', () => {
    expect(missingRequiredDocuments([])).toEqual(['nic_front', 'nic_back']);
    expect(missingRequiredDocuments(['nic_front', 'trade_certificate'])).toEqual(['nic_back']);
    expect(missingRequiredDocuments(['nic_back', 'nic_front'])).toEqual([]);
  });
});
