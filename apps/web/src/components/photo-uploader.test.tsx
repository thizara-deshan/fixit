import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { readImageSize } from '@/lib/image-size';
import { ApiError } from '@/lib/http';
import { notify } from '@/lib/toast';
import { PhotoUploader } from './photo-uploader';

vi.mock('@/lib/image-size', () => ({ readImageSize: vi.fn() }));
vi.mock('@/lib/toast', () => ({ notify: vi.fn(), notifyError: vi.fn() }));

const png = (size = 10) => new File([new Uint8Array(size)], 'me.png', { type: 'image/png' });

function setup(photoUrl: string | null = null) {
  const upload = vi.fn().mockResolvedValue({ photoUrl: '/api/files/photos/k1' });
  const onUploaded = vi.fn();
  const remove = vi.fn().mockResolvedValue(undefined);
  const user = userEvent.setup({ applyAccept: false });
  render(
    <PhotoUploader
      photoUrl={photoUrl}
      categoryIcon="wrench"
      upload={upload}
      onUploaded={onUploaded}
      remove={remove}
    />,
  );
  const pick = (file: File) =>
    user.upload(screen.getByLabelText(photoUrl ? 'Replace photo' : 'Upload photo'), file);
  return { upload, onUploaded, remove, user, pick };
}

describe('PhotoUploader', () => {
  beforeEach(() => {
    vi.mocked(readImageSize).mockResolvedValue({ width: 800, height: 800 });
    vi.mocked(notify).mockClear();
  });
  it('wrong type and size are refused before upload', async () => {
    const { upload, pick } = setup();
    await pick(new File(['x'], 'a.gif', { type: 'image/gif' }));
    expect(await screen.findByText('Use a JPG, PNG or WebP image.')).toBeInTheDocument();
    await pick(png(6 * 1024 * 1024));
    expect(await screen.findByText('Image must be 5 MB or smaller.')).toBeInTheDocument();
    expect(upload).not.toHaveBeenCalled();
  });
  it('too small is refused', async () => {
    vi.mocked(readImageSize).mockResolvedValue({ width: 300, height: 500 });
    const { upload, pick } = setup();
    await pick(png());
    expect(await screen.findByText('Image must be at least 400 × 400 pixels.')).toBeInTheDocument();
    expect(upload).not.toHaveBeenCalled();
  });
  it('a good image uploads', async () => {
    const { upload, onUploaded, pick } = setup();
    const file = png();
    await pick(file);
    await waitFor(() => {
      expect(onUploaded).toHaveBeenCalledWith('/api/files/photos/k1');
    });
    expect(upload).toHaveBeenCalledWith(file, expect.anything());
  });
  it('a failing upload shows the failure copy', async () => {
    const { upload, pick } = setup();
    upload.mockRejectedValue(new ApiError(500, 'INTERNAL', 'x'));
    await pick(png());
    expect(
      await screen.findByText('Upload failed. Check your connection and try again.'),
    ).toBeInTheDocument();
  });
  it('Remove asks first, then removes and toasts', async () => {
    const { remove, user } = setup('/api/files/photos/k1');
    await user.click(screen.getByRole('button', { name: 'Remove' }));
    expect(await screen.findByText('Remove your photo?')).toBeInTheDocument();
    const buttons = screen.getAllByRole('button', { name: 'Remove' });
    const last = buttons[buttons.length - 1];
    if (!last) throw new Error('no button');
    await user.click(last);
    await waitFor(() => {
      expect(remove).toHaveBeenCalled();
      expect(notify).toHaveBeenCalledWith('Photo removed.');
    });
  });
});
