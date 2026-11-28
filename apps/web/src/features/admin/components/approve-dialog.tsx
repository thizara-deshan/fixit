import { useState } from 'react';
import { BadgeCheck } from 'lucide-react';
import type { VerificationDetail } from '@fixit/contracts';
import { FormErrorBanner } from '@/components/form-error-banner';
import { ResponsiveDialog } from '@/components/responsive-dialog';
import { SubmitButton } from '@/components/submit-button';
import { Button } from '@/components/ui/button';
import { FORM_COPY } from '@/lib/error-copy';
import { ApiError } from '@/lib/http';
import { notify } from '@/lib/toast';
import { useApproveVerification } from '../hooks';

interface DecisionDialogProps {
  v: VerificationDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: (nextId: string | null) => void;
  onConflict: () => void;
}

/** S32.E5 (A29). Not optimistic. */
export function ApproveDialog({ v, open, onOpenChange, onDone, onConflict }: DecisionDialogProps) {
  const approve = useApproveVerification();
  const [failed, setFailed] = useState(false);
  const business = v.provider.businessName;

  const close = (next: boolean) => {
    if (!next) setFailed(false);
    onOpenChange(next);
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={close}
      align="center"
      title={`Approve ${business}?`}
      description="They'll get the Verified badge and an email."
      icon={
        <span className="bg-success-soft text-success grid size-14 place-items-center rounded-xl">
          <BadgeCheck aria-hidden="true" className="size-7" />
        </span>
      }
      dismissible={!approve.isPending}
      footer={
        <>
          <Button
            variant="secondary"
            className="w-full sm:w-auto"
            disabled={approve.isPending}
            onClick={() => {
              close(false);
            }}
          >
            Cancel
          </Button>
          <SubmitButton
            variant="primary"
            className="w-full sm:w-auto"
            pending={approve.isPending}
            pendingLabel="Approving…"
            onClick={() => {
              setFailed(false);
              approve.mutate(v.id, {
                onSuccess: (res) => {
                  close(false);
                  notify(`${business} is verified.`);
                  onDone(res.nextId);
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
            Approve
          </SubmitButton>
        </>
      }
    >
      {failed && <FormErrorBanner>{FORM_COPY.saveFailed}</FormErrorBanner>}
    </ResponsiveDialog>
  );
}
