import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { setViewportWidth } from '@/test/media';
import { DataList, type DataListColumn } from './data-list';

interface Row {
  ref: string;
  name: string;
  status: string;
}
const rows: Row[] = [
  { ref: 'FX-2061', name: 'Olivia Martinez', status: 'Pending' },
  { ref: 'FX-2059', name: 'James Carter', status: 'Accepted' },
];
const columns: DataListColumn<Row>[] = [
  { id: 'name', header: 'Customer', card: 'title', cell: (r) => r.name },
  { id: 'ref', header: 'Reference', card: 'meta', cell: (r) => r.ref },
  { id: 'status', header: 'Status', card: 'status', cell: (r) => r.status },
];

function renderList() {
  return render(
    <MemoryRouter>
      <DataList
        rows={rows}
        columns={columns}
        getRowKey={(r) => r.ref}
        caption="Requests"
        rowHref={(r) => `/dashboard/requests/${r.ref}`}
      />
    </MemoryRouter>,
  );
}

describe('DataList (SPEC §6.9, AC7)', () => {
  it('renders a table at ≥641px and no card list', () => {
    setViewportWidth(641);
    renderList();
    expect(screen.getByRole('table')).toBeTruthy();
    expect(screen.queryByRole('list')).toBeNull();
    expect(screen.getAllByRole('columnheader').map((h) => h.textContent)).toEqual([
      'Customer',
      'Reference',
      'Status',
    ]);
  });
  it('renders cards at 390px and no table; each card links to the row', () => {
    setViewportWidth(390);
    renderList();
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByRole('link', { name: 'Olivia Martinez' }).getAttribute('href')).toBe(
      '/dashboard/requests/FX-2061',
    );
  });
  it('switches when the viewport crosses 641px', () => {
    renderList();
    expect(screen.getByRole('table')).toBeTruthy();
    setViewportWidth(640);
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.getByRole('list')).toBeTruthy();
  });
  it('shows the empty state when there are no rows', () => {
    render(
      <MemoryRouter>
        <DataList
          rows={[]}
          columns={columns}
          getRowKey={(r) => r.ref}
          caption="Requests"
          empty={<p>No requests with this status.</p>}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText('No requests with this status.')).toBeTruthy();
  });
  it('phone card: an actions cell that renders nothing adds no action row', () => {
    setViewportWidth(390);
    render(
      <MemoryRouter>
        <DataList
          rows={rows}
          columns={[
            ...columns,
            {
              id: 'action',
              header: 'Action',
              card: 'actions',
              cell: (r) => (r.ref === 'FX-2061' ? <button type="button">Act</button> : null),
            },
          ]}
          getRowKey={(r) => r.ref}
          caption="Requests"
        />
      </MemoryRouter>,
    );
    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(document.querySelectorAll('li > div.mt-1')).toHaveLength(1);
  });
});
