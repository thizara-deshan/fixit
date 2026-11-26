import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { AgreedPriceForm, type AgreedPriceFormInput } from '@fixit/contracts';
import { FormErrorBanner } from '@/components/form-error-banner';
import { FormField } from '@/components/form-field';
import { ResponsiveDialog } from '@/components/responsive-dialog';
import { SubmitButton } from '@/components/submit-button';
import { Button } from '@/components/ui/button';
import { FORM_COPY } from '@/lib/error-copy';
import { mapApiErrorToForm } from '@/lib/form-errors';
import { ApiError } from '@/lib/http';
import { notify } from '@/lib/toast';
import { firstNameOf } from '../copy';
import { useCompleteRequest } from '../hooks';
import type { ActionDialogProps } from './accept-dialog';
import { AgreedPriceInput } from './agreed-price-input';

/** §8.3 Complete dialog (A16). D-11: prefilled with the current agreed price; empty = unchanged. */
export function CompleteDialog({ view, open, onOpenChange, onConflict }: ActionDialogProps) {
  const complete = useCompleteRequest();
  const [banner, setBanner] = useState(false);
  const prefill = view.agreedPrice === null ? '' : String(view.agreedPrice);
  const form = useForm<AgreedPriceFormInput, unknown, z.output<typeof AgreedPriceForm>>({
    resolver: zodResolver(AgreedPriceForm),
    defaultValues: { agreedPrice: prefill },
  });
  const first = firstNameOf(view.customer.displayName);
  const formId = `complete-${view.ref}`;

  const close = (next: boolean) => {
    if (!next) {
      form.reset({ agreedPrice: prefill });
      setBanner(false);
    }
    onOpenChange(next);
  };

  const onSubmit = form.handleSubmit(({ agreedPrice }) => {
    setBanner(false);
    complete.mutate(
      { ref: view.ref, body: agreedPrice === undefined ? {} : { agreedPrice } },
      {
        onSuccess: () => {
          close(false);
          notify('Job marked completed.');
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
      title="Mark this job completed?"
      description={`${first} will get an email asking for a review. This can't be undone.`}
      dismissible={!complete.isPending}
      footer={
        <>
          <Button
            variant="secondary"
            className="w-full sm:w-auto"
            disabled={complete.isPending}
            onClick={() => {
              close(false);
            }}
          >
            Not yet
          </Button>
          <SubmitButton
            form={formId}
            className="w-full sm:w-auto"
            pending={complete.isPending}
            pendingLabel="Completing…"
          >
            Mark completed
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
        <FormField label="Final agreed price" optional error={form.formState.errors.agreedPrice?.message}>
          {(p) => <AgreedPriceInput {...p} {...form.register('agreedPrice')} />}
        </FormField>
      </form>
    </ResponsiveDialog>
  );
}
