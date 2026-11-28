import { useEffect, useState, type SyntheticEvent } from 'react';
import { Search, SearchX } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import type { AdminUserRow } from '@fixit/contracts';
import { DataList, type DataListColumn } from '@/components/data-list';
import { EmptyState } from '@/components/empty-state';
import { Pagination } from '@/components/pagination';
import { SectionError } from '@/components/section-error';
import { SegmentedTabLinks } from '@/components/segmented-tabs';
import { StatusPill } from '@/components/status-pill';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatReviewDate, initialsOf } from '@/lib/format';
import { RolePills } from '../components/role-pills';
import { useAdminUsers } from '../hooks';
import { parseUsersSearch, USERS_TABS, usersHref, usersTabHref, usersTabOf } from '../url-state';

const COLUMNS: DataListColumn<AdminUserRow>[] = [
  {
    id: 'name',
    header: 'Name',
    card: 'title',
    cell: (u) => (
      <span className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="bg-primary-soft text-primary text-meta grid size-9 shrink-0 place-items-center rounded-full font-extrabold"
        >
          {initialsOf(u.fullName)}
        </span>
        <span className="min-w-0">
          <span className="text-body-sm text-text block truncate font-bold">{u.fullName}</span>
          <span className="text-meta text-text-subtle block truncate">{u.email}</span>
        </span>
      </span>
    ),
  },
  { id: 'roles', header: 'Roles', card: 'meta', cell: (u) => <RolePills roles={u.roles} compact /> },
  {
    id: 'verification',
    header: 'Verification',
    card: 'meta',
    cell: (u) =>
      u.verificationStatus ? <StatusPill kind="verification" status={u.verificationStatus} compact /> : '—',
  },
  {
    id: 'joined',
    header: 'Joined',
    card: 'meta',
    cell: (u) => (
      <span>
        <span className="sm:hidden">Joined </span>
        {formatReviewDate(u.joinedAt)}
      </span>
    ),
  },
  {
    id: 'status',
    header: 'Status',
    card: 'status',
    cell: (u) => <StatusPill kind="account" status={u.status} compact />,
  },
  {
    id: 'action',
    header: 'Action',
    card: 'actions',
    cell: (u) => (
      <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
        <Link to={`/admin/users/${u.id}`}>View</Link>
      </Button>
    ),
  },
];

/** S33. */
export function UsersPage() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const q = parseUsersSearch(sp);
  const list = useAdminUsers(q);
  const [text, setText] = useState(q.q);
  useEffect(() => {
    setText(q.q); // Back/Forward
  }, [q.q]);

  const onSearch = (e: SyntheticEvent) => {
    e.preventDefault();
    void navigate(usersHref({ q: text, role: q.role, status: q.status }));
  };

  const empty =
    q.q !== '' ? (
      <div className="p-4 sm:p-6">
        <EmptyState
          icon={SearchX}
          title={`No users match "${q.q}"`}
          body="Check the spelling or try an email address."
          action={{ label: 'Clear search', to: usersHref({ role: q.role, status: q.status }) }}
        />
      </div>
    ) : (
      <p className="text-body-sm text-text-subtle px-4 py-10 text-center">No users with this status.</p>
    );

  return (
    <>
      <header className="flex flex-col gap-1.5">
        <h1 className="text-title-xl text-text">Users</h1>
      </header>
      {list.isError ? (
        <SectionError
          onRetry={() => {
            void list.refetch();
          }}
        />
      ) : (
        <section aria-label="Users" className="border-border bg-surface overflow-hidden rounded-2xl border">
          <div className="border-border flex flex-col gap-3 border-b p-4 sm:px-6 sm:py-5 lg:flex-row lg:items-center lg:justify-between">
            <SegmentedTabLinks
              label="Filter by account type"
              items={USERS_TABS.map(({ tab, label }) => ({
                value: tab,
                label,
                to: usersTabHref(tab, q.q),
                active: usersTabOf(q) === tab,
              }))}
              className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0"
            />
            <form role="search" onSubmit={onSearch} className="relative w-full lg:w-[320px]">
              <Search
                aria-hidden="true"
                className="text-icon-subtle pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2"
              />
              <Input
                type="search"
                aria-label="Search users"
                placeholder="Search name, email, mobile or business"
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                }}
                className="text-body h-11 pl-10 sm:h-10"
              />
            </form>
          </div>
          <div className="p-4 sm:p-0">
            <DataList
              caption="Users"
              rows={list.data?.items ?? []}
              columns={COLUMNS}
              getRowKey={(u) => u.id}
              rowHref={(u) => `/admin/users/${u.id}`}
              rowLabel={(u) => u.fullName}
              loading={list.isPending}
              empty={empty}
            />
          </div>
          <Pagination
            page={q.page}
            totalPages={list.data?.totalPages ?? 0}
            hrefFor={(p) => usersHref({ ...q, page: p })}
            className="p-4 sm:px-6"
          />
        </section>
      )}
    </>
  );
}
