import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { authStore } from '@/lib/auth-store';
import { renderRoute } from '@/test/render';
import { signInAs } from '@/test/sign-in';

const guest = () => {
  authStore.setGuest();
};

describe('guards (SPEC §8.4, AC4)', () => {
  it.each([
    ['guest', '/requests', '/login?next=%2Frequests'],
    ['guest', '/admin', '/admin/login?next=%2Fadmin'],
    ['providerDraft', '/dashboard', '/become-a-provider/3'],
    ['customer', '/dashboard', '/become-a-provider/1'],
    ['customer', '/login', '/'],
    ['provider', '/login', '/dashboard'],
    ['admin', '/admin/login', '/admin'],
    ['provider', '/become-a-provider/1', '/dashboard'],
  ] as const)('%s on %s → %s', async (who, from, to) => {
    if (who === 'guest') guest();
    else signInAs(who);
    const r = renderRoute(from);
    await waitFor(() => {
      expect(r.location()).toBe(to);
    });
  });

  it('signed-in customer on /login?next=/requests goes to /requests', async () => {
    signInAs('customer');
    const r = renderRoute('/login?next=%2Frequests');
    await waitFor(() => {
      expect(r.location()).toBe('/requests');
    });
  });
  it('signed-in customer on /login?next=https://evil.test goes to /', async () => {
    signInAs('customer');
    const r = renderRoute('/login?next=https%3A%2F%2Fevil.test');
    await waitFor(() => {
      expect(r.location()).toBe('/');
    });
  });

  it('Olivia on /admin sees S40 with her email', async () => {
    signInAs('customer');
    renderRoute('/admin');
    expect(
      await screen.findByRole('heading', { level: 1, name: "You don't have access to this page" }),
    ).toBeTruthy();
    expect(screen.getByText(/You're signed in as olivia@fixit\.test\./)).toBeTruthy();
  });

  it.each(['/requests', '/dashboard'])('Admin on %s sees S40', async (path) => {
    signInAs('admin');
    const r = renderRoute(path);
    expect(
      await screen.findByRole('heading', { level: 1, name: "You don't have access to this page" }),
    ).toBeTruthy();
    expect(r.location()).toBe(path);
  });

  it('Marcus reaches /dashboard inside L3', async () => {
    signInAs('provider');
    renderRoute('/dashboard');
    expect(
      await screen.findByRole('heading', { level: 1, name: /^Good (morning|afternoon|evening), Marcus$/ }),
    ).toBeTruthy();
    expect(screen.getAllByRole('navigation', { name: 'Dashboard' }).length).toBeGreaterThan(0);
  });
});

describe('S39 by area (AC5)', () => {
  it('/nope → S39 inside L1 with Go to home', async () => {
    guest();
    renderRoute('/nope');
    expect(await screen.findByRole('heading', { level: 1, name: "We can't find that page" })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Go to home' }).getAttribute('href')).toBe('/');
    expect(screen.getAllByRole('navigation', { name: 'Main' }).length).toBeGreaterThan(0);
  });
  it('/dashboard/nope → S39 inside L3 with Go to dashboard', async () => {
    signInAs('provider');
    renderRoute('/dashboard/nope');
    expect(await screen.findByRole('link', { name: 'Go to dashboard' })).toBeTruthy();
    expect(screen.getAllByRole('navigation', { name: 'Dashboard' }).length).toBeGreaterThan(0);
  });
  it('/admin/nope → S39 inside L4 with Go to overview', async () => {
    signInAs('admin');
    renderRoute('/admin/nope');
    expect(await screen.findByRole('link', { name: 'Go to overview' })).toBeTruthy();
    expect(screen.getAllByRole('navigation', { name: 'Admin' }).length).toBeGreaterThan(0);
  });
  it('flagged routes are not registered: /dashboard/settings → S39', async () => {
    signInAs('provider');
    renderRoute('/dashboard/settings');
    expect(await screen.findByRole('link', { name: 'Go to dashboard' })).toBeTruthy();
  });
});

describe('S41 (AC6)', () => {
  it('a route that throws renders S41 with an Error ID inside L1', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    guest();
    renderRoute('/dev/throw');
    expect(await screen.findByRole('heading', { level: 1, name: 'Something went wrong' })).toBeTruthy();
    expect(screen.getByText(/^Error ID: \S+$/)).toBeTruthy();
    expect(screen.getByText(/hello@fixit\.test/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
    expect(screen.getAllByRole('navigation', { name: 'Main' }).length).toBeGreaterThan(0);
    spy.mockRestore();
  });
});

describe('logout (A4)', () => {
  it('customer: S40 Log out → / and session cleared', async () => {
    signInAs('customer');
    const r = renderRoute('/admin');
    await userEvent.click(await screen.findByRole('button', { name: 'Log out' }));
    await waitFor(() => {
      expect(r.location()).toBe('/');
    });
    await waitFor(() => {
      expect(authStore.getState()).toMatchObject({ status: 'guest', signOutReason: null });
    });
  });
  it('admin: Log out → /admin/login', async () => {
    signInAs('admin');
    const r = renderRoute('/admin');
    await screen.findByRole('heading', { level: 1, name: 'Overview' });
    const buttons = screen.getAllByRole('button', { name: 'Log out' });
    await userEvent.click(buttons[0] as HTMLElement);
    await waitFor(() => {
      expect(r.location()).toBe('/admin/login');
    });
  });
});
