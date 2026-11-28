import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { DocumentMeta } from '@fixit/contracts';
import { db } from '@/mocks/db/store';
import { toDocumentMeta } from '@/mocks/lib/verification';
import { renderWithProviders } from '@/test/render';
import { signInAs } from '@/test/sign-in';
import { DocumentTiles } from './document-tiles';
import { DocumentViewer } from './document-viewer';

const nicFront = (): DocumentMeta => {
  const doc = db().documents['d-p02-nic-front'];
  if (!doc) throw new Error('fixture document missing');
  return toDocumentMeta(doc);
};

beforeEach(() => {
  signInAs('admin');
  URL.createObjectURL = vi.fn(() => 'blob:x');
  URL.revokeObjectURL = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe('DocumentViewer', () => {
  it('shows the image from an object URL, links to open in a new tab, Esc closes', async () => {
    const onClose = vi.fn();
    renderWithProviders(<DocumentViewer doc={nicFront()} onClose={onClose} />);
    expect(await screen.findByRole('dialog', { name: 'NIC — front' })).toBeTruthy();
    const img = await screen.findByRole('img', { name: 'NIC — front' });
    expect(img.getAttribute('src')).toBe('blob:x');
    expect(screen.getByRole('link', { name: 'Open in new tab' }).getAttribute('href')).toBe('blob:x');
    expect(screen.getByRole('button', { name: 'Fit' }).getAttribute('aria-pressed')).toBe('true');
    await userEvent.setup().keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });
});

describe('DocumentTiles', () => {
  it('two provided documents leave two "Not provided" slots', () => {
    const front = nicFront();
    renderWithProviders(
      <DocumentTiles documents={[front, { ...front, id: 'x', type: 'nic_back' }]} onOpen={vi.fn()} />,
    );
    expect(screen.getAllByText('Not provided')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Open NIC — back' })).toBeTruthy();
  });
});
