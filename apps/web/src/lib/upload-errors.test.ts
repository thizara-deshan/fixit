import { describe, expect, it } from 'vitest';
import { ApiError } from './http';
import { uploadErrorCopy } from './upload-errors';

describe('uploadErrorCopy', () => {
  it('maps statuses', () => {
    expect(uploadErrorCopy(new DOMException('x', 'AbortError'), 'document')).toBeNull();
    expect(uploadErrorCopy(new ApiError(413, 'PAYLOAD_TOO_LARGE', 'x'), 'document')).toBe(
      'File must be 5 MB or smaller.',
    );
    expect(uploadErrorCopy(new ApiError(415, 'UNSUPPORTED_MEDIA', 'x'), 'photo')).toBe(
      'Use a JPG, PNG or WebP image.',
    );
    expect(uploadErrorCopy(new ApiError(500, 'INTERNAL', 'x'), 'photo')).toBe(
      'Upload failed. Check your connection and try again.',
    );
    expect(uploadErrorCopy(new ApiError(0, 'NETWORK', 'x'), 'document')).toBe(
      'Upload failed. Check your connection and try again.',
    );
  });
});
