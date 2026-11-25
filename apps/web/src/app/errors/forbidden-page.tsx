import { Lock } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { useLogout } from '@/features/auth/hooks';
import { useAuth } from '@/lib/auth-store';
import { SystemFrame } from './not-found-page';

/** S40. */
export function ForbiddenPage() {
  const { me } = useAuth();
  const logout = useLogout();
  return (
    <SystemFrame>
      <EmptyState
        icon={Lock}
        titleAs="h1"
        title="You don't have access to this page"
        body={`You're signed in as ${me?.email ?? 'another account'}. Log out and sign in with a different account if you need to.`}
        action={{ label: 'Go to home', to: '/' }}
        secondaryAction={{
          label: 'Log out',
          onClick: () => {
            void logout();
          },
        }}
      />
    </SystemFrame>
  );
}
