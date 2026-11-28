import { useCallback, useState } from 'react';
import { DiscardChangesGuard } from '@/components/discard-changes-guard';
import { LoadingRegion } from '@/components/loading-region';
import { SectionError } from '@/components/section-error';
import { SkeletonSectionCard } from '@/components/skeletons';
import { useCatalog } from '@/features/site/hooks';
import { AreasForm } from '../components/areas-form';
import { useOwnProvider } from '../hooks';

export function ServiceAreasPage() {
  const own = useOwnProvider();
  const catalog = useCatalog();
  const [dirty, setDirty] = useState(false);
  const onDirtyChange = useCallback((d: boolean) => {
    setDirty(d);
  }, []);
  return (
    <div className="flex max-w-[720px] flex-col gap-5 sm:gap-7">
      <DiscardChangesGuard when={dirty} />
      <header className="flex flex-col gap-1">
        <h1 className="text-title-lg text-text">Service areas</h1>
        <p className="text-body-sm text-text-muted">Customers in these towns can find and request you.</p>
      </header>
      {(own.isPending || catalog.isPending) && (
        <LoadingRegion loading skeleton={<SkeletonSectionCard lines={8} />} />
      )}
      {(own.isError || catalog.isError || own.data === null) && (
        <SectionError
          onRetry={() => {
            void own.refetch();
            void catalog.refetch();
          }}
        />
      )}
      {own.data && catalog.data && (
        <AreasForm own={own.data} catalog={catalog.data} onDirtyChange={onDirtyChange} />
      )}
      <p className="text-meta text-text-muted">
        {"Removing a town doesn't affect requests you've already received."}
      </p>
    </div>
  );
}
