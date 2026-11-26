import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { http } from 'msw';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider } from '@tanstack/react-query';
import { server } from '@/mocks/node';
import { armForcedError } from '@/mocks/lib/controls';
import { qk } from '@/lib/query-keys';
import { FIXED_NOW } from '@/test/fixed-now';
import { createTestQueryClient } from '@/test/render';
import { signInAs } from '@/test/sign-in';
import { fetchVerification } from '../api';
import { useVerification } from '../hooks';
import { DocumentSlot } from './document-slot';

function Slots() {
  const v = useVerification();
  if (!v.data) return null;
  const doc = (t: 'nic_front' | 'nic_back') => v.data.documents.find((d) => d.type === t) ?? null;
  return (
    <>
      <DocumentSlot type="nic_front" doc={doc('nic_front')} onBusyChange={vi.fn()} onUploaded={vi.fn()} />
      <DocumentSlot type="nic_back" doc={doc('nic_back')} onBusyChange={vi.fn()} onUploaded={vi.fn()} />
    </>
  );
}

async function setup() {
  signInAs('providerNotSubmitted');
  const qc = createTestQueryClient();
  qc.setQueryData(qk.verification, await fetchVerification());
  render(
    <QueryClientProvider client={qc}>
      <Slots />
    </QueryClientProvider>,
  );
  return userEvent.setup({ applyAccept: false, advanceTimers: vi.advanceTimersByTime });
}
const front = () => screen.getByLabelText(/Choose file for NIC — front/);

describe('DocumentSlot', () => {
  beforeEach(() => vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] }));
  afterEach(() => vi.useRealTimers());

  it('refuses a .docx and a 6 MB image', async () => {
    const user = await setup();
    const docx = new File(['x'], 'id.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    await user.upload(front(), docx);
    expect(await screen.findByText('Use a JPG, PNG or PDF file.')).toBeInTheDocument();
    await user.upload(front(), new File([new Uint8Array(6 * 1024 * 1024)], 'big.png', { type: 'image/png' }));
    expect(await screen.findByText('File must be 5 MB or smaller.')).toBeInTheDocument();
  });
  it('a forced failure shows the failure copy in this slot only', async () => {
    const user = await setup();
    armForcedError('verification_document_upload', '500');
    await user.upload(front(), new File(['x'], 'nic.png', { type: 'image/png' }));
    expect(
      await screen.findByText('Upload failed. Check your connection and try again.'),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('alert')).toHaveLength(1);
  });
  it('in flight: progress and Cancel; Cancel returns to Choose file without an error', async () => {
    const user = await setup();
    server.use(http.post('/api/me/provider/verification/documents', () => new Promise(() => undefined)));
    await user.upload(front(), new File(['x'], 'nic.pdf', { type: 'application/pdf' }));
    expect(await screen.findByRole('progressbar', { name: 'Uploading nic.pdf' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(await screen.findAllByRole('button', { name: 'Choose file' })).toHaveLength(2);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
  it('success shows the file, Replace and Remove; Remove empties the slot', async () => {
    const user = await setup();
    await user.upload(front(), new File(['x'], 'nic.pdf', { type: 'application/pdf' }));
    expect(await screen.findByText('nic.pdf')).toBeInTheDocument();
    expect(screen.getByText('1 KB')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Replace' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Remove' }));
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Choose file' })).toHaveLength(2);
    });
  });
});
