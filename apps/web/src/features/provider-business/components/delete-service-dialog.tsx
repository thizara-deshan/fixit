import { useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { SERVICES_LAST_MESSAGE, type Service } from '@fixit/contracts';
import { FormErrorBanner } from '@/components/form-error-banner';
import { ResponsiveDialog } from '@/components/responsive-dialog';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/http';
import { notify } from '@/lib/toast';
import { useDeleteService } from '../hooks';

export function DeleteServiceDialog({ service, onClose }: { service: Service; onClose: () => void }) {
  const del = useDeleteService();
  const [banner, setBanner] = useState<string | null>(null);
  const run = async () => {
    setBanner(null);
    try {
      await del.mutateAsync(service.id);
      notify('Service deleted.');
      onClose();
    } catch (e) {
      setBanner(
        e instanceof ApiError && e.rule === 'services_min'
          ? SERVICES_LAST_MESSAGE
          : "Couldn't remove. Try again.",
      );
    }
  };
  return (
    <ResponsiveDialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={`Delete ${service.name}?`}
      description="Customers won't see it any more. Requests already sent aren't affected."
      dismissible={!del.isPending}
      footer={
        <>
          <Button variant="secondary" className="w-full sm:w-auto" disabled={del.isPending} onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            className="w-full sm:w-auto"
            disabled={del.isPending}
            aria-busy={del.isPending || undefined}
            onClick={() => void run()}
          >
            {del.isPending && (
              <LoaderCircle aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" />
            )}
            {del.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </>
      }
    >
      {banner && <FormErrorBanner>{banner}</FormErrorBanner>}
    </ResponsiveDialog>
  );
}
