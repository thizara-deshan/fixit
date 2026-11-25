import type { ReactNode } from 'react';
import { UnconfirmedEmailBanner } from '@/features/auth/components/unconfirmed-email-banner';
import { useAuth } from '@/lib/auth-store';

/** SPEC §6.8 in priority order. M04: #6 only; M11/M12 add the provider and onboarding rows. */
export function useAccountBanners(): ReactNode[] {
  const { me } = useAuth();
  if (!me || me.roles.includes('admin')) return [];
  const banners: ReactNode[] = [];
  if (!me.emailConfirmed) banners.push(<UnconfirmedEmailBanner key="unconfirmed" email={me.email} />);
  return banners;
}
