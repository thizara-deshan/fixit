import type { ReactNode } from 'react';
import { Link } from 'react-router';
import type { AdminRequestSummary, AdminUserDetail, AuditEntry } from '@fixit/contracts';
import { Stars } from '@/components/stars';
import { StatusPill } from '@/components/status-pill';
import { formatDateShort, formatDateTime, formatRating, SLOT_LABEL } from '@/lib/format';

const CARD = 'border-border bg-surface flex flex-col gap-3 rounded-2xl border p-5 sm:p-6';

function Card({
  title,
  id,
  sub,
  children,
}: {
  title: string;
  id: string;
  sub?: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className={CARD}>
      <div className="flex flex-col gap-0.5">
        <h2 id={id} className="text-title-sm text-text">
          {title}
        </h2>
        {sub && <p className="text-meta text-text-subtle">{sub}</p>}
      </div>
      {children}
    </section>
  );
}

/** S34 provider listing (published listing only). */
export function ProviderListingCard({ p }: { p: NonNullable<AdminUserDetail['provider']> }) {
  return (
    <Card title="Provider listing" id="listing">
      <p className="text-body-sm text-text font-bold">{p.businessName}</p>
      <p className="text-body-sm text-text-muted">{p.categoryName}</p>
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill kind="verification" status={p.verificationStatus} />
        {p.latestSubmissionId && (
          <Link
            to={`/admin/verifications/${p.latestSubmissionId}`}
            className="text-label text-primary font-semibold"
          >
            View submission
          </Link>
        )}
        {p.paused && (
          <span className="bg-warning-soft text-warning-text text-meta inline-flex h-7 items-center rounded-full px-3 font-bold">
            Paused
          </span>
        )}
      </div>
      <div className="text-body-sm text-text-muted flex items-center gap-2">
        <Stars rating={p.rating} count={p.reviewCount} showValue={false} />
        <span>{formatRating(p.rating, p.reviewCount)}</span>
      </div>
      <a
        href={`/providers/${p.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-label text-primary self-start font-semibold"
      >
        View listing
      </a>
    </Card>
  );
}

/** S34 recent requests (D-8). Rows are not links while F-35 is off. */
export function RequestsCard({
  title,
  id,
  summary,
}: {
  title: string;
  id: string;
  summary: AdminRequestSummary;
}) {
  return (
    <Card title={title} id={id} sub={`${String(summary.open)} open · ${String(summary.total)} total`}>
      {summary.recent.length === 0 ? (
        <p className="text-body-sm text-text-subtle py-6 text-center">No requests yet.</p>
      ) : (
        <ul className="divide-border divide-y">
          {summary.recent.map((r) => (
            <li key={r.ref} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:gap-4">
              <span className="text-mono text-text-muted font-mono">{r.ref}</span>
              <span className="text-body-sm text-text min-w-0 flex-1 truncate">
                {r.customerName} · {r.businessName} · {r.serviceName}
              </span>
              <span className="text-meta text-text-muted">
                {formatDateShort(r.preferredDate)} · {SLOT_LABEL[r.slot]} · {r.townName}
              </span>
              <StatusPill kind="request" status={r.status} compact />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

const HISTORY_LABEL: Partial<Record<AuditEntry['action'], string>> = {
  user_suspend: 'Suspended',
  user_reactivate: 'Reactivated',
};

/** S34 account history, newest first. */
export function AccountHistoryCard({ items }: { items: AuditEntry[] }) {
  return (
    <Card title="Account history" id="history">
      {items.length === 0 ? (
        <p className="text-body-sm text-text-subtle py-6 text-center">No account changes yet.</p>
      ) : (
        <ul className="divide-border divide-y">
          {items.map((a) => (
            <li key={a.id} className="flex flex-col gap-1 py-3">
              <p className="text-body-sm text-text">
                <span className="font-semibold">{HISTORY_LABEL[a.action] ?? a.action}</span>
                <span className="text-text-muted"> · {formatDateTime(a.at)}</span>
              </p>
              {a.reason && <p className="text-body-sm text-text-muted">Reason: {a.reason}</p>}
              <p className="text-meta text-text-subtle">by {a.adminName}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
