import { useCallback, useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router';
import { DiscardChangesGuard } from '@/components/discard-changes-guard';
import { LoadingRegion } from '@/components/loading-region';
import { SectionError } from '@/components/section-error';
import { SkeletonSectionCard } from '@/components/skeletons';
import { useOwnProvider } from '@/features/provider-business/hooks';
import { useCatalog } from '@/features/site/hooks';
import { useAuth } from '@/lib/auth-store';
import { EmailGate } from '../components/email-gate';
import { StepAreas } from '../components/step-areas';
import { StepBusiness } from '../components/step-business';
import { StepCategory } from '../components/step-category';
import { StepPhoto } from '../components/step-photo';
import { StepServices } from '../components/step-services';
import { WizardFrame } from '../components/wizard-frame';
import { resolveStep } from '../step-route';
import type { WizardStep } from '../steps';

const STEP_COMPONENT = {
  1: StepBusiness,
  2: StepCategory,
  3: StepServices,
  4: StepAreas,
  5: StepPhoto,
} as const;

export function BecomeProviderPage() {
  const { me } = useAuth();
  const { step: raw } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const fromWizard = (location.state as { wizard?: boolean } | null)?.wizard === true;
  const confirmed = me?.emailConfirmed ?? false;
  const own = useOwnProvider(confirmed);
  const catalog = useCatalog();
  const [dirty, setDirty] = useState(false);
  const [next, setNext] = useState<WizardStep | 'done' | null>(null);
  useEffect(() => {
    if (next === null) return;
    setNext(null);
    void navigate(next === 'done' ? '/become-a-provider/done' : `/become-a-provider/${String(next)}`, {
      state: { wizard: true },
    });
  }, [next, navigate]);
  useEffect(() => {
    setDirty(false);
  }, [raw]);
  const onDirtyChange = useCallback((d: boolean) => {
    setDirty(d);
  }, []);

  if (!me) return null; // RequireAuth renders us only when signed in
  if (!confirmed)
    return (
      <div className="mx-auto w-full max-w-[720px] px-4 pb-14 pt-5 sm:px-8 sm:pt-10">
        <EmailGate email={me.email} />
      </div>
    );
  if (own.isError || catalog.isError)
    return (
      <div className="mx-auto w-full max-w-[720px] px-4 pb-14 pt-5 sm:px-8 sm:pt-10">
        <SectionError
          onRetry={() => {
            void own.refetch();
            void catalog.refetch();
          }}
        />
      </div>
    );
  if (own.isPending || catalog.isPending)
    return (
      <LoadingRegion
        loading
        className="mx-auto w-full max-w-[720px] px-4 pt-5 sm:px-8 sm:pt-10"
        skeleton={<SkeletonSectionCard lines={5} />}
      />
    );
  const saved = own.data?.onboarding.step ?? 1;
  const step = resolveStep(raw, saved, fromWizard);
  if (String(step) !== raw)
    return <Navigate to={`/become-a-provider/${String(step)}`} replace state={{ wizard: true }} />;
  const Step = STEP_COMPONENT[step];
  return (
    <>
      <DiscardChangesGuard when={dirty && next === null} />
      <WizardFrame step={step}>
        <Step
          key={step}
          me={me}
          own={own.data ?? null}
          catalog={catalog.data}
          onDirtyChange={onDirtyChange}
          onBack={() => {
            if (step === 1) void navigate(-1);
            else void navigate(`/become-a-provider/${String(step - 1)}`, { state: { wizard: true } });
          }}
          onSaved={() => {
            setDirty(false);
            setNext(step === 5 ? 'done' : ((step + 1) as WizardStep));
          }}
        />
      </WizardFrame>
    </>
  );
}
