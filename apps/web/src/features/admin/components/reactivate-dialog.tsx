import { useMemo, useState } from 'react';
import { makeAccountReasonBody, type AdminUserDetail } from '@fixit/contracts';
import { ApiError } from '@/lib/http';
import { notify } from '@/lib/toast';
import { useReactivateUser } from '../hooks';
import { ReasonDialog } from './reason-dialog';

interface Props {
  user: AdminUserDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConflict: () => void;
}

/** S34.E2 (A32, BR-43). */
export function ReactivateDialog({ user, open, onOpenChange, onConflict }: Props) {
  const reactivate = useReactivateUser();
  const [failed, setFailed] = useState(false);
  const schema = useMemo(() => makeAccountReasonBody(user.fullName), [user.fullName]);
  return (
    <ReasonDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setFailed(false);
        onOpenChange(next);
      }}
      title={`Reactivate ${user.fullName}?`}
      description="They can sign in again and their listing comes back. Cancelled or declined requests stay closed, and verification doesn't change."
      schema={schema}
      label="Reason"
      submitLabel="Reactivate"
      pendingLabel="Reactivating…"
      tone="primary"
      pending={reactivate.isPending}
      failed={failed}
      formId={`reactivate-${user.id}`}
      onSubmit={(reason, onApiError) => {
        setFailed(false);
        reactivate.mutate(
          { id: user.id, body: { reason } },
          {
            onSuccess: () => {
              onOpenChange(false);
              notify(`${user.fullName} is active again.`);
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
