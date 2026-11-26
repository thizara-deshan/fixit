import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { DeclineBody } from '@fixit/contracts';
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
import { firstNameOf } from '../copy';
import { useDeclineRequest } from '../hooks';
import type { ActionDialogProps } from './accept-dialog';

type Values = z.input<typeof DeclineBody>;

/** §8.3 Decline dialog (A14). Not optimistic, no Undo (SPEC §6.5). */
export function DeclineDialog({ view, open, onOpenChange, onConflict }: ActionDialogProps) {
  const decline = useDeclineRequest();
  const [banner, setBanner] = useState(false);
  const form = useForm<Values, unknown, z.output<typeof DeclineBody>>({
    resolver: zodResolver(DeclineBody),
    defaultValues: { reason: '' },
  });
  const first = firstNameOf(view.customer.displayName);
  const formId = `decline-${view.ref}`;

  const close = (next: boolean) => {
    if (!next) {
      form.reset();
      setBanner(false);
    }
    onOpenChange(next);
  };

  const onSubmit = form.handleSubmit((body) => {
    setBanner(false);
    decline.mutate(
      { ref: view.ref, body: { reason: body.reason } },
      {
        onSuccess: (v) => {
          close(false);
          notify(`Declined ${firstNameOf(v.customer.displayName)}'s request`);
        },
        onError: (e) => {
          if (e instanceof ApiError && e.status === 409) {
            close(false);
            onConflict(view.ref);
            return;
          }
          if (mapApiErrorToForm(e, form.setError) !== null) setBanner(true);
        },
      },
    );
  });

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={close}
      title={`Decline ${first}'s request?`}
      description={`${first} will be emailed. This can't be undone.`}
      dismissible={!decline.isPending}
      footer={
        <>
          <Button
            variant="secondary"
            className="w-full sm:w-auto"
            disabled={decline.isPending}
            onClick={() => {
              close(false);
            }}
          >
            Cancel
          </Button>
          <SubmitButton
            form={formId}
            variant="danger"
            className="w-full sm:w-auto"
            pending={decline.isPending}
            pendingLabel="Declining…"
          >
            Decline request
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
        <FormField
          label="Reason"
          optional
          help="Shown to the customer."
          error={form.formState.errors.reason?.message}
        >
          {(p) => (
            <Textarea {...p} rows={3} maxLength={600} className="text-body" {...form.register('reason')} />
          )}
        </FormField>
      </form>
    </ResponsiveDialog>
  );
}
