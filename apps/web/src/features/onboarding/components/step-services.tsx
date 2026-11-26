import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { Step3Form, type ServicesFormValues } from '@fixit/contracts';
import { FormErrorBanner } from '@/components/form-error-banner';
import { EMPTY_SERVICE, ServicesRepeater } from '@/components/services-editor';
import { SubmitButton } from '@/components/submit-button';
import { Button } from '@/components/ui/button';
import { mapApiErrorToForm } from '@/lib/form-errors';
import { useSaveStep } from '../hooks';
import type { StepProps } from './step-props';
import { WizardFooter } from './wizard-frame';

export function StepServices({ own, onBack, onSaved, onDirtyChange }: StepProps) {
  const form = useForm<ServicesFormValues, unknown, z.output<typeof Step3Form>>({
    resolver: zodResolver(Step3Form),
    defaultValues: {
      services:
        own && own.services.length > 0
          ? own.services.map((s) => ({ name: s.name, price: String(s.price), unit: s.unit }))
          : [{ ...EMPTY_SERVICE }],
    },
  });
  const save = useSaveStep();
  const [banner, setBanner] = useState<string | null>(null);
  const { isDirty } = form.formState;
  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);
  const submit = form.handleSubmit(async (v) => {
    setBanner(null);
    try {
      await save.mutateAsync({ step: 3, body: { services: v.services } });
      onSaved();
    } catch (e) {
      setBanner(mapApiErrorToForm(e, form.setError));
    }
  });
  return (
    <FormProvider {...form}>
      <form noValidate onSubmit={(e) => void submit(e)} className="flex flex-col gap-5">
        {banner && <FormErrorBanner>{banner}</FormErrorBanner>}
        <ServicesRepeater />
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
    </FormProvider>
  );
}
