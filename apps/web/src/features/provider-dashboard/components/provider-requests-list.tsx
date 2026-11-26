import type { ReactNode } from 'react';
import { CalendarDays, Check, MapPin } from 'lucide-react';
import type { ProviderRequestView } from '@fixit/contracts';
import { DataList, type DataListColumn } from '@/components/data-list';
import { StatusPill } from '@/components/status-pill';
import { Button } from '@/components/ui/button';
import { SLOT_LABEL, formatDateShort, formatReplyBy, initialsOf } from '@/lib/format';
import { useFlashingRows, useFlashOnStatusChange } from '@/lib/row-flash';
import { MQ, useMediaQuery } from '@/lib/use-media-query';
import { customerName } from '../copy';

type Row = ProviderRequestView;
interface Props {
  rows: readonly Row[];
  loading: boolean;
  empty: ReactNode;
  caption: string;
  /** S21 only. */
  showReplyBy?: boolean;
  onAccept: (row: Row) => void;
  onDecline: (row: Row) => void;
}

function Avatar({ name }: { name: string }) {
  return (
    <span
      aria-hidden="true"
      className="bg-primary-soft text-primary text-meta grid size-9 shrink-0 place-items-center rounded-full font-extrabold"
    >
      {initialsOf(name)}
    </span>
  );
}

function Identity({ r }: { r: Row }) {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <Avatar name={customerName(r)} />
      <span className="flex min-w-0 flex-col">
        <span className="text-body-sm text-text truncate font-bold">{customerName(r)}</span>
        <span className="text-mono text-text-subtle font-mono">{r.ref}</span>
      </span>
    </span>
  );
}

const replyBy = (r: Row, show: boolean) =>
  show && r.status === 'pending' ? (
    <span className="text-caption text-warning-text font-normal">{`Reply by ${formatReplyBy(r.expiresAt)}`}</span>
  ) : null;

export function ProviderRequestsList({
  rows,
  loading,
  empty,
  caption,
  showReplyBy = false,
  onAccept,
  onDecline,
}: Props) {
  const isTable = useMediaQuery(MQ.sm);
  const flashing = useFlashingRows();
  useFlashOnStatusChange(rows);

  const acceptBtn = (r: Row, size: 'sm' | 'md') => (
    <Button
      size={size}
      aria-label={`Accept request ${r.ref}`}
      onClick={() => {
        onAccept(r);
      }}
    >
      <Check aria-hidden="true" className="size-4" />
      Accept
    </Button>
  );
  const declineBtn = (r: Row, variant: 'danger-outline' | 'secondary', size: 'sm' | 'md') => (
    <Button
      variant={variant}
      size={size}
      aria-label={`Decline request ${r.ref}`}
      onClick={() => {
        onDecline(r);
      }}
    >
      Decline
    </Button>
  );

  const tableColumns: DataListColumn<Row>[] = [
    {
      id: 'customer',
      header: 'Customer',
      card: 'title',
      className: 'w-[22%]',
      cell: (r) => <Identity r={r} />,
    },
    {
      id: 'service',
      header: 'Service',
      card: 'meta',
      className: 'w-[24%] max-w-0',
      cell: (r) => (
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="text-label text-text font-semibold">{r.service.name}</span>
          <span className="text-meta text-text-subtle truncate">{r.description}</span>
        </span>
      ),
    },
    {
      id: 'date',
      header: 'Date',
      card: 'meta',
      className: 'w-[16%]',
      cell: (r) => (
        <span className="flex flex-col gap-0.5">
          <span className="text-label text-text font-semibold">{formatDateShort(r.preferredDate)}</span>
          <span className="text-meta text-text-subtle">{SLOT_LABEL[r.slot]}</span>
          {replyBy(r, showReplyBy)}
        </span>
      ),
    },
    {
      id: 'area',
      header: 'Area',
      card: 'meta',
      className: 'w-[14%]',
      cell: (r) => <span className="text-label text-text-muted truncate">{r.town.name}</span>,
    },
    {
      id: 'status',
      header: 'Status',
      card: 'actions',
      className: 'w-[288px]',
      cell: (r) => (
        <span className="flex flex-wrap items-center gap-2">
          {r.status === 'pending' && (
            <>
              {acceptBtn(r, 'sm')}
              {declineBtn(r, 'danger-outline', 'sm')}
            </>
          )}
          <StatusPill kind="request" status={r.status} />
        </span>
      ),
    },
  ];

  const cardColumns: DataListColumn<Row>[] = [
    { id: 'customer', header: 'Customer', card: 'title', cell: (r) => <Identity r={r} /> },
    {
      id: 'status',
      header: 'Status',
      card: 'status',
      cell: (r) => <StatusPill kind="request" status={r.status} compact />,
    },
    {
      id: 'service',
      header: 'Service',
      card: 'meta',
      cell: (r) => (
        <span className="flex min-w-0 flex-col">
          <span className="text-label text-text font-semibold">{r.service.name}</span>
          <span className="truncate">{r.description}</span>
        </span>
      ),
    },
    {
      id: 'when',
      header: 'When',
      card: 'meta',
      cell: (r) => (
        <span className="flex flex-col gap-0.5">
          <span className="flex flex-wrap items-center gap-x-1.5">
            <CalendarDays aria-hidden="true" className="size-3.5" />
            {formatDateShort(r.preferredDate)} · {SLOT_LABEL[r.slot]}
            <MapPin aria-hidden="true" className="size-3.5" />
            {r.town.name}
          </span>
          {replyBy(r, showReplyBy)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      card: 'actions',
      cell: (r) =>
        r.status === 'pending' ? (
          <>
            {acceptBtn(r, 'md')}
            {declineBtn(r, 'secondary', 'md')}
          </>
        ) : null,
    },
  ];

  return (
    <DataList
      rows={rows}
      columns={isTable ? tableColumns : cardColumns}
      getRowKey={(r) => r.ref}
      caption={caption}
      rowHref={(r) => `/dashboard/requests/${r.ref}`}
      rowLabel={(r) => `${r.ref}, ${customerName(r)}, ${r.service.name}`}
      rowClassName={(r) => (flashing.has(r.ref) ? 'bg-primary-flash' : undefined)}
      loading={loading}
      empty={empty}
    />
  );
}
