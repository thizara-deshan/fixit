import { useCallback, useState } from 'react';
import { Plus } from 'lucide-react';
import { SERVICES_MAX, SERVICES_MAX_MESSAGE, type Service } from '@fixit/contracts';
import { DiscardChangesGuard } from '@/components/discard-changes-guard';
import { LoadingRegion } from '@/components/loading-region';
import { SectionError } from '@/components/section-error';
import { SkeletonSectionCard, SkeletonStatTile } from '@/components/skeletons';
import { Button } from '@/components/ui/button';
import { DeleteServiceDialog } from '../components/delete-service-dialog';
import { ServiceDialog } from '../components/service-dialog';
import { ServicesList } from '../components/services-list';
import { StartingPriceTile } from '../components/starting-price-tile';
import { useOwnProvider } from '../hooks';

type Editing = { service: Service | null } | null;

export function ServicesPage() {
  const own = useOwnProvider();
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<Service | null>(null);
  const [dirty, setDirty] = useState(false);
  const onDirtyChange = useCallback((d: boolean) => {
    setDirty(d);
  }, []);
  const p = own.data ?? null;
  const full = (p?.services.length ?? 0) >= SERVICES_MAX;
  const closeDialog = () => {
    setEditing(null);
    setDirty(false);
  };
  return (
    <div className="flex max-w-[1040px] flex-col gap-5 sm:gap-7">
      <DiscardChangesGuard when={editing !== null && dirty} />
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-title-lg text-text">My Services</h1>
          <p className="text-body-sm text-text-muted">
            {'What you offer and what it costs. Your lowest price shows as "Starting at".'}
          </p>
        </div>
        <div className="flex flex-col gap-1.5 sm:items-end">
          <Button
            size="lg"
            className="w-full sm:w-auto"
            disabled={!p || full}
            onClick={() => {
              setEditing({ service: null });
            }}
          >
            <Plus aria-hidden="true" />
            Add service
          </Button>
          {full && <p className="text-meta text-text-muted">{SERVICES_MAX_MESSAGE}</p>}
        </div>
      </header>
      {own.isPending && (
        <LoadingRegion
          loading
          skeleton={
            <>
              <SkeletonStatTile />
              <SkeletonSectionCard lines={5} />
            </>
          }
        />
      )}
      {(own.isError || own.data === null) && (
        <SectionError
          onRetry={() => {
            void own.refetch();
          }}
        />
      )}
      {p && (
        <>
          <StartingPriceTile price={p.startingPrice} />
          <section className="sm:border-border sm:bg-surface sm:overflow-hidden sm:rounded-2xl sm:border">
            <ServicesList
              services={p.services}
              onEdit={(s) => {
                setEditing({ service: s });
              }}
              onDelete={setDeleting}
            />
          </section>
        </>
      )}
      {editing && (
        <ServiceDialog service={editing.service} onClose={closeDialog} onDirtyChange={onDirtyChange} />
      )}
      {deleting && (
        <DeleteServiceDialog
          service={deleting}
          onClose={() => {
            setDeleting(null);
          }}
        />
      )}
    </div>
  );
}
