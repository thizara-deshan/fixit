import { NoticeBanner } from '@/components/notice-banner';
import { useResendConfirmation } from '../hooks';

export function UnconfirmedEmailBanner({ email }: { email: string }) {
  const resend = useResendConfirmation();
  return (
    <NoticeBanner
      variant="warning"
      action={{
        label: 'Resend email',
        onClick: () => {
          if (!resend.isPending) resend.mutate();
        },
      }}
    >
      Confirm your email to send requests. We sent a link to {email}.
    </NoticeBanner>
  );
}
