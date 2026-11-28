import { useMemo, useState } from 'react';
import { CircleAlert } from 'lucide-react';
import { makeAccountReasonBody, type AdminUserDetail } from '@fixit/contracts';
import { ApiError } from '@/lib/http';
import { notify } from '@/lib/toast';
import { suspendEffects } from '../copy';
import { useSuspendUser } from '../hooks';
import { ReasonDialog } from './reason-dialog';

interface Props {
  user: AdminUserDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConflict: () => void;
}

/** S34.E1 (A31, BR-40–42). The effects list sits in `lead` because a <ul> can't live inside the description <p>. */
export function SuspendDialog({ user, open, onOpenChange, onConflict }: Props) {
  const suspend = useSuspendUser();
  const [failed, setFailed] = useState(false);
  const schema = useMemo(() => makeAccountReasonBody(user.fullName), [user.fullName]);
  return (
    <ReasonDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setFailed(false);
        onOpenChange(next);
      }}
      title={`Suspend ${user.fullName}?`}
      schema={schema}
      lead={
        <ul className="flex flex-col gap-2">
          {suspendEffects(user.impact, user.provider !== null).map((line) => (
            <li key={line} className="text-body-sm text-text flex items-start gap-2">
              <CircleAlert aria-hidden="true" className="text-warning-text mt-0.5 size-4 shrink-0" />
              {line}
            </li>
          ))}
        </ul>
      }
      label="Reason"
      submitLabel="Suspend account"
      pendingLabel="Suspending…"
      tone="danger"
      pending={suspend.isPending}
      failed={failed}
      formId={`suspend-${user.id}`}
      onSubmit={(reason, onApiError) => {
        setFailed(false);
        suspend.mutate(
          { id: user.id, body: { reason } },
          {
            onSuccess: () => {
              onOpenChange(false);
              notify(`${user.fullName} is suspended.`);
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
