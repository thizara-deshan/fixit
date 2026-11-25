import { useAuth } from '@/lib/auth-store';

export type ProviderCta = { label: 'Join as a provider' | 'Go to your dashboard'; to: string } | null;

/** D-3 (UX only; the server decides). null = admin: no primary CTA. */
export function useProviderCta(): ProviderCta {
  const { status, me } = useAuth();
  if (status !== 'signed-in' || !me) return { label: 'Join as a provider', to: '/signup?intent=provider' };
  if (me.roles.includes('admin')) return null;
  if (me.roles.includes('provider')) return { label: 'Go to your dashboard', to: '/dashboard' };
  return { label: 'Join as a provider', to: '/become-a-provider/1' };
}
