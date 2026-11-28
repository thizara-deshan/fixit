import { useState } from 'react';
import { RejectBody, type VerificationDetail } from '@fixit/contracts';
import { ApiError } from '@/lib/http';
import { notify } from '@/lib/toast';
import { useRejectVerification } from '../hooks';
import { ReasonDialog } from './reason-dialog';

interface Props {
  v: VerificationDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: (nextId: string | null) => void;
  onConflict: () => void;
}

/** S32.E6 (A30). */
export function RejectDialog({ v, open, onOpenChange, onDone, onConflict }: Props) {
  const reject = useRejectVerification();
  const [failed, setFailed] = useState(false);
  const business = v.provider.businessName;
  return (
    <ReasonDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setFailed(false);
        onOpenChange(next);
      }}
      title={`Reject ${business}'s documents?`}
      schema={RejectBody}
      label="Reason for rejection"
      help="The provider sees this in the email and on their Verification page."
      submitLabel="Reject"
      pendingLabel="Rejecting…"
      tone="danger"
      pending={reject.isPending}
      failed={failed}
      formId={`reject-${v.id}`}
      onSubmit={(reason, onApiError) => {
        setFailed(false);
        reject.mutate(
          { id: v.id, body: { reason } },
          {
            onSuccess: (res) => {
              onOpenChange(false);
              notify(`Rejected. ${business} has been emailed.`);
              onDone(res.nextId);
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
