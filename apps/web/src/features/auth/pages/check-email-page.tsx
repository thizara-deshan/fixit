import { useEffect } from 'react';
import { Mail } from 'lucide-react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { AuthSession } from '@fixit/contracts';
import { Button } from '@/components/ui/button';
import { authStore, useAuth } from '@/lib/auth-store';
import { useCooldown } from '@/lib/use-cooldown';
import { AuthCardHeader } from '../components/auth-card-header';
import { useResendConfirmation } from '../hooks';

const linkClass =
  'text-label text-primary hover:text-primary-hover font-semibold underline-offset-2 hover:underline';

export function CheckEmailPage() {
  const { me, status } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { email?: string; session?: unknown } | null;
  const email = me?.email ?? state?.email;
  const resend = useResendConfirmation();
  const cooldown = useCooldown(60);

  // S6 hands the new session over here (not guest-guarded, so /signup never sees a signed-in user). Then drop it from history state.
  useEffect(() => {
    if (status !== 'guest') return;
    const parsed = AuthSession.safeParse(state?.session);
    if (!parsed.success) return;
    authStore.setSession(parsed.data);
    void navigate(location.pathname, { replace: true, state: { email: parsed.data.user.email } });
  }, [status, state, navigate, location.pathname]);

  if (status === 'booting') return null;
  if (!email) return <Navigate to="/signup" replace />;
  const coolingDown = cooldown.remaining > 0;
  return (
    <>
      <AuthCardHeader icon={Mail} title="Check your email" />
      <p className="text-body-sm text-text-muted">
        We sent a confirmation link to <span className="text-text font-semibold">{email}</span>. Open it to
        confirm your account — the link works for 24 hours.
      </p>
      {status === 'signed-in' && (
        <Button
          variant="secondary"
          size="lg"
          className="w-full"
          disabled={coolingDown || resend.isPending}
          aria-busy={resend.isPending || undefined}
          onClick={() => {
            resend.mutate(undefined, { onSuccess: cooldown.start });
          }}
        >
          {coolingDown ? `Resend in ${cooldown.label}` : 'Resend email'}
        </Button>
      )}
      <Link to="/signup" className={`${linkClass} self-center`}>
        Use a different email
      </Link>
      <p className="text-meta text-text-muted">
        You can browse Fixit while you wait, but you'll need to confirm your email before sending a request or
        setting up a listing.{' '}
        <Link to="/discover" className={linkClass}>
          Browse providers
        </Link>
      </p>
    </>
  );
}
