import { useEffect } from 'react';
import { useBlocker } from 'react-router';
import { Button } from '@/components/ui/button';
import { authStore } from '@/lib/auth-store';
import { ResponsiveDialog } from './responsive-dialog';

/** SPEC §6.7. One per page (D-8). Never blocks once signed out, so expiry/logout redirects pass. */
export function DiscardChangesGuard({ when }: { when: boolean }) {
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      when &&
      authStore.getState().status === 'signed-in' &&
      currentLocation.pathname !== nextLocation.pathname,
  );
  useEffect(() => {
    if (!when) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [when]);
  const blocked = blocker.state === 'blocked';
  return (
    <ResponsiveDialog
      open={blocked}
      onOpenChange={(open) => {
        if (!open && blocker.state === 'blocked') blocker.reset();
      }}
      title="Discard changes?"
      description="What you've entered won't be saved."
      footer={
        <>
          <Button
            variant="secondary"
            onClick={() => {
              if (blocker.state === 'blocked') blocker.reset();
            }}
          >
            Keep editing
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (blocker.state === 'blocked') blocker.proceed();
            }}
          >
            Discard
          </Button>
        </>
      }
    />
  );
}
