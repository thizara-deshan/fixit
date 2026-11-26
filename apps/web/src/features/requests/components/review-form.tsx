import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { CreateReviewBody, type CustomerRequestView } from '@fixit/contracts';
import { CategoryIcon } from '@/components/category-icon';
import { FormErrorBanner } from '@/components/form-error-banner';
import { FormField } from '@/components/form-field';
import { SubmitButton } from '@/components/submit-button';
import { Textarea } from '@/components/ui/textarea';
import { FORM_COPY } from '@/lib/error-copy';
import { formatCount, formatDateLong } from '@/lib/format';
import { StarRatingInput } from './star-rating-input';

type Values = z.input<typeof CreateReviewBody>;

interface Props {
  view: CustomerRequestView;
  displayName: string;
  pending: boolean;
  serverError: boolean;
  onSubmit: (values: CreateReviewBody) => void;
  onDirtyChange: (dirty: boolean) => void;
}

/** S16 card. */
export function ReviewForm({ view, displayName, pending, serverError, onSubmit, onDirtyChange }: Props) {
  const form = useForm<Values, unknown, CreateReviewBody>({
    resolver: zodResolver(CreateReviewBody),
    defaultValues: { text: '' },
    shouldFocusError: true,
  });
  const { errors, isDirty } = form.formState;
  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);
  const textLength = form.watch('text').length;
  const p = view.provider;

  return (
    <form
      noValidate
      onSubmit={(e) => {
        void form.handleSubmit(onSubmit)(e);
      }}
      className="border-border bg-surface mx-auto flex w-full max-w-[640px] flex-col gap-6 rounded-2xl border p-5 sm:p-7"
    >
      <div className="flex min-w-0 items-center gap-3">
        {p.photoUrl ? (
          <img src={p.photoUrl} alt="" className="size-12 shrink-0 rounded-xl object-cover" />
        ) : (
          <span
            aria-hidden="true"
            className="bg-primary-soft text-primary grid size-12 shrink-0 place-items-center rounded-xl"
          >
            <CategoryIcon icon={p.categoryIcon} className="size-6" />
          </span>
        )}
        <div className="flex min-w-0 flex-col gap-0.5">
          <h1 className="text-title-md text-text">Review {p.businessName}</h1>
          <p className="text-meta text-text-subtle">
            <span className="font-mono">{view.ref}</span> · {view.service.name} · completed{' '}
            {formatDateLong(view.completedAt ?? view.updatedAt)}
          </p>
        </div>
      </div>
      {serverError && <FormErrorBanner>{FORM_COPY.saveFailed}</FormErrorBanner>}
      <FormField label="Rating" required error={errors.rating?.message}>
        {(c) => (
          <Controller
            control={form.control}
            name="rating"
            render={({ field }) => (
              <StarRatingInput
                id={c.id}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                invalid={c['aria-invalid'] === true}
                describedBy={c['aria-describedby']}
              />
            )}
          />
        )}
      </FormField>
      <FormField
        label="Review"
        required
        error={errors.text?.message}
        labelAside={<span className="text-meta text-text-subtle">{formatCount(textLength)} / 1,000</span>}
      >
        {(c) => (
          <Textarea
            {...c}
            rows={6}
            placeholder="What went well? What could have been better?"
            className="text-body"
            {...form.register('text')}
          />
        )}
      </FormField>
      <p className="text-meta text-text-muted">
        Reviews can&apos;t be edited after posting. Your name shows as {displayName}.
      </p>
      <div className="border-border bg-surface fixed inset-x-0 bottom-0 z-30 border-t px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3 sm:static sm:z-auto sm:border-0 sm:bg-transparent sm:p-0">
        <SubmitButton size="lg" className="w-full sm:w-auto" pending={pending} pendingLabel="Posting…">
          Post review
        </SubmitButton>
      </div>
    </form>
  );
}
