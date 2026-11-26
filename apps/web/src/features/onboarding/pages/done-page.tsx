import { useEffect } from 'react';
import { Link, Navigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { CircleCheck } from 'lucide-react';
import { LoadingRegion } from '@/components/loading-region';
import { SectionError } from '@/components/section-error';
import { SkeletonSectionCard } from '@/components/skeletons';
import { Button } from '@/components/ui/button';
import { refreshMe } from '@/features/auth/hooks';
import { useOwnProvider } from '@/features/provider-business/hooks';

const COLUMN = 'mx-auto w-full max-w-[720px] px-4 pt-5 sm:px-8 sm:pt-10';

export function OnboardingDonePage() {
  const qc = useQueryClient();
  const own = useOwnProvider();
  useEffect(() => {
    refreshMe(qc); // D-5: Me becomes provider now
  }, [qc]);
  if (own.isPending)
    return <LoadingRegion loading className={COLUMN} skeleton={<SkeletonSectionCard lines={3} />} />;
  if (own.isError)
    return (
      <div className={COLUMN}>
        <SectionError
          onRetry={() => {
            void own.refetch();
          }}
        />
      </div>
    );
  if (!own.data?.onboarding.complete)
    return <Navigate to={`/become-a-provider/${String(own.data?.onboarding.step ?? 1)}`} replace />;
  const business = own.data.businessName ?? 'your business';
  return (
    <div className="mx-auto w-full max-w-[720px] px-4 pb-14 pt-5 sm:px-8 sm:pb-[88px] sm:pt-10">
      <div className="border-border bg-surface flex flex-col items-center gap-4 rounded-2xl border p-7 text-center sm:p-10">
        <div className="bg-success-soft text-success-text grid size-14 place-items-center rounded-xl">
          <CircleCheck className="size-7" aria-hidden="true" />
        </div>
        <h1 className="text-title-lg text-text">Your listing is live</h1>
        <p className="text-body text-text-muted max-w-[480px]">
          Customers can now find {business}. It shows as &quot;Not yet verified&quot; until you upload your
          ID.
        </p>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Button asChild>
            <Link to="/dashboard/verification">Get verified</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/dashboard">Go to dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
