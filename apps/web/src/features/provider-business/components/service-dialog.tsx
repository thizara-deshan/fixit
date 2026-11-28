import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { Step3Form, type Service, type ServicesFormValues } from '@fixit/contracts';
import { FormErrorBanner } from '@/components/form-error-banner';
import { ResponsiveDialog } from '@/components/responsive-dialog';
import { ServiceRowFields } from '@/components/services-editor';
import { SubmitButton } from '@/components/submit-button';
import { Button } from '@/components/ui/button';
import { mapApiErrorToForm } from '@/lib/form-errors';
import { notify } from '@/lib/toast';
import { useCreateService, useUpdateService } from '../hooks';

/** S23.E3. Mounted only while open (D-8). `service` null = add. */
export function ServiceDialog({
  service,
  onClose,
  onDirtyChange,
}: {
  service: Service | null;
  onClose: () => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const create = useCreateService();
  const update = useUpdateService();
  const pending = create.isPending || update.isPending;
  const [banner, setBanner] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const form = useForm<ServicesFormValues, unknown, z.output<typeof Step3Form>>({
    resolver: zodResolver(Step3Form),
    defaultValues: service
      ? { services: [{ name: service.name, price: String(service.price), unit: service.unit }] }
      : { services: [{ name: '', price: '' }] }, // no unit (D-6)
  });
  const { isDirty } = form.formState;
  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const requestClose = () => {
    if (pending) return;
    if (isDirty) setConfirmDiscard(true);
    else onClose();
  };

  const submit = form.handleSubmit(async (v) => {
    const body = v.services[0];
    if (!body) return; // the schema requires the one row this form renders
    setBanner(null);
    try {
      if (service) {
        await update.mutateAsync({ id: service.id, body });
        notify('Service saved.');
      } else {
        await create.mutateAsync(body);
        notify('Service added.');
      }
      onClose();
    } catch (e) {
      setBanner(mapApiErrorToForm(e, form.setError, { service_name_taken: 'services.0.name' }));
    }
  });

  return (
    <>
      <ResponsiveDialog
        open
        onOpenChange={(open) => {
          if (!open) requestClose();
        }}
        title={service ? 'Edit service' : 'Add service'}
        dismissible={!pending}
        footer={
          <>
            <Button
              variant="secondary"
              className="w-full sm:w-auto"
              disabled={pending}
              onClick={requestClose}
            >
              Cancel
            </Button>
            <SubmitButton
              form="service-form"
              className="w-full sm:w-auto"
              pending={pending}
              pendingLabel="Saving…"
            >
              Save
            </SubmitButton>
          </>
        }
      >
        <FormProvider {...form}>
          <form id="service-form" noValidate onSubmit={(e) => void submit(e)} className="flex flex-col gap-4">
            {banner && <FormErrorBanner>{banner}</FormErrorBanner>}
            <ServiceRowFields index={0} />
          </form>
        </FormProvider>
      </ResponsiveDialog>
      <ResponsiveDialog
        open={confirmDiscard}
        onOpenChange={setConfirmDiscard}
        title="Discard changes?"
        description="What you've entered won't be saved."
        footer={
          <>
            <Button
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={() => {
                setConfirmDiscard(false);
              }}
            >
              Keep editing
            </Button>
            <Button variant="danger" className="w-full sm:w-auto" onClick={onClose}>
              Discard
            </Button>
          </>
        }
      />
    </>
  );
}
