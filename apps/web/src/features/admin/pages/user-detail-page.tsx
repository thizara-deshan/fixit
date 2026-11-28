import { useState } from 'react';
import { useParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { NotFoundPage } from '@/app/errors/not-found-page';
import { BackLink } from '@/components/back-link';
import { ConflictDialog } from '@/components/conflict-dialog';
import { LoadingRegion } from '@/components/loading-region';
import { SectionError } from '@/components/section-error';
import { SkeletonSectionCard } from '@/components/skeletons';
import { ApiError } from '@/lib/http';
import { qk } from '@/lib/query-keys';
import { ReactivateDialog } from '../components/reactivate-dialog';
import { SuspendDialog } from '../components/suspend-dialog';
import { UserHeaderCard } from '../components/user-header-card';
import { AccountHistoryCard, ProviderListingCard, RequestsCard } from '../components/user-sections';
import { CONFLICT } from '../copy';
import { useAdminUser } from '../hooks';

/** S34. */
export function UserDetailPage() {
  const { id = '' } = useParams();
  const q = useAdminUser(id);
  const qc = useQueryClient();
  const [dialog, setDialog] = useState<'suspend' | 'reactivate' | null>(null);
  const [conflict, setConflict] = useState(false);

  if (q.isError) {
    if (q.error instanceof ApiError && q.error.status === 404) return <NotFoundPage area="admin" />;
    return (
      <SectionError
        onRetry={() => {
          void q.refetch();
        }}
      />
    );
  }
  const u = q.data;
  const onConflict = () => {
    setConflict(true);
    void qc.invalidateQueries({ queryKey: qk.admin.user(id) });
  };

  return (
    <div className="flex max-w-[960px] flex-col gap-5">
      <BackLink to="/admin/users">Back to users</BackLink>
      <LoadingRegion
        loading={!u}
        className="flex flex-col gap-5"
        skeleton={
          <>
            <SkeletonSectionCard lines={3} />
            <SkeletonSectionCard lines={3} />
            <SkeletonSectionCard lines={3} />
          </>
        }
      >
        {u && (
          <>
            <UserHeaderCard
              user={u}
              onSuspend={() => {
                setDialog('suspend');
              }}
              onReactivate={() => {
                setDialog('reactivate');
              }}
            />
            {u.provider && <ProviderListingCard p={u.provider} />}
            <RequestsCard title="Requests as customer" id="as-customer" summary={u.asCustomer} />
            {u.asProvider && (
              <RequestsCard title="Requests as provider" id="as-provider" summary={u.asProvider} />
            )}
            <AccountHistoryCard items={u.history} />
            <SuspendDialog
              user={u}
              open={dialog === 'suspend'}
              onOpenChange={(o) => {
                if (!o) setDialog(null);
              }}
              onConflict={onConflict}
            />
            <ReactivateDialog
              user={u}
              open={dialog === 'reactivate'}
              onOpenChange={(o) => {
                if (!o) setDialog(null);
              }}
              onConflict={onConflict}
            />
          </>
        )}
      </LoadingRegion>
      <ConflictDialog
        open={conflict}
        onOpenChange={setConflict}
        title={CONFLICT.account.title}
        body={CONFLICT.account.body}
      />
    </div>
  );
}
