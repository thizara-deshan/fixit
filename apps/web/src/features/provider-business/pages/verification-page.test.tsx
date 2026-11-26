import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { armForcedError } from '@/mocks/lib/controls';
import { notify } from '@/lib/toast';
import { FIXED_NOW } from '@/test/fixed-now';
import { renderRoute } from '@/test/render';
import { signInAs } from '@/test/sign-in';

vi.mock('@/lib/toast', () => ({ notify: vi.fn(), notifyError: vi.fn() }));

const user = () => userEvent.setup({ applyAccept: false, advanceTimers: vi.advanceTimersByTime });

describe('S26 verification', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] });
    Element.prototype.scrollIntoView = vi.fn();
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  it('AC5: Hank — copy, 4 slots, errors, submit → pending with read-only list', async () => {
    signInAs('providerNotSubmitted');
    renderRoute('/dashboard/verification');
    expect(
      await screen.findByRole('heading', { level: 2, name: 'Get the Verified badge' }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('JPG, PNG or PDF, up to 5 MB')).toHaveLength(4);
    expect(screen.getAllByText('Required')).toHaveLength(2);
    expect(screen.getAllByText('Optional')).toHaveLength(2);
    expect(screen.getByText('Only you and Fixit admins can see these documents.')).toBeInTheDocument();
    const u = user();
    await u.upload(
      screen.getByLabelText(/Choose file for NIC — front/),
      new File([new Uint8Array(900)], 'front.png', { type: 'image/png' }),
    );
    expect(await screen.findByText('front.png')).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: 'Submit for review' }));
    expect(await screen.findByText('Upload the back of your NIC.')).toBeInTheDocument();
    await u.upload(
      screen.getByLabelText(/Choose file for NIC — back/),
      new File([new Uint8Array(900)], 'back.pdf', { type: 'application/pdf' }),
    );
    expect(await screen.findByText('back.pdf')).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: 'Submit for review' }));
    expect(
      await screen.findByRole('heading', { level: 2, name: "We're checking your documents" }),
    ).toBeInTheDocument();
    expect(notify).toHaveBeenCalledWith("Documents submitted. We'll email you when they're checked.");
    expect(screen.getByText('Submitted documents')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Submit/ })).not.toBeInTheDocument();
  });
  it('AC6: Grace (rejected) — reason banner, prefilled slots, Submit again', async () => {
    signInAs('providerRejected');
    renderRoute('/dashboard/verification');
    expect(
      await screen.findByText(/^Reason: The photo of the back of your NIC is blurry/),
    ).toBeInTheDocument();
    expect(screen.getByText('Fix the issue below and submit again.')).toBeInTheDocument();
    expect(screen.getAllByText('nic-front.jpg').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Submit again' })).toBeInTheDocument();
  });
  it("AC6: Marcus (verified) — You're verified + date", async () => {
    signInAs('provider');
    renderRoute('/dashboard/verification');
    expect(await screen.findByRole('heading', { level: 2, name: "You're verified" })).toBeInTheDocument();
    expect(screen.getByText(/^Verified on /)).toBeInTheDocument();
  });
  it('AC7: leaving with an uploaded, unsubmitted file asks Discard changes?', async () => {
    signInAs('providerNotSubmitted');
    const view = renderRoute('/dashboard/verification');
    await user().upload(
      await screen.findByLabelText(/Choose file for NIC — front/),
      new File(['x'], 'f.png', { type: 'image/png' }),
    );
    await screen.findByText('f.png');
    void view.router.navigate('/dashboard');
    expect(await screen.findByText('Discard changes?')).toBeInTheDocument();
  });
  it('AC8: load failure shows the section error; retry recovers', async () => {
    signInAs('providerNotSubmitted');
    armForcedError('verification_get', '500');
    renderRoute('/dashboard/verification');
    await user().click(await screen.findByRole('button', { name: 'Try again' }));
    expect(
      await screen.findByRole('heading', { level: 2, name: 'Get the Verified badge' }),
    ).toBeInTheDocument();
  });
});
