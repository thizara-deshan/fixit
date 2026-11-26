import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AreasBody, type AreasFormInput } from '@fixit/contracts';
import { AreasPicker } from '@/components/areas-picker';
import { FormErrorBanner } from '@/components/form-error-banner';
import { SubmitButton } from '@/components/submit-button';
import { Button } from '@/components/ui/button';
import { mapApiErrorToForm } from '@/lib/form-errors';
import { useSaveStep } from '../hooks';
import type { StepProps } from './step-props';
import { WizardFooter } from './wizard-frame';

export function StepAreas({ own, catalog, onBack, onSaved, onDirtyChange }: StepProps) {
  const form = useForm<AreasFormInput, unknown, AreasBody>({
    resolver: zodResolver(AreasBody),
    defaultValues: {
      baseTownId: own?.baseTown?.id ?? '',
      otherTownIds: own?.otherTowns.map((t) => t.id) ?? [],
    },
  });
  const save = useSaveStep();
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
      await save.mutateAsync({ step: 4, body: v });
      onSaved();
    } catch (e) {
      setBanner(mapApiErrorToForm(e, form.setError));
    }
  });
  return (
    <form noValidate onSubmit={(e) => void submit(e)} className="flex flex-col gap-5">
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
      <WizardFooter
        back={
          <Button type="button" variant="secondary" onClick={onBack}>
            Back
          </Button>
        }
        primary={
          <SubmitButton pending={save.isPending} pendingLabel="Saving…">
            Continue
          </SubmitButton>
        }
      />
    </form>
  );
}
