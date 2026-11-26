import { useEffect, useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { OnboardingStep2Body } from '@fixit/contracts';
import { CategoryIcon } from '@/components/category-icon';
import { FormErrorBanner } from '@/components/form-error-banner';
import { SubmitButton } from '@/components/submit-button';
import { Button } from '@/components/ui/button';
import { mapApiErrorToForm } from '@/lib/form-errors';
import { useSaveStep } from '../hooks';
import type { StepProps } from './step-props';
import { WizardFooter } from './wizard-frame';

export function StepCategory({ own, catalog, onBack, onSaved, onDirtyChange }: StepProps) {
  const noteId = useId();
  const form = useForm<OnboardingStep2Body>({
    resolver: zodResolver(OnboardingStep2Body),
    defaultValues: { categoryId: own?.category?.id ?? '' },
  });
  const save = useSaveStep();
  const [banner, setBanner] = useState<string | null>(null);
  const { errors, isDirty } = form.formState;
  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);
  const submit = form.handleSubmit(async (v) => {
    setBanner(null);
    try {
      await save.mutateAsync({ step: 2, body: v });
      onSaved();
    } catch (e) {
      setBanner(mapApiErrorToForm(e, form.setError));
    }
  });
  return (
    <form noValidate onSubmit={(e) => void submit(e)} className="flex flex-col gap-5">
      {banner && <FormErrorBanner>{banner}</FormErrorBanner>}
      <fieldset aria-describedby={noteId} className="flex flex-col gap-3">
        <legend className="sr-only">Category</legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[...catalog.categories]
            .sort((a, b) => a.order - b.order)
            .map((c) => (
              <label
                key={c.id}
                className="border-border bg-surface has-checked:border-primary has-checked:bg-primary-soft has-focus-visible:ring-ring has-focus-visible:ring-2 flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border-2 p-4"
              >
                <input type="radio" value={c.id} className="sr-only" {...form.register('categoryId')} />
                <span className="bg-primary-soft text-primary grid size-11 shrink-0 place-items-center rounded-lg">
                  <CategoryIcon icon={c.icon} className="size-6" />
                </span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-body text-text font-bold">{c.name}</span>
                  <span className="text-meta text-text-muted">{c.blurb}</span>
                </span>
              </label>
            ))}
        </div>
        {errors.categoryId?.message && (
          <p role="alert" className="text-meta text-danger-text">
            {errors.categoryId.message}
          </p>
        )}
        <p id={noteId} className="text-meta text-text-muted">
          You can only choose one category. Changing it later means we check your documents again.
        </p>
      </fieldset>
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
