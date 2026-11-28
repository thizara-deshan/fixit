import { useState } from 'react';
import { BadgeCheck } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import type { DocumentMeta } from '@fixit/contracts';
import { NotFoundPage } from '@/app/errors/not-found-page';
import { BackLink } from '@/components/back-link';
import { ConflictDialog } from '@/components/conflict-dialog';
import { LoadingRegion } from '@/components/loading-region';
import { SectionError } from '@/components/section-error';
import { SkeletonSectionCard } from '@/components/skeletons';
import { Button } from '@/components/ui/button';
import { formatDateLong } from '@/lib/format';
import { ApiError } from '@/lib/http';
import { qk } from '@/lib/query-keys';
import { cn } from '@/lib/utils';
import { ApproveDialog } from '../components/approve-dialog';
import { DocumentTiles } from '../components/document-tiles';
import { DocumentViewer } from '../components/document-viewer';
import { PreviousDecisions } from '../components/previous-decisions';
import { RejectDialog } from '../components/reject-dialog';
import { SubmissionPill } from '../components/submission-pill';
import { ApprovalChecklist, ProviderCard } from '../components/verification-aside';
import { attemptLabel, CONFLICT, triggerNote } from '../copy';
import { useVerification } from '../hooks';

const GRID = 'grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-6';

/** S32. */
export function VerificationReviewPage() {
  const { id = '' } = useParams();
  const q = useVerification(id);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [viewing, setViewing] = useState<DocumentMeta | null>(null);
  const [dialog, setDialog] = useState<'approve' | 'reject' | null>(null);
  const [conflict, setConflict] = useState(false);

  if (q.isError) {
    if (q.error instanceof ApiError && q.error.status === 404) return <NotFoundPage area="admin" />;
    return (
      <SectionError
        onRetry={() => {
          void q.refetch();
        }}
      />
    );
  }
  const v = q.data;
  const pending = v?.status === 'pending_review';

  const onDone = (nextId: string | null) => {
    void navigate(nextId ? `/admin/verifications/${nextId}` : '/admin/verifications');
  };
  const onConflict = () => {
    setConflict(true);
    void qc.invalidateQueries({ queryKey: qk.admin.verification(id) });
  };

  return (
    <div className={cn('flex flex-col gap-5', pending && 'pb-24 sm:pb-0')}>
      <BackLink to="/admin/verifications">Back to queue</BackLink>
      <LoadingRegion
        loading={!v}
        skeleton={
          <div className={GRID}>
            <SkeletonSectionCard lines={3} />
            <SkeletonSectionCard lines={3} />
          </div>
        }
      >
        {v && (
          <div className="flex flex-col gap-5">
            <header className="flex flex-col gap-2">
              <h1 className="text-title-xl text-text break-words">{v.provider.businessName}</h1>
              <div className="text-meta text-text-muted flex flex-wrap items-center gap-x-3 gap-y-1">
                <SubmissionPill status={v.status} />
                <span>Submitted {formatDateLong(v.submittedAt)}</span>
                {v.attempt > 1 && (
                  <span>
                    {attemptLabel(v.attempt)}
                    {triggerNote(v.trigger) ? ` · ${triggerNote(v.trigger) ?? ''}` : ''}
                  </span>
                )}
              </div>
            </header>
            <div className={GRID}>
              <div className="flex min-w-0 flex-col gap-5">
                <DocumentTiles documents={v.documents} onOpen={setViewing} />
                <PreviousDecisions items={v.previous} />
              </div>
              <div className="flex flex-col gap-5 lg:sticky lg:top-6 lg:self-start">
                <ProviderCard v={v} />
                <ApprovalChecklist accountName={v.provider.accountName} ownerName={v.provider.ownerName} />
                {pending && (
                  <div className="border-border bg-surface hidden flex-col gap-3 rounded-2xl border p-5 sm:flex">
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full"
                      onClick={() => {
                        setDialog('approve');
                      }}
                    >
                      <BadgeCheck aria-hidden="true" className="size-5" />
                      Approve
                    </Button>
                    <Button
                      variant="danger-outline"
                      size="lg"
                      className="w-full"
                      onClick={() => {
                        setDialog('reject');
                      }}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </div>
            {pending && (
              <div className="border-border bg-surface fixed inset-x-0 bottom-0 z-20 flex gap-3 border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:hidden">
                <Button
                  variant="danger-outline"
                  className="h-12 flex-1"
                  onClick={() => {
                    setDialog('reject');
                  }}
                >
                  Reject
                </Button>
                <Button
                  variant="primary"
                  className="h-12 flex-1"
                  onClick={() => {
                    setDialog('approve');
                  }}
                >
                  Approve
                </Button>
              </div>
            )}
            <ApproveDialog
              v={v}
              open={dialog === 'approve'}
              onOpenChange={(o) => {
                if (!o) setDialog(null);
              }}
              onDone={onDone}
              onConflict={onConflict}
            />
            <RejectDialog
              v={v}
              open={dialog === 'reject'}
              onOpenChange={(o) => {
                if (!o) setDialog(null);
              }}
              onDone={onDone}
              onConflict={onConflict}
            />
          </div>
        )}
      </LoadingRegion>
      <DocumentViewer
        doc={viewing}
        onClose={() => {
          setViewing(null);
        }}
      />
      <ConflictDialog
        open={conflict}
        onOpenChange={setConflict}
        title={CONFLICT.submission.title}
        body={CONFLICT.submission.body}
      />
    </div>
  );
}
