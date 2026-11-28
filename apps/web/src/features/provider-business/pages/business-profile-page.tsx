import { useCallback, useState } from 'react';
import { Link } from 'react-router';
import { Eye } from 'lucide-react';
import { DiscardChangesGuard } from '@/components/discard-changes-guard';
import { LoadingRegion } from '@/components/loading-region';
import { PhotoUploader } from '@/components/photo-uploader';
import { SectionError } from '@/components/section-error';
import { SkeletonSectionCard } from '@/components/skeletons';
import { Button } from '@/components/ui/button';
import { useCatalog } from '@/features/site/hooks';
import { BusinessDetailsForm } from '../components/business-details-form';
import { uploadPhoto, useOwnProvider, usePhotoCache, useRemovePhoto } from '../hooks';

export function BusinessProfilePage() {
  const own = useOwnProvider();
  const catalog = useCatalog();
  const setPhoto = usePhotoCache();
  const removePhoto = useRemovePhoto();
  const [dirty, setDirty] = useState(false);
  const onDirtyChange = useCallback((d: boolean) => {
    setDirty(d);
  }, []);
  const p = own.data ?? null;
  return (
    <div className="flex max-w-[720px] flex-col gap-5 sm:gap-7">
      <DiscardChangesGuard when={dirty} />
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-title-lg text-text">Profile</h1>
          <p className="text-body-sm text-text-muted">How your business appears to customers.</p>
        </div>
        {p && (
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link to={`/providers/${p.id}`}>
              <Eye aria-hidden="true" />
              View public profile
            </Link>
          </Button>
        )}
      </header>
      {(own.isPending || catalog.isPending) && (
        <LoadingRegion
          loading
          skeleton={
            <>
              <SkeletonSectionCard lines={3} />
              <SkeletonSectionCard lines={6} />
            </>
          }
        />
      )}
      {(own.isError || catalog.isError || own.data === null) && (
        <SectionError
          onRetry={() => {
            void own.refetch();
            void catalog.refetch();
          }}
        />
      )}
      {p && catalog.data && (
        <>
          <section
            id="photo"
            aria-labelledby="photo-title"
            className="border-border bg-surface flex flex-col gap-4 rounded-2xl border p-5 sm:p-6"
          >
            <h2 id="photo-title" className="text-title-md text-text">
              Profile photo
            </h2>
            <PhotoUploader
              photoUrl={p.photoUrl}
              categoryIcon={p.category?.icon ?? null}
              upload={uploadPhoto}
              onUploaded={setPhoto}
              remove={() => removePhoto.mutateAsync()}
            />
          </section>
          <BusinessDetailsForm own={p} catalog={catalog.data} onDirtyChange={onDirtyChange} />
        </>
      )}
    </div>
  );
}
