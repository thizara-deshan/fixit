import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FIXED_NOW } from '@/test/fixed-now';
import { signInAs } from '@/test/sign-in';
import { renderAdminRoute } from '../test-routes';

beforeEach(() => {
  vi.useFakeTimers({ now: FIXED_NOW, toFake: ['Date'] });
  signInAs('admin');
});
afterEach(() => {
  vi.useRealTimers();
});

describe('S33 users', () => {
  it('?q=marcus lists Marcus Bell and keeps the term in the input', async () => {
    renderAdminRoute('/admin/users?q=marcus');
    expect(await screen.findByRole('link', { name: 'Marcus Bell' })).toBeTruthy();
    expect(screen.getByRole<HTMLInputElement>('searchbox', { name: 'Search users' }).value).toBe('marcus');
  });
  it('no match → empty state with Clear search', async () => {
    renderAdminRoute('/admin/users?q=zzzz');
    expect(await screen.findByText('No users match "zzzz"')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Clear search' }).getAttribute('href')).toBe('/admin/users');
  });
  it('?status=suspended lists Ruwan as Suspended and marks the tab', async () => {
    renderAdminRoute('/admin/users?status=suspended');
    expect(await screen.findByRole('link', { name: 'Ruwan Jayasekara' })).toBeTruthy();
    expect(screen.getAllByText('Suspended').length).toBeGreaterThan(1); // tab + pill
    expect(screen.getByRole('link', { name: /^Suspended/ }).getAttribute('aria-current')).toBe('page');
  });
  it('typing a term and pressing Enter updates the URL', async () => {
    const user = userEvent.setup();
    const { location } = renderAdminRoute('/admin/users');
    await screen.findAllByRole('link', { name: 'View' });
    await user.type(screen.getByRole('searchbox', { name: 'Search users' }), 'dana{Enter}');
    expect(location()).toBe('/admin/users?q=dana');
  });
});
