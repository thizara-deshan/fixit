import { useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { FormErrorBanner } from '@/components/form-error-banner';
import { PhotoUploader } from '@/components/photo-uploader';
import { Button } from '@/components/ui/button';
import { usePublishListing } from '../hooks';
import { usePhotoCache, useRemovePhoto, uploadPhoto } from '@/features/provider-business/hooks';
import { mapApiErrorToForm } from '@/lib/form-errors';
import type { StepProps } from './step-props';
import { WizardFooter } from './wizard-frame';

export function StepPhoto({ own, onBack, onSaved }: StepProps) {
  const publish = usePublishListing();
  const setPhoto = usePhotoCache();
  const removeMutation = useRemovePhoto();
  const [banner, setBanner] = useState<string | null>(null);
  const run = async () => {
    setBanner(null);
    try {
      await publish.mutateAsync();
      onSaved(); // page → /become-a-provider/done
    } catch (e) {
      setBanner(mapApiErrorToForm(e, () => undefined)); // no fields on this step → banner
    }
  };
  return (
    <div className="flex flex-col gap-5">
      {banner && <FormErrorBanner>{banner}</FormErrorBanner>}
      <PhotoUploader
        photoUrl={own?.photoUrl ?? null}
        categoryIcon={own?.category?.icon ?? null}
        upload={uploadPhoto}
        onUploaded={setPhoto}
        remove={() => removeMutation.mutateAsync()}
      />
      <WizardFooter
        back={
          <Button type="button" variant="secondary" onClick={onBack}>
            Back
          </Button>
        }
        primary={
          <Button
            type="button"
            onClick={() => void run()}
            disabled={publish.isPending}
            aria-busy={publish.isPending || undefined}
          >
            {publish.isPending && (
              <LoaderCircle aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" />
            )}
            {publish.isPending ? 'Publishing…' : 'Publish listing'}
          </Button>
        }
        extra={
          own?.photoUrl ? undefined : (
            <button
              type="button"
              onClick={() => void run()}
              disabled={publish.isPending}
              className="text-label text-primary inline-flex min-h-11 items-center font-semibold sm:min-h-0"
            >
              Skip for now
            </button>
          )
        }
      />
    </div>
  );
}
