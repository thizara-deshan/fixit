import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { notify } from '@/lib/toast';
import { FIXED_NOW } from '@/test/fixed-now';
import { setViewportWidth } from '@/test/media';
import { renderRoute } from '@/test/render';
import { signInAs } from '@/test/sign-in';

vi.mock('@/lib/toast', () => ({ notify: vi.fn(), notifyError: vi.fn() }));

const open = (ref: string, persona: 'provider' | 'providerNotSubmitted' = 'provider') => {
  signInAs(persona);
  renderRoute(`/dashboard/requests/${ref}`);
};

describe('S22 provider request detail', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] });
    vi.mocked(notify).mockClear();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('AC5: pending is private; accept reveals the contact', async () => {
    const user = userEvent.setup();
    open('FX-2061');
    expect(await screen.findByRole('heading', { level: 1, name: 'Leak repair' })).toBeTruthy();
    expect(screen.getByText('Olivia M.')).toBeTruthy();
    expect(screen.getByText('Full name, address and mobile number are shown after you accept.')).toBeTruthy();
    expect(screen.getByText('Respond by Wed, 25 Nov, 12:00 AM')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Accept' }));
    await user.click(await screen.findByRole('button', { name: 'Accept request' }));
    expect(await screen.findByText('Olivia Martinez')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Call' }).getAttribute('href')).toMatch(/^tel:\+947/);
    expect(screen.getByRole('button', { name: 'Copy' })).toBeTruthy();
  });

  it('AC5: future accepted → complete disabled; agreed price edit', async () => {
    const user = userEvent.setup();
    open('FX-2050');
    const complete = await screen.findByRole('button', { name: 'Mark as completed' });
    expect(complete).toHaveProperty('disabled', true);
    expect(screen.getByText('You can mark this job completed from Tue, 24 Nov.')).toBeTruthy();
    expect(screen.getByText('LKR 4,500')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Edit' }));
    const input = screen.getByLabelText(/Agreed price/);
    await user.clear(input);
    await user.type(input, '8000');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => {
      expect(notify).toHaveBeenCalledWith('Agreed price saved.');
    });
    expect(await screen.findByText('LKR 8,000')).toBeTruthy();
  });

  it('AC5: accepted-today → complete → completed card', async () => {
    const user = userEvent.setup();
    open('FX-2054');
    await user.click(await screen.findByRole('button', { name: 'Mark as completed' }));
    expect(
      await screen.findByText("Ethan will get an email asking for a review. This can't be undone."),
    ).toBeTruthy();
    expect(screen.getByLabelText(/Final agreed price/)).toHaveProperty('value', '3500');
    await user.click(screen.getByRole('button', { name: 'Mark completed' }));
    await waitFor(() => {
      expect(notify).toHaveBeenCalledWith('Job marked completed.');
    });
    expect(await screen.findByText('Completed on Sun, 22 Nov 2026')).toBeTruthy();
    expect(screen.getByText('The customer can review until Tue, 22 Dec 2026.')).toBeTruthy();
  });

  it.each([
    ['FX-2038', 'Daniel cancelled this request.', 'Reason: Found someone closer to home.', 'cancelled'],
    [
      'FX-2039',
      'Fixit cancelled this request.',
      'Reason: The customer asked us to cancel this job.',
      'cancelled',
    ],
    ['FX-2037', 'You declined this request.', 'Reason: Outside my service area.', 'declined'],
  ])('AC6: %s closed copy and privacy', async (ref, line, reason, status) => {
    open(ref);
    expect(await screen.findByText(line)).toBeTruthy();
    expect(screen.getByText(reason)).toBeTruthy();
    expect(screen.getByText(`Contact details are hidden because this request is ${status}.`)).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Call' })).toBeNull();
  });

  it('AC6: expired', async () => {
    open('FX-2040');
    expect(
      await screen.findByText("This request expired on Wed, 4 Nov 2026 because it wasn't answered in time."),
    ).toBeTruthy();
    expect(screen.getByText('Sophia N.')).toBeTruthy();
  });

  it("AC9: another provider's ref → S39 request variant", async () => {
    open('FX-2061', 'providerNotSubmitted');
    expect(await screen.findByText("We can't find that request")).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Go to requests' }).getAttribute('href')).toBe(
      '/dashboard/requests',
    );
  });

  it('AC7: phone → sticky Decline/Accept bar, dialog as bottom sheet', async () => {
    const user = userEvent.setup();
    setViewportWidth(390);
    open('FX-2061');
    await user.click(await screen.findByRole('button', { name: 'Accept' }));
    expect(await screen.findByRole('button', { name: 'Accept request' })).toBeTruthy();
    expect(document.querySelector('[data-variant="sheet"]')).not.toBeNull();
  });
});
