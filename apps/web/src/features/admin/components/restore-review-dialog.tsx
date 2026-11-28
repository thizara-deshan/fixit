import { useState } from 'react';
import type { ModerationRow } from '@fixit/contracts';
import { FormErrorBanner } from '@/components/form-error-banner';
import { ResponsiveDialog } from '@/components/responsive-dialog';
import { SubmitButton } from '@/components/submit-button';
import { Button } from '@/components/ui/button';
import { FORM_COPY } from '@/lib/error-copy';
import { ApiError } from '@/lib/http';
import { notify } from '@/lib/toast';
import { useRestoreReview } from '../hooks';

interface Props {
  row: ModerationRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConflict: () => void;
}

/** S37.E3 (A33). */
export function RestoreReviewDialog({ row, open, onOpenChange, onConflict }: Props) {
  const restore = useRestoreReview();
  const [failed, setFailed] = useState(false);
  const close = (next: boolean) => {
    if (!next) setFailed(false);
    onOpenChange(next);
  };
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={close}
      align="center"
      title="Restore this review?"
      description={`It shows on ${row.provider.businessName}'s profile and counts toward their rating again.`}
      dismissible={!restore.isPending}
      footer={
        <>
          <Button
            variant="secondary"
            className="w-full sm:w-auto"
            disabled={restore.isPending}
            onClick={() => {
              close(false);
            }}
          >
            Cancel
          </Button>
          <SubmitButton
            variant="primary"
            className="w-full sm:w-auto"
            pending={restore.isPending}
            pendingLabel="Restoring…"
            onClick={() => {
              setFailed(false);
              restore.mutate(row.id, {
                onSuccess: () => {
                  close(false);
                  notify('Review restored.');
                },
                onError: (e) => {
                  if (e instanceof ApiError && e.status === 409) {
                    close(false);
                    onConflict();
                    return;
                  }
                  setFailed(true);
                },
              });
            }}
          >
            Restore
          </SubmitButton>
        </>
      }
    >
      {failed && <FormErrorBanner>{FORM_COPY.saveFailed}</FormErrorBanner>}
    </ResponsiveDialog>
  );
}
