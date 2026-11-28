import { useState } from 'react';
import { HideReviewBody, type ModerationRow } from '@fixit/contracts';
import { ApiError } from '@/lib/http';
import { notify } from '@/lib/toast';
import { useHideReview } from '../hooks';
import { ReasonDialog } from './reason-dialog';

interface Props {
  row: ModerationRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConflict: () => void;
}

/** S37.E2 (A33). */
export function HideReviewDialog({ row, open, onOpenChange, onConflict }: Props) {
  const hide = useHideReview();
  const [failed, setFailed] = useState(false);
  const business = row.provider.businessName;
  return (
    <ReasonDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setFailed(false);
        onOpenChange(next);
      }}
      title="Hide this review?"
      description={`It disappears from ${business}'s profile and stops counting toward their rating. Its reply is hidden too.`}
      schema={HideReviewBody}
      label="Reason"
      help="Only admins see this."
      submitLabel="Hide review"
      pendingLabel="Hiding…"
      tone="danger"
      pending={hide.isPending}
      failed={failed}
      formId={`hide-${row.id}`}
      onSubmit={(reason, onApiError) => {
        setFailed(false);
        hide.mutate(
          { id: row.id, body: { reason } },
          {
            onSuccess: () => {
              onOpenChange(false);
              notify(`Review hidden. ${business}'s rating is updated.`);
            },
            onError: (e) => {
              if (e instanceof ApiError && e.status === 409) {
                onOpenChange(false);
                onConflict();
                return;
              }
              if (!onApiError(e)) setFailed(true);
            },
          },
        );
      }}
    />
  );
}
