import type { Me } from '@fixit/contracts';

/** SPEC §8.4: same-site relative paths only; anything else is ignored. */
export function safeNext(raw: string | null | undefined): string | null {
  if (!raw?.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return null;
  try {
    const url = new URL(raw, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

/** S5 without `next`: providers → /dashboard, everyone else → / . */
export const roleHome = (me: Me | null): string => (me?.roles.includes('provider') ? '/dashboard' : '/');

/** D-2: where a signed-in user on /login, /signup, /forgot-password (or /admin/login) goes. */
export function postLoginTarget(me: Me | null, search: string, area: 'public' | 'admin' = 'public'): string {
  const next = safeNext(new URLSearchParams(search).get('next'));
  if (area === 'admin' && me?.roles.includes('admin')) return next?.startsWith('/admin') ? next : '/admin';
  if (area === 'admin') return roleHome(me);
  return next ?? roleHome(me);
}
