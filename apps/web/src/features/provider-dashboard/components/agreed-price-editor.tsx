import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { AgreedPriceForm, type AgreedPriceFormInput, type ProviderRequestView } from '@fixit/contracts';
import { FormErrorBanner } from '@/components/form-error-banner';
import { FormField } from '@/components/form-field';
import { SubmitButton } from '@/components/submit-button';
import { Button } from '@/components/ui/button';
import { FORM_COPY } from '@/lib/error-copy';
import { formatLkr } from '@/lib/format';
import { mapApiErrorToForm } from '@/lib/form-errors';
import { ApiError } from '@/lib/http';
import { notify } from '@/lib/toast';
import { useSetAgreedPrice } from '../hooks';
import { LkrInput } from '@/components/lkr-input';

const asText = (n: number | null) => (n === null ? '' : String(n));

/** S22.E4 inline editor (A15). */
export function AgreedPriceEditor({
  view,
  onConflict,
}: {
  view: ProviderRequestView;
  onConflict: (ref: string) => void;
}) {
  const save = useSetAgreedPrice();
  const [editing, setEditing] = useState(false);
  const [banner, setBanner] = useState(false);
  const form = useForm<AgreedPriceFormInput, unknown, z.output<typeof AgreedPriceForm>>({
    resolver: zodResolver(AgreedPriceForm),
    defaultValues: { agreedPrice: asText(view.agreedPrice) },
  });

  const start = () => {
    form.reset({ agreedPrice: asText(view.agreedPrice) });
    setBanner(false);
    setEditing(true);
  };
  const onSubmit = form.handleSubmit(({ agreedPrice }) => {
    setBanner(false);
    save.mutate(
      { ref: view.ref, body: { agreedPrice: agreedPrice ?? null } },
      {
        onSuccess: () => {
          setEditing(false);
          notify('Agreed price saved.');
        },
        onError: (e) => {
          if (e instanceof ApiError && e.status === 409) {
            setEditing(false);
            onConflict(view.ref);
            return;
          }
          if (mapApiErrorToForm(e, form.setError) !== null) setBanner(true);
        },
      },
    );
  });

  if (!editing)
    return (
      <div className="flex flex-col gap-1">
        <h3 className="text-label text-text font-bold">Agreed price</h3>
        <div className="flex items-center gap-3">
          <span className="text-lead text-text font-bold">
            {view.agreedPrice === null ? 'Not set' : formatLkr(view.agreedPrice)}
          </span>
          <Button variant="link" size="inline" className="min-h-11 sm:min-h-0" onClick={start}>
            {view.agreedPrice === null ? 'Add' : 'Edit'}
          </Button>
        </div>
        <p className="text-meta text-text-subtle">For your records only — the customer pays you directly.</p>
      </div>
    );

  return (
    <form
      noValidate
      onSubmit={(e) => {
        void onSubmit(e);
      }}
      className="flex flex-col gap-3"
    >
      {banner && <FormErrorBanner>{FORM_COPY.saveFailed}</FormErrorBanner>}
      <FormField
        label="Agreed price"
        help="For your records only — the customer pays you directly."
        error={form.formState.errors.agreedPrice?.message}
      >
        {(p) => <LkrInput {...p} autoFocus {...form.register('agreedPrice')} />}
      </FormField>
      <div className="flex flex-col gap-2 sm:flex-row">
        <SubmitButton className="w-full sm:w-auto" pending={save.isPending} pendingLabel="Saving…">
          Save
        </SubmitButton>
        <Button
          variant="secondary"
          className="w-full sm:w-auto"
          disabled={save.isPending}
          onClick={() => {
            setEditing(false);
          }}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
