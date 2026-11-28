import { useState } from 'react';
import { Link } from 'react-router';
import type { VerificationDetail } from '@fixit/contracts';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { formatPhone, formatReviewDate } from '@/lib/format';

const CARD = 'border-border bg-surface flex flex-col gap-4 rounded-2xl border p-5';

/** S32.E2 */
export function ProviderCard({ v }: { v: VerificationDetail }) {
  const p = v.provider;
  const rows: [string, string][] = [
    ['Account name', p.accountName],
    ['Owner on listing', p.ownerName],
    ['Email', p.email],
    ['Mobile', p.mobile ? formatPhone(p.mobile) : '—'],
    ['Category', p.category.name],
    ['Base town', p.baseTownName],
    ['Joined', formatReviewDate(p.joinedAt)],
  ];
  return (
    <section aria-labelledby="provider-card" className={CARD}>
      <h2 id="provider-card" className="text-title-sm text-text">
        Provider
      </h2>
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-meta text-text-subtle">{label}</dt>
            <dd className="text-body-sm text-text break-words">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="secondary" size="sm">
          <Link to={`/admin/users/${p.userId}`}>View user</Link>
        </Button>
        <Button asChild variant="secondary" size="sm">
          <a href={`/providers/${p.id}`} target="_blank" rel="noopener noreferrer">
            View listing
          </a>
        </Button>
      </div>
    </section>
  );
}

/** S32.E3 (BR-19): local ticks only, not saved. */
export function ApprovalChecklist({ accountName, ownerName }: { accountName: string; ownerName: string }) {
  const items = [
    `Name on the NIC matches ${accountName} or ${ownerName}`,
    'Documents are clear and readable',
    'Documents look unaltered',
  ];
  const [ticked, setTicked] = useState<Record<number, boolean>>({});
  return (
    <section aria-labelledby="checklist" className={CARD}>
      <h3 id="checklist" className="text-title-sm text-text">
        Before you approve
      </h3>
      <ul className="flex flex-col">
        {items.map((label, i) => (
          <li key={label} className="flex min-h-11 items-center gap-3">
            <Checkbox
              id={`check-${String(i)}`}
              checked={ticked[i] === true}
              onCheckedChange={(c) => {
                setTicked((t) => ({ ...t, [i]: c === true }));
              }}
            />
            <label htmlFor={`check-${String(i)}`} className="text-body-sm text-text">
              {label}
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}
