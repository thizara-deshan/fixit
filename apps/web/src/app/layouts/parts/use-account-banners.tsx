import { useState, type ReactNode } from 'react';
import { NoticeBanner } from '@/components/notice-banner';
import { UnconfirmedEmailBanner } from '@/features/auth/components/unconfirmed-email-banner';
import { useAuth } from '@/lib/auth-store';

const DISMISS_KEY = (id: string) => `fixit.banner.dismissed.${id}`;
function useSessionDismiss(id: string): [boolean, () => void] {
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem(DISMISS_KEY(id)) === '1');
  return [
    dismissed,
    () => {
      sessionStorage.setItem(DISMISS_KEY(id), '1');
      setDismissed(true);
    },
  ];
}

const FIELD_LABEL = { business_name: 'business name', category: 'category' } as const;

/** SPEC §6.8 in priority order; BannerSlot shows the first two. Provider rows only in L3 ('dashboard'). */
export function useAccountBanners(area: 'public' | 'dashboard'): ReactNode[] {
  const { me } = useAuth();
  const [badgeDismissed, dismissBadge] = useSessionDismiss('badge-removed');
  const [pendingDismissed, dismissPending] = useSessionDismiss('pending-review');
  if (!me || me.roles.includes('admin')) return [];
  const banners: ReactNode[] = [];
  const p = me.roles.includes('provider') ? me.provider : null;
  if (area === 'dashboard' && p) {
    if (p.verificationStatus === 'rejected')
      banners.push(
        <NoticeBanner
          key="rejected"
          variant="danger"
          action={{ label: 'Fix and resubmit', to: '/dashboard/verification' }}
        >
          Your verification wasn't approved: {p.rejectionReason ?? ''}
        </NoticeBanner>,
      );
    if (p.verificationStatus === 'pending_review' && p.reverificationReason && !badgeDismissed)
      banners.push(
        <NoticeBanner key="badge-removed" variant="info" onDismiss={dismissBadge}>
          Your Verified badge was removed because you changed your {FIELD_LABEL[p.reverificationReason]}.
          We're checking your documents again.
        </NoticeBanner>,
      );
    if (p.verificationStatus === 'not_submitted')
      banners.push(
        <NoticeBanner
          key="not-submitted"
          variant="warning"
          action={{ label: 'Get verified', to: '/dashboard/verification' }}
        >
          Your listing shows as "Not yet verified". Upload your ID to get the Verified badge.
        </NoticeBanner>,
      );
    if (p.verificationStatus === 'pending_review' && !p.reverificationReason && !pendingDismissed)
      banners.push(
        <NoticeBanner key="pending" variant="info" onDismiss={dismissPending}>
          We're checking your documents. We'll email you when it's done.
        </NoticeBanner>,
      );
  }
  if (!me.emailConfirmed) banners.push(<UnconfirmedEmailBanner key="unconfirmed" email={me.email} />);
  return banners;
}
