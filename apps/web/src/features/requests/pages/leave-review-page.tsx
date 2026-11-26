import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import type { CreateReviewBody } from '@fixit/contracts';
import { NotFoundPage } from '@/app/errors/not-found-page';
import { BackLink } from '@/components/back-link';
import { DiscardChangesGuard } from '@/components/discard-changes-guard';
import { SkeletonSectionCard } from '@/components/skeletons';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-store';
import { ApiError } from '@/lib/http';
import { notify } from '@/lib/toast';
import { useBodyClass } from '@/lib/use-body-class';
import { ReviewForm } from '../components/review-form';
import { useMyRequest, usePostReview } from '../hooks';

const SHELL = 'mx-auto w-full max-w-[640px]';

/** S16. */
export function LeaveReviewPage() {
  const { ref = '' } = useParams();
  const navigate = useNavigate();
  const { me } = useAuth();
  const q = useMyRequest(ref);
  const post = usePostReview(ref);
  const [dirty, setDirty] = useState(false);
  const [postedRef, setPostedRef] = useState<string | null>(null);
  const [serverError, setServerError] = useState(false);
  const v = q.data;
  const showForm = Boolean(v?.review?.eligible && me);
  useBodyClass(showForm ? 'pb-24 sm:pb-0' : '');
  useEffect(() => {
    if (postedRef) {
      notify('Thanks — your review is live.');
      void navigate(`/requests/${postedRef}`, { replace: true });
    }
  }, [postedRef, navigate]);
  const onDirtyChange = useCallback((d: boolean) => {
    setDirty(d);
  }, []);

  if (q.isError) {
    if (q.error instanceof ApiError && q.error.status === 404) return <NotFoundPage variant="request" />;
    throw q.error; // S41
  }
  if (v?.review?.own && postedRef === null) return <Navigate to={`/requests/${v.ref}`} replace />; // already reviewed

  const submit = (values: CreateReviewBody) => {
    setServerError(false);
    post.mutate(values, {
      onSuccess: () => {
        setPostedRef(ref);
      },
      onError: (e) => {
        if (e instanceof ApiError && e.rule === 'already_reviewed') {
          void navigate(`/requests/${ref}`, { replace: true });
          return;
        }
        if (
          e instanceof ApiError &&
          (e.rule === 'review_window_closed' || e.rule === 'review_not_eligible')
        ) {
          void q.refetch();
          return;
        }
        setServerError(true);
      },
    });
  };

  return (
    <>
      <DiscardChangesGuard when={dirty && postedRef === null} />
      <BackLink to={`/requests/${ref}`}>Back to request</BackLink>
      {!v || !me ? (
        <div className={SHELL}>
          <SkeletonSectionCard lines={6} />
        </div>
      ) : v.review?.eligible ? (
        <ReviewForm
          view={v}
          displayName={me.displayName}
          pending={post.isPending}
          serverError={serverError}
          onSubmit={submit}
          onDirtyChange={onDirtyChange}
        />
      ) : (
        <div
          className={`${SHELL} border-border bg-surface flex flex-col items-start gap-4 rounded-2xl border p-5 sm:p-7`}
        >
          <p className="text-body text-text-muted">The review window for this job has closed.</p>
          <Button asChild variant="secondary" size="md">
            <Link to={`/requests/${ref}`}>Back to request</Link>
          </Button>
        </div>
      )}
    </>
  );
}
