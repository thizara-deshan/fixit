import { BlockedCard } from '@/features/requests/components/blocked-card';
export function EmailGate({ email }: { email: string }) {
  return (
    <BlockedCard
      block={{
        kind: 'card',
        icon: 'mail',
        title: 'Confirm your email first',
        body: `We sent a link to ${email}. Confirm it, then come back to set up your listing.`,
        action: { label: 'Resend email', resend: true },
      }}
    />
  );
}
