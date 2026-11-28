import type { ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { FormErrorBanner } from '@/components/form-error-banner';
import { FormField } from '@/components/form-field';
import { ResponsiveDialog } from '@/components/responsive-dialog';
import { SubmitButton } from '@/components/submit-button';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FORM_COPY } from '@/lib/error-copy';
import { mapApiErrorToForm } from '@/lib/form-errors';

type Values = { reason: string };

interface ReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  /** RejectBody | HideReviewBody | makeAccountReasonBody(name) */
  schema: z.ZodType<Values, Values>;
  label: string;
  help?: string;
  submitLabel: string;
  pendingLabel: string;
  tone: 'danger' | 'primary';
  /** mutation.isPending */
  pending: boolean;
  /** Called with the parsed reason. `onApiError` maps a 400 to the field and returns true if it did (no banner needed). */
  onSubmit: (reason: string, onApiError: (e: unknown) => boolean) => void;
  /** Show FormErrorBanner FORM_COPY.saveFailed. */
  failed: boolean;
  formId: string;
  /** Rendered above the field (S34 effects list). */
  lead?: ReactNode;
}

/** One dialog for reject (S32), suspend / reactivate (S34) and hide (S37): a required 10–500 character reason. */
export function ReasonDialog({
  open,
  onOpenChange,
  title,
  description,
  schema,
  label,
  help,
  submitLabel,
  pendingLabel,
  tone,
  pending,
  onSubmit,
  failed,
  formId,
  lead,
}: ReasonDialogProps) {
  const form = useForm<Values, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: { reason: '' },
  });
  const length = form.watch('reason').length;

  const close = (next: boolean) => {
    if (!next) form.reset();
    onOpenChange(next);
  };

  const submit = form.handleSubmit((body) => {
    onSubmit(body.reason, (e) => mapApiErrorToForm(e, form.setError) === null);
  });

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={close}
      title={title}
      {...(description === undefined ? {} : { description })}
      dismissible={!pending}
      footer={
        <>
          <Button
            variant="secondary"
            className="w-full sm:w-auto"
            disabled={pending}
            onClick={() => {
              close(false);
            }}
          >
            Cancel
          </Button>
          <SubmitButton
            form={formId}
            variant={tone}
            className="w-full sm:w-auto"
            pending={pending}
            pendingLabel={pendingLabel}
          >
            {submitLabel}
          </SubmitButton>
        </>
      }
    >
      <form
        id={formId}
        noValidate
        onSubmit={(e) => {
          void submit(e);
        }}
        className="flex flex-col gap-4"
      >
        {failed && <FormErrorBanner>{FORM_COPY.saveFailed}</FormErrorBanner>}
        {lead}
        <FormField
          label={label}
          required
          {...(help === undefined ? {} : { help })}
          error={form.formState.errors.reason?.message}
        >
          {(p) => (
            <Textarea
              {...p}
              rows={4}
              maxLength={600}
              autoFocus
              className="text-body"
              {...form.register('reason')}
            />
          )}
        </FormField>
        <p aria-live="polite" className="text-meta text-text-subtle -mt-2 text-right">
          {length} / 500
        </p>
      </form>
    </ResponsiveDialog>
  );
}
