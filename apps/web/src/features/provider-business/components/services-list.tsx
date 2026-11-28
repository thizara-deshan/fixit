import { Pencil, Trash2 } from 'lucide-react';
import { SERVICES_LAST_MESSAGE, type Service } from '@fixit/contracts';
import { DataList, type DataListColumn } from '@/components/data-list';
import { UNIT_LABEL } from '@/components/services-editor';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatLkr, formatServicePrice } from '@/lib/format';

const ICON = 'size-11 sm:size-10'; // 44 on phone, 40 on desktop (S23)

function DeleteButton({
  service,
  last,
  onDelete,
}: {
  service: Service;
  last: boolean;
  onDelete: () => void;
}) {
  const label = `Delete ${service.name}`;
  if (!last)
    return (
      <Button variant="ghost" size="icon" className={ICON} aria-label={label} onClick={onDelete}>
        <Trash2 aria-hidden="true" />
      </Button>
    );
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`${ICON} text-text-subtle`}
          aria-label={label}
          aria-disabled="true"
        >
          <Trash2 aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent side="top" className="text-meta w-auto max-w-[240px] px-3 py-2">
        {SERVICES_LAST_MESSAGE}
      </PopoverContent>
    </Popover>
  );
}

export function ServicesList({
  services,
  onEdit,
  onDelete,
}: {
  services: readonly Service[];
  onEdit: (s: Service) => void;
  onDelete: (s: Service) => void;
}) {
  const last = services.length <= 1;
  const columns: DataListColumn<Service>[] = [
    {
      id: 'name',
      header: 'Service',
      card: 'title',
      cell: (s) => <span className="text-body text-text font-bold">{s.name}</span>,
    },
    { id: 'price', header: 'Price', card: 'hidden', cell: (s) => formatLkr(s.price) },
    { id: 'unit', header: 'Unit', card: 'hidden', cell: (s) => UNIT_LABEL[s.unit] },
    {
      id: 'shows',
      header: 'Shows as',
      card: 'meta',
      cell: (s) => (
        <span className="text-meta text-text-muted sm:text-body-sm sm:text-text">
          <span className="sm:sr-only">Shows as </span>
          {formatServicePrice(s.price, s.unit)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      card: 'status',
      className: 'w-[112px]',
      cell: (s) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className={ICON}
            aria-label={`Edit ${s.name}`}
            onClick={() => {
              onEdit(s);
            }}
          >
            <Pencil aria-hidden="true" />
          </Button>
          <DeleteButton
            service={s}
            last={last}
            onDelete={() => {
              onDelete(s);
            }}
          />
        </div>
      ),
    },
  ];
  return <DataList rows={services} columns={columns} getRowKey={(s) => s.id} caption="Your services" />;
}
