import { CircleCheck, TriangleAlert } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-store';
import { useDelayedFlag } from '@/lib/use-delayed-flag';
import { AuthCardHeader } from '../components/auth-card-header';
import { takeAfterSignupTarget, useConfirmEmail, useResendConfirmation } from '../hooks';

export function ConfirmEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const confirm = useConfirmEmail(token);
  const { status } = useAuth();
  const resend = useResendConfirmation();
  const navigate = useNavigate();
  const loading = token !== null && token !== '' && confirm.isPending;
  const showSkeleton = useDelayedFlag(loading);

  if (loading)
    return (
      <div aria-busy="true" className="flex flex-col gap-3">
        <span className="sr-only">Loading…</span>
        {showSkeleton && (
          <>
            <Skeleton className="size-14 rounded-xl" />
            <Skeleton className="h-7 w-3/5" />
            <Skeleton className="h-5 w-4/5" />
          </>
        )}
      </div>
    );

  if (confirm.data) {
    const already = confirm.data.status === 'already_confirmed';
    return (
      <>
        <AuthCardHeader
          icon={CircleCheck}
          tone="success"
          title={already ? 'Your email is already confirmed' : 'Email confirmed'}
          subtitle={already ? 'You can carry on where you left off.' : "You're all set."}
        />
        <Button
          size="lg"
          className="w-full"
          onClick={() => {
            void navigate(takeAfterSignupTarget(), { replace: true });
          }}
        >
          Continue
        </Button>
      </>
    );
  }

  // missing token, token_invalid, or any other failure → expired state
  return (
    <>
      <AuthCardHeader
        icon={TriangleAlert}
        tone="warning"
        title="This link has expired"
        subtitle="Confirmation links work for 24 hours. We can send you a new one."
      />
      {status === 'signed-in' ? (
        <Button
          size="lg"
          className="w-full"
          disabled={resend.isPending}
          aria-busy={resend.isPending || undefined}
          onClick={() => {
            resend.mutate();
          }}
        >
          Send a new link
        </Button>
      ) : (
        <Button
          size="lg"
          className="w-full"
          onClick={() => {
            void navigate('/login');
          }}
        >
          Log in to resend
        </Button>
      )}
    </>
  );
}
