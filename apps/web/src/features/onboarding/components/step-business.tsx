import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { makeStep1Form, type Step1FormInput, type Step1FormOutput } from '@fixit/contracts';
import { FormErrorBanner } from '@/components/form-error-banner';
import { FormField } from '@/components/form-field';
import { PhoneInput } from '@/components/phone-input';
import { SubmitButton } from '@/components/submit-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { mapApiErrorToForm } from '@/lib/form-errors';
import { useSaveStep } from '../hooks';
import type { StepProps } from './step-props';
import { WizardFooter } from './wizard-frame';

export function StepBusiness({ me, own, onBack, onSaved, onDirtyChange }: StepProps) {
  const needsMobile = me.mobile === null;
  const schema = useMemo(() => makeStep1Form(needsMobile), [needsMobile]);
  const form = useForm<Step1FormInput, unknown, Step1FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: {
      businessName: own?.businessName ?? '',
      bio: own?.bio ?? '',
      yearsExperience: own?.yearsExperience === null || own === null ? '' : String(own.yearsExperience),
      mobile: '',
    },
  });
  const save = useSaveStep();
  const [banner, setBanner] = useState<string | null>(null);
  const { errors, isDirty } = form.formState;
  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);
  const bio = useWatch({ control: form.control, name: 'bio' });
  const submit = form.handleSubmit(async (v) => {
    setBanner(null);
    try {
      await save.mutateAsync({
        step: 1,
        body: { businessName: v.businessName, bio: v.bio, yearsExperience: v.yearsExperience },
        ...(v.mobile === undefined ? {} : { mobile: v.mobile }),
      });
      onSaved();
    } catch (e) {
      setBanner(mapApiErrorToForm(e, form.setError, { mobile_missing: 'mobile' }));
    }
  });
  return (
    <form noValidate onSubmit={(e) => void submit(e)} className="flex flex-col gap-5">
      {banner && <FormErrorBanner>{banner}</FormErrorBanner>}
      <FormField label="Business name" required error={errors.businessName?.message}>
        {(p) => <Input {...p} autoComplete="organization" {...form.register('businessName')} />}
      </FormField>
      <FormField
        label="Short bio"
        required
        error={errors.bio?.message}
        labelAside={<span className="text-meta text-text-subtle">{bio.length} / 600</span>}
      >
        {(p) => <Textarea {...p} rows={5} {...form.register('bio')} />}
      </FormField>
      <FormField label="Years of experience" required error={errors.yearsExperience?.message}>
        {(p) => (
          <Input
            {...p}
            type="number"
            min={0}
            max={60}
            step={1}
            inputMode="numeric"
            className="sm:w-40"
            {...form.register('yearsExperience')}
          />
        )}
      </FormField>
      {needsMobile && (
        <FormField label="Mobile number" required error={errors.mobile?.message}>
          {(p) => <PhoneInput {...p} {...form.register('mobile')} />}
        </FormField>
      )}
      <div className="flex flex-col gap-0.5">
        <p className="text-body-sm text-text">Owner: {me.fullName}</p>
        <p className="text-meta text-text-subtle">
          Change your name in{' '}
          <Link to="/account" className="text-primary font-semibold">
            Account settings
          </Link>
          .
        </p>
      </div>
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
