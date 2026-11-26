import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { Check } from 'lucide-react';
import { AgreedPriceForm, type AgreedPriceFormInput, type ProviderRequestView } from '@fixit/contracts';
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
import { useAcceptRequest } from '../hooks';
import { AgreedPriceInput } from './agreed-price-input';

export interface ActionDialogProps {
  view: ProviderRequestView;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** A 409: the request changed meanwhile (D-6). */
  onConflict: (ref: string) => void;
}

/** §8.3 Accept dialog (A13). Not optimistic, no Undo (SPEC §6.5). */
export function AcceptDialog({ view, open, onOpenChange, onConflict }: ActionDialogProps) {
  const accept = useAcceptRequest();
  const [banner, setBanner] = useState(false);
  const form = useForm<AgreedPriceFormInput, unknown, z.output<typeof AgreedPriceForm>>({
    resolver: zodResolver(AgreedPriceForm),
    defaultValues: { agreedPrice: '' },
  });
  const first = firstNameOf(view.customer.displayName);
  const formId = `accept-${view.ref}`;

  const close = (next: boolean) => {
    if (!next) {
      form.reset();
      setBanner(false);
    }
    onOpenChange(next);
  };

  const onSubmit = form.handleSubmit(({ agreedPrice }) => {
    setBanner(false);
    accept.mutate(
      { ref: view.ref, body: agreedPrice === undefined ? {} : { agreedPrice } },
      {
        onSuccess: (v) => {
          close(false);
          notify(`Accepted ${firstNameOf(v.customer.displayName)}'s request`);
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
      title={`Accept ${first}'s request?`}
      description={`${first} will be emailed, and you'll see their full name, address and mobile number.`}
      dismissible={!accept.isPending}
      footer={
        <>
          <Button
            variant="secondary"
            className="w-full sm:w-auto"
            disabled={accept.isPending}
            onClick={() => {
              close(false);
            }}
          >
            Cancel
          </Button>
          <SubmitButton
            form={formId}
            className="w-full sm:w-auto"
            pending={accept.isPending}
            pendingLabel="Accepting…"
          >
            <Check aria-hidden="true" className="size-4" />
            Accept request
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
          label="Agreed price"
          optional
          help="You can change it until the job is completed."
          error={form.formState.errors.agreedPrice?.message}
        >
          {(p) => <AgreedPriceInput {...p} {...form.register('agreedPrice')} />}
        </FormField>
      </form>
    </ResponsiveDialog>
  );
}
