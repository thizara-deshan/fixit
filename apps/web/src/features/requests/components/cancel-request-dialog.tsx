import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { CancelBody, type CustomerRequestView } from '@fixit/contracts';
import { FormErrorBanner } from '@/components/form-error-banner';
import { FormField } from '@/components/form-field';
import { ResponsiveDialog } from '@/components/responsive-dialog';
import { SubmitButton } from '@/components/submit-button';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FORM_COPY } from '@/lib/error-copy';
import { mapApiErrorToForm } from '@/lib/form-errors';
import { ApiError } from '@/lib/http';
import { notify } from '@/lib/toast';
import { useCancelRequest } from '../hooks';

type Values = z.input<typeof CancelBody>;

interface Props {
  view: CustomerRequestView;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** A 409: the request changed under the customer. `reason` is `details.reason` when present. */
  onConflict: (reason: string | null) => void;
}

/** §8.3 cancel dialog (A12). */
export function CancelRequestDialog({ view, open, onOpenChange, onConflict }: Props) {
  const cancel = useCancelRequest(view.ref);
  const [banner, setBanner] = useState(false);
  const form = useForm<Values>({ resolver: zodResolver(CancelBody), defaultValues: { reason: '' } });
  const formId = `cancel-${view.ref}`;

  const close = (next: boolean) => {
    if (!next) {
      form.reset();
      setBanner(false);
    }
    onOpenChange(next);
  };

  const onSubmit = form.handleSubmit((values) => {
    setBanner(false);
    cancel.mutate(CancelBody.parse(values), {
      onSuccess: () => {
        close(false);
        notify('Request cancelled.');
      },
      onError: (e) => {
        if (e instanceof ApiError && e.status === 409) {
          close(false);
          const reason = e.envelope?.details?.reason;
          onConflict(typeof reason === 'string' ? reason : null);
          return;
        }
        if (mapApiErrorToForm(e, form.setError) !== null) setBanner(true);
      },
    });
  });

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={close}
      title="Cancel this request?"
      description={`${view.provider.businessName} will be emailed that you cancelled.`}
      dismissible={!cancel.isPending}
      footer={
        <>
          <Button
            variant="secondary"
            className="w-full sm:w-auto"
            disabled={cancel.isPending}
            onClick={() => {
              close(false);
            }}
          >
            Keep request
          </Button>
          <SubmitButton
            form={formId}
            variant="danger"
            className="w-full sm:w-auto"
            pending={cancel.isPending}
            pendingLabel="Cancelling…"
          >
            Cancel request
          </SubmitButton>
        </>
      }
    >
      <form
        id={formId}
        noValidate
        onSubmit={(e) => {
          void onSubmit(e);
        }}
        className="flex flex-col gap-4"
      >
        {banner && <FormErrorBanner>{FORM_COPY.saveFailed}</FormErrorBanner>}
        <FormField label="Reason" optional error={form.formState.errors.reason?.message}>
          {(p) => (
            <Textarea {...p} rows={3} maxLength={600} className="text-body" {...form.register('reason')} />
          )}
        </FormField>
      </form>
    </ResponsiveDialog>
  );
}
