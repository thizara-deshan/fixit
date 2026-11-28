import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  reverificationApplies,
  reverificationFor,
  reverifyWarning,
  UpdateBusinessForm,
  type CatalogResponse,
  type OwnProvider,
  type UpdateBusinessBody,
  type UpdateBusinessFormInput,
} from '@fixit/contracts';
import { selectClass } from '@/components/areas-picker';
import { FormErrorBanner } from '@/components/form-error-banner';
import { FormField } from '@/components/form-field';
import { NoticeBanner } from '@/components/notice-banner';
import { SubmitButton } from '@/components/submit-button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { mapApiErrorToForm } from '@/lib/form-errors';
import { notify } from '@/lib/toast';
import { useUpdateBusiness } from '../hooks';
import { ReverifyDialog } from './reverify-dialog';

const valuesOf = (p: OwnProvider): UpdateBusinessFormInput => ({
  businessName: p.businessName ?? '',
  bio: p.bio ?? '',
  yearsExperience: p.yearsExperience === null ? '' : String(p.yearsExperience),
  categoryId: p.category?.id ?? '',
});

export function BusinessDetailsForm({
  own,
  catalog,
  onDirtyChange,
}: {
  own: OwnProvider;
  catalog: Pick<CatalogResponse, 'categories'>;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const form = useForm<UpdateBusinessFormInput, unknown, UpdateBusinessBody>({
    resolver: zodResolver(UpdateBusinessForm),
    defaultValues: valuesOf(own),
  });
  const save = useUpdateBusiness();
  const [banner, setBanner] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<UpdateBusinessBody | null>(null);
  const { errors, isDirty } = form.formState;
  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);
  const businessName = useWatch({ control: form.control, name: 'businessName' });
  const categoryId = useWatch({ control: form.control, name: 'categoryId' });
  const bio = useWatch({ control: form.control, name: 'bio' });
  const applies = reverificationApplies(own.verificationStatus);
  const nameChanged = applies && businessName.trim() !== (own.businessName ?? '');
  const categoryChanged = applies && categoryId !== (own.category?.id ?? '');
  const before = { businessName: own.businessName, categoryId: own.category?.id ?? null };

  const run = async (body: UpdateBusinessBody) => {
    setBanner(null);
    try {
      const result = await save.mutateAsync(body);
      setConfirm(null);
      form.reset(valuesOf(result.provider));
      notify(result.reverification ? 'Saved. Your listing is back in review.' : 'Changes saved.');
    } catch (e) {
      setConfirm(null);
      setBanner(mapApiErrorToForm(e, form.setError));
    }
  };
  const submit = form.handleSubmit((body) => {
    if (reverificationFor({ status: own.verificationStatus, before, after: body }) !== null) setConfirm(body);
    else void run(body);
  });

  return (
    <section
      aria-labelledby="business-details"
      className="border-border bg-surface flex flex-col gap-5 rounded-2xl border p-5 sm:p-6"
    >
      <h2 id="business-details" className="text-title-md text-text">
        Business details
      </h2>
      <form noValidate onSubmit={(e) => void submit(e)} className="flex flex-col gap-5">
        {banner && <FormErrorBanner>{banner}</FormErrorBanner>}
        <div className="flex flex-col gap-2">
          <FormField label="Business name" required error={errors.businessName?.message}>
            {(p) => <Input {...p} autoComplete="organization" {...form.register('businessName')} />}
          </FormField>
          {nameChanged && <NoticeBanner variant="warning">{reverifyWarning('business_name')}</NoticeBanner>}
        </div>
        <div className="flex flex-col gap-2">
          <FormField label="Category" required error={errors.categoryId?.message}>
            {(p) => (
              <select {...p} className={selectClass} {...form.register('categoryId')}>
                <option value="">Choose a category</option>
                {[...catalog.categories]
                  .sort((a, b) => a.order - b.order)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            )}
          </FormField>
          {categoryChanged && <NoticeBanner variant="warning">{reverifyWarning('category')}</NoticeBanner>}
        </div>
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
        <div className="flex flex-col gap-0.5">
          <p className="text-label text-text font-semibold">Owner</p>
          <p className="text-body-sm text-text">{own.ownerName}</p>
          <Link
            to="/account"
            className="text-meta text-primary inline-flex min-h-11 items-center font-semibold sm:min-h-0"
          >
            Change in Account settings
          </Link>
        </div>
        <SubmitButton
          pending={save.isPending && confirm === null}
          pendingLabel="Saving…"
          className="w-full sm:w-auto sm:self-start"
        >
          Save changes
        </SubmitButton>
      </form>
      <ReverifyDialog
        open={confirm !== null}
        pending={save.isPending}
        onCancel={() => {
          setConfirm(null);
        }}
        onConfirm={() => {
          if (confirm) void run(confirm);
        }}
      />
    </section>
  );
}
