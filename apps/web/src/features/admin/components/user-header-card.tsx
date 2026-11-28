import { Ban, RotateCcw } from 'lucide-react';
import type { AdminUserDetail } from '@fixit/contracts';
import { StatusPill } from '@/components/status-pill';
import { Button } from '@/components/ui/button';
import { formatPhone, formatReviewDate, initialsOf } from '@/lib/format';
import { RolePills } from './role-pills';

/** S34 header: identity, role and status pills, and the one account action. */
export function UserHeaderCard({
  user,
  onSuspend,
  onReactivate,
}: {
  user: AdminUserDetail;
  onSuspend: () => void;
  onReactivate: () => void;
}) {
  return (
    <section className="border-border bg-surface flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
      <div className="flex min-w-0 gap-4">
        <span
          aria-hidden="true"
          className="bg-primary-soft text-primary text-title-sm grid size-14 shrink-0 place-items-center rounded-full font-extrabold"
        >
          {initialsOf(user.fullName)}
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-title-lg text-text break-words">{user.fullName}</h1>
          <p className="text-body-sm text-text-muted break-all">{user.email}</p>
          {user.mobile && <p className="text-body-sm text-text-muted">{formatPhone(user.mobile)}</p>}
          <p className="text-meta text-text-subtle">Joined {formatReviewDate(user.joinedAt)}</p>
          <div className="mt-1 flex flex-wrap gap-2">
            <RolePills roles={user.roles} />
            <StatusPill kind="account" status={user.status} />
          </div>
        </div>
      </div>
      {user.status === 'active' ? (
        <Button variant="danger-outline" size="md" className="w-full sm:w-auto" onClick={onSuspend}>
          <Ban aria-hidden="true" className="size-4" />
          Suspend account
        </Button>
      ) : (
        <Button variant="primary" size="md" className="w-full sm:w-auto" onClick={onReactivate}>
          <RotateCcw aria-hidden="true" className="size-4" />
          Reactivate account
        </Button>
      )}
    </section>
  );
}
