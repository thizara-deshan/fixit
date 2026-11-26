import type { VerificationState, VerificationStatus } from '@fixit/contracts';
import { NoticeBanner } from '@/components/notice-banner';
import { StatusPill } from '@/components/status-pill';
import { formatDateLong } from '@/lib/format';

const COPY: Record<VerificationStatus, { title: string; body?: string }> = {
  not_submitted: {
    title: 'Get the Verified badge',
    body: 'Upload your national ID so Fixit can check who you are. Verified providers get a badge and appear under "Verified only".',
  },
  pending_review: {
    title: "We're checking your documents",
    body: "This usually takes 1–2 working days. We'll email you when it's done.",
  },
  verified: { title: "You're verified" },
  rejected: { title: "Your documents weren't approved" },
};

export function VerificationStatusCard({ state }: { state: VerificationState }) {
  const c = COPY[state.status];
  return (
    <section className="border-border bg-surface flex flex-col gap-3 rounded-2xl border p-5 sm:p-6">
      <StatusPill kind="verification" status={state.status} className="self-start" />
      <h2 className="text-title-md text-text">{c.title}</h2>
      {c.body && <p className="text-body-sm text-text-muted">{c.body}</p>}
      {state.status === 'verified' && state.verifiedAt && (
        <p className="text-body-sm text-text-muted">
          Verified on {formatDateLong(state.verifiedAt)}. If you change your business name or category,
          we&apos;ll check your documents again.
        </p>
      )}
      {state.status === 'rejected' && (
        <NoticeBanner variant="danger">
          <span className="block">Reason: {state.rejectionReason ?? '—'}</span>
          <span className="block">Fix the issue below and submit again.</span>
        </NoticeBanner>
      )}
    </section>
  );
}
