import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AreasBody, type AreasFormInput, type CatalogResponse, type OwnProvider } from '@fixit/contracts';
import { AreasPicker } from '@/components/areas-picker';
import { FormErrorBanner } from '@/components/form-error-banner';
import { SubmitButton } from '@/components/submit-button';
import { mapApiErrorToForm } from '@/lib/form-errors';
import { notify } from '@/lib/toast';
import { useSaveAreas } from '../hooks';

const valuesOf = (p: OwnProvider): AreasFormInput => ({
  baseTownId: p.baseTown?.id ?? '',
  otherTownIds: p.otherTowns.map((t) => t.id),
});

export function AreasForm({
  own,
  catalog,
  onDirtyChange,
}: {
  own: OwnProvider;
  catalog: Pick<CatalogResponse, 'districts' | 'towns'>;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const form = useForm<AreasFormInput, unknown, AreasBody>({
    resolver: zodResolver(AreasBody),
    defaultValues: valuesOf(own),
  });
  const save = useSaveAreas();
  const [banner, setBanner] = useState<string | null>(null);
  const baseTownId = useWatch({ control: form.control, name: 'baseTownId' });
  const otherTownIds = useWatch({ control: form.control, name: 'otherTownIds' });
  const { errors, isDirty, isSubmitted } = form.formState;
  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);
  const submit = form.handleSubmit(async (v) => {
    setBanner(null);
    try {
      const saved = await save.mutateAsync(v);
      form.reset(valuesOf(saved));
      notify('Service areas saved.');
    } catch (e) {
      setBanner(mapApiErrorToForm(e, form.setError));
    }
  });
  return (
    <form
      noValidate
      onSubmit={(e) => void submit(e)}
      className="border-border bg-surface flex flex-col gap-6 rounded-2xl border p-5 sm:p-6"
    >
      {banner && <FormErrorBanner>{banner}</FormErrorBanner>}
      <AreasPicker
        catalog={catalog}
        value={{ baseTownId, otherTownIds }}
        onChange={(v) => {
          form.setValue('baseTownId', v.baseTownId, { shouldDirty: true, shouldValidate: isSubmitted });
          form.setValue('otherTownIds', v.otherTownIds, { shouldDirty: true, shouldValidate: isSubmitted });
        }}
        errors={{ baseTownId: errors.baseTownId?.message, otherTownIds: errors.otherTownIds?.message }}
      />
      <SubmitButton
        pending={save.isPending}
        pendingLabel="Saving…"
        className="w-full sm:w-auto sm:self-start"
      >
        Save changes
      </SubmitButton>
    </form>
  );
}
