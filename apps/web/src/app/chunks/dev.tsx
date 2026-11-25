import { useState, type ReactNode } from 'react';
import { Info, Inbox } from 'lucide-react';
import { RequestStatus, type VerificationStatus } from '@fixit/contracts';
import { BackLink } from '@/components/back-link';
import { DataList, type DataListColumn } from '@/components/data-list';
import { EmptyState } from '@/components/empty-state';
import { FormField } from '@/components/form-field';
import { LoadingRegion } from '@/components/loading-region';
import { NoticeBanner } from '@/components/notice-banner';
import { Pagination } from '@/components/pagination';
import { PhoneInput } from '@/components/phone-input';
import { PriceLabel } from '@/components/price-label';
import { ResponsiveDialog } from '@/components/responsive-dialog';
import { SectionError } from '@/components/section-error';
import { SegmentedTabLinks, SegmentedTabs } from '@/components/segmented-tabs';
import {
  SkeletonCategoryCard,
  SkeletonFeaturedCard,
  SkeletonPhoneCards,
  SkeletonProfileHeader,
  SkeletonResultCard,
  SkeletonReviewRow,
  SkeletonSectionCard,
  SkeletonStatTile,
} from '@/components/skeletons';
import { Stars } from '@/components/stars';
import { StatusPill } from '@/components/status-pill';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { VerifiedBadge } from '@/components/verified-badge';
import { formatDateShort } from '@/lib/format';
import { notify, notifyError } from '@/lib/toast';
import { customerTabs } from '../layouts/nav-config';

interface Row {
  ref: string;
  name: string;
  service: string;
  date: string;
  status: RequestStatus;
}

const ROWS: Row[] = [
  { ref: 'FX-2061', name: 'Olivia Martinez', service: 'Leak repair', date: '2026-11-23', status: 'pending' },
  {
    ref: 'FX-2059',
    name: 'James Carter',
    service: 'Water heater install',
    date: '2026-11-26',
    status: 'pending',
  },
  {
    ref: 'FX-2054',
    name: 'Ethan Brooks',
    service: 'Fixture replacement',
    date: '2026-11-22',
    status: 'accepted',
  },
  {
    ref: 'FX-2046',
    name: 'Olivia Martinez',
    service: 'Leak repair',
    date: '2026-11-15',
    status: 'completed',
  },
  {
    ref: 'FX-2037',
    name: 'Marcus Lee',
    service: 'Water heater install',
    date: '2026-11-08',
    status: 'declined',
  },
];

const COLUMNS: DataListColumn<Row>[] = [
  {
    id: 'customer',
    header: 'Customer',
    card: 'title',
    cell: (r) => (
      <>
        {r.name}
        <span className="text-mono text-text-subtle block font-mono">{r.ref}</span>
      </>
    ),
  },
  { id: 'service', header: 'Service', card: 'meta', cell: (r) => r.service },
  { id: 'date', header: 'Date', card: 'meta', cell: (r) => formatDateShort(r.date) },
  {
    id: 'status',
    header: 'Status',
    card: 'status',
    cell: (r) => <StatusPill kind="request" status={r.status} compact />,
  },
  {
    id: 'actions',
    header: 'Actions',
    card: 'actions',
    cell: (r) => (
      <Button
        variant="secondary"
        size="sm"
        onClick={() => {
          notify(`Opened ${r.ref}`);
        }}
      >
        View
      </Button>
    ),
  },
];

const VERIFICATION: VerificationStatus[] = ['not_submitted', 'pending_review', 'verified', 'rejected'];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-title-md text-text">{title}</h2>
      {children}
    </section>
  );
}

const row = 'flex flex-wrap items-center gap-3';

export function DevUiPage() {
  const [loadingList, setLoadingList] = useState(false);
  const [dialog, setDialog] = useState(false);
  const [dialogInfo, setDialogInfo] = useState(false);
  const [reloading, setReloading] = useState(false);
  const [tab, setTab] = useState('all');
  const [infoOpen, setInfoOpen] = useState(true);

  const reload = () => {
    setReloading(true);
    setTimeout(() => {
      setReloading(false);
    }, 2000);
  };

  return (
    <div className="max-w-content pb-22 mx-auto flex w-full flex-col gap-10 px-4 pt-8 sm:px-6 lg:px-8">
      <h1 className="text-title-lg text-text">UI kit</h1>

      <Section title="DataList">
        <Button
          variant="secondary"
          className="self-start"
          onClick={() => {
            setLoadingList((v) => !v);
          }}
        >
          Toggle loading
        </Button>
        <div className="border-border bg-surface overflow-hidden rounded-2xl border sm:p-0">
          <DataList
            rows={ROWS}
            columns={COLUMNS}
            getRowKey={(r) => r.ref}
            caption="Requests"
            rowHref={(r) => `/dev/ui#${r.ref}`}
            loading={loadingList}
          />
        </div>
      </Section>

      <Section title="ResponsiveDialog">
        <div className={row}>
          <Button
            onClick={() => {
              setDialog(true);
            }}
          >
            Open dialog
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setDialogInfo(true);
            }}
          >
            Open centred dialog
          </Button>
        </div>
        <ResponsiveDialog
          open={dialog}
          onOpenChange={setDialog}
          title="Decline Olivia's request?"
          description="Olivia will be emailed that you can't take this job."
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setDialog(false);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  setDialog(false);
                  notify("Declined Olivia's request");
                }}
              >
                Decline
              </Button>
            </>
          }
        />
        <ResponsiveDialog
          open={dialogInfo}
          onOpenChange={setDialogInfo}
          title="Heads up"
          description="This is a single-message dialog."
          align="center"
          icon={
            <span
              aria-hidden="true"
              className="bg-primary-soft text-primary grid size-14 place-items-center rounded-xl"
            >
              <Info className="size-7" />
            </span>
          }
          footer={
            <Button
              onClick={() => {
                setDialogInfo(false);
              }}
            >
              OK
            </Button>
          }
        />
      </Section>

      <Section title="Toasts">
        <div className={row}>
          <Button
            variant="secondary"
            onClick={() => {
              notify('Saved Bell & Sons Plumbing.');
            }}
          >
            Toast (4 s)
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              notify('Removed Bell & Sons Plumbing from saved.', {
                label: 'Undo',
                onClick: () => {
                  notify('Saved Bell & Sons Plumbing.');
                },
              });
            }}
          >
            Toast with Undo (8 s)
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              notifyError("Couldn't save. Try again.", () => {
                notify('Saved Bell & Sons Plumbing.');
              });
            }}
          >
            Error toast
          </Button>
        </div>
      </Section>

      <Section title="Status pills">
        {([false, true] as const).map((compact) => (
          <div key={String(compact)} className={row}>
            {RequestStatus.options.map((s) => (
              <StatusPill key={s} kind="request" status={s} compact={compact} />
            ))}
            {VERIFICATION.map((s) => (
              <StatusPill key={s} kind="verification" status={s} compact={compact} />
            ))}
            <StatusPill kind="account" status="active" compact={compact} />
            <StatusPill kind="account" status="suspended" compact={compact} />
            <StatusPill kind="review" visibility="hidden" compact={compact} />
            <StatusPill kind="availability" compact={compact} />
            <StatusPill kind="trust" verified={false} compact={compact} />
            <StatusPill kind="trust" verified compact={compact} />
          </div>
        ))}
      </Section>

      <Section title="Stars, prices and badges">
        <div className={row}>
          <Stars rating={4.9} count={212} />
          <Stars rating={null} count={0} />
          <VerifiedBadge />
          <VerifiedBadge size="sm" />
        </div>
        <div className={row}>
          <PriceLabel amount={2500} unit="per_hour" />
          <PriceLabel amount={2500} unit="per_hour" variant="short" />
          <PriceLabel amount={4500} unit="fixed" variant="short" />
        </div>
      </Section>

      <Section title="Notice banners">
        <NoticeBanner variant="warning" action={{ label: 'Get verified', to: '/dashboard/verification' }}>
          Your listing shows as &quot;Not yet verified&quot;. Upload your ID to get the Verified badge.
        </NoticeBanner>
        {infoOpen && (
          <NoticeBanner
            variant="info"
            onDismiss={() => {
              setInfoOpen(false);
            }}
          >
            We&apos;re checking your documents. We&apos;ll email you when it&apos;s done.
          </NoticeBanner>
        )}
        <NoticeBanner variant="danger" action={{ label: 'Fix and resubmit', to: '/dashboard/verification' }}>
          Your verification wasn&apos;t approved: Photo is blurry
        </NoticeBanner>
      </Section>

      <Section title="Empty and error states">
        <EmptyState
          icon={Inbox}
          title="No requests yet"
          body="When customers send you requests, they'll show up here."
        />
        <SectionError
          onRetry={() => {
            notify('Retrying…');
          }}
        />
      </Section>

      <Section title="Skeletons">
        <Button variant="secondary" className="self-start" onClick={reload}>
          Reload
        </Button>
        <LoadingRegion loading={reloading} skeleton={<SkeletonSectionCard />}>
          <p className="text-body-sm text-text-muted">Loaded content</p>
        </LoadingRegion>
        <div className="grid gap-4 sm:grid-cols-2">
          <SkeletonCategoryCard />
          <SkeletonFeaturedCard />
          <SkeletonResultCard />
          <SkeletonProfileHeader />
          <SkeletonSectionCard />
          <SkeletonStatTile />
          <SkeletonPhoneCards count={2} />
          <SkeletonReviewRow />
        </div>
      </Section>

      <Section title="Pagination, tabs and back link">
        <Pagination page={2} totalPages={8} hrefFor={(p) => `/dev/ui?page=${String(p)}`} />
        <SegmentedTabs
          label="Status"
          value={tab}
          onValueChange={setTab}
          items={[
            { value: 'all', label: 'All', count: 8 },
            { value: 'pending', label: 'Pending', count: 3 },
            { value: 'accepted', label: 'Accepted', count: 2 },
          ]}
        />
        <SegmentedTabLinks label="Account sections" items={customerTabs()} />
        <BackLink to="/">Back to results</BackLink>
      </Section>

      <Section title="Form fields">
        <FormField
          label="Mobile number"
          required
          help="Saved to your account."
          error="Enter a Sri Lankan mobile number, like 077 123 4567."
        >
          {(c) => <PhoneInput {...c} />}
        </FormField>
        <FormField label="Notes" optional>
          {(c) => <Textarea {...c} />}
        </FormField>
      </Section>
    </div>
  );
}

/** AC6: a route that throws while rendering. */
export function DevThrowPage(): never {
  throw new Error('Dev route error (M03 AC6)');
}
