import type { ReactNode } from 'react';
import { CalendarDays, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router';
import type { CustomerRequestView } from '@fixit/contracts';
import { CategoryIcon } from '@/components/category-icon';
import { DataList, type DataListColumn } from '@/components/data-list';
import { StatusPill } from '@/components/status-pill';
import { Button } from '@/components/ui/button';
import { SLOT_LABEL, formatDateShort } from '@/lib/format';
import { MQ, useMediaQuery } from '@/lib/use-media-query';

interface Props {
  rows: readonly CustomerRequestView[];
  loading: boolean;
  empty: ReactNode;
}

type Row = CustomerRequestView;

const reviewButton = (r: Row): ReactNode =>
  r.review?.eligible ? (
    <Button asChild variant="outline" size="sm">
      <Link to={`/requests/${r.ref}/review`}>Leave a review</Link>
    </Button>
  ) : null;

const contactLine = (r: Row): ReactNode =>
  r.status === 'accepted' ? (
    <span className="text-meta text-text-muted flex items-center gap-1">
      <Phone aria-hidden="true" className="size-3.5" />
      Contact details shown
    </span>
  ) : null;

const tableColumns: DataListColumn<Row>[] = [
  {
    id: 'provider',
    header: 'Provider',
    card: 'title',
    className: 'w-[26%]',
    cell: (r) => (
      <span className="flex min-w-0 items-center gap-3">
        {r.provider.photoUrl ? (
          <img src={r.provider.photoUrl} alt="" className="size-9 shrink-0 rounded-[10px] object-cover" />
        ) : (
          <span
            aria-hidden="true"
            className="bg-primary-soft text-primary grid size-9 shrink-0 place-items-center rounded-[10px]"
          >
            <CategoryIcon icon={r.provider.categoryIcon} className="size-5" />
          </span>
        )}
        <span className="flex min-w-0 flex-col">
          <span className="text-body-sm text-text truncate font-bold">{r.provider.businessName}</span>
          <span className="text-mono text-text-subtle font-mono">{r.ref}</span>
        </span>
      </span>
    ),
  },
  {
    id: 'service',
    header: 'Service',
    card: 'meta',
    className: 'w-[24%]',
    cell: (r) => <span className="text-label text-text font-semibold">{r.service.name}</span>,
  },
  {
    id: 'date',
    header: 'Date',
    card: 'meta',
    className: 'w-[18%]',
    cell: (r) => (
      <span className="flex flex-col">
        <span className="text-label text-text">{formatDateShort(r.preferredDate)}</span>
        <span className="text-meta text-text-subtle">{SLOT_LABEL[r.slot]}</span>
      </span>
    ),
  },
  {
    id: 'town',
    header: 'Town',
    card: 'meta',
    className: 'w-[16%]',
    cell: (r) => <span className="text-label text-text-muted">{r.town.name}</span>,
  },
  {
    id: 'status',
    header: 'Status',
    card: 'actions',
    className: 'w-[240px]',
    cell: (r) => (
      <span className="flex flex-col items-start gap-1.5">
        <StatusPill kind="request" status={r.status} />
        {contactLine(r)}
        {reviewButton(r)}
      </span>
    ),
  },
];

const cardColumns: DataListColumn<Row>[] = [
  {
    id: 'provider',
    header: 'Provider',
    card: 'title',
    cell: (r) => (
      <span className="text-body-sm block min-w-0 truncate font-bold">{r.provider.businessName}</span>
    ),
  },
  {
    id: 'status',
    header: 'Status',
    card: 'status',
    cell: (r) => <StatusPill kind="request" status={r.status} compact />,
  },
  {
    id: 'ref',
    header: 'Reference',
    card: 'meta',
    cell: (r) => <span className="text-mono text-text-subtle font-mono">{r.ref}</span>,
  },
  {
    id: 'service',
    header: 'Service',
    card: 'meta',
    cell: (r) => <span className="text-label text-text font-semibold">{r.service.name}</span>,
  },
  {
    id: 'when',
    header: 'When',
    card: 'meta',
    cell: (r) => (
      <span className="flex flex-wrap items-center gap-x-1.5">
        <CalendarDays aria-hidden="true" className="size-3.5" />
        {formatDateShort(r.preferredDate)} · {SLOT_LABEL[r.slot]}
        <MapPin aria-hidden="true" className="size-3.5" />
        {r.town.name}
      </span>
    ),
  },
  { id: 'contact', header: 'Contact', card: 'meta', cell: contactLine },
  { id: 'action', header: 'Action', card: 'actions', cell: reviewButton },
];

/** S14 list: SPEC table at ≥ 641, phone cards below (D-7). */
export function MyRequestsList({ rows, loading, empty }: Props) {
  const isTable = useMediaQuery(MQ.sm);
  return (
    <DataList
      rows={rows}
      columns={isTable ? tableColumns : cardColumns}
      getRowKey={(r) => r.ref}
      caption="My requests"
      rowHref={(r) => `/requests/${r.ref}`}
      rowLabel={(r) => `${r.ref}, ${r.provider.businessName}, ${r.service.name}`}
      loading={loading}
      empty={empty}
    />
  );
}
