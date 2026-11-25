import { BriefcaseBusiness, CircleCheck, Inbox, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { CtaBand } from '../components/cta-band';
import { StepsGrid, type Step } from '../components/steps-grid';
import { useProviderCta } from '../use-provider-cta';

const STEPS: readonly Step[] = [
  {
    n: '01',
    title: 'Create your listing',
    icon: BriefcaseBusiness,
    body: 'Add your business, services, prices and the towns you cover.',
  },
  {
    n: '02',
    title: 'Get verified',
    icon: ShieldCheck,
    body: 'Upload your NIC, and your trade certificate if you have one. We check it and add the Verified badge.',
  },
  {
    n: '03',
    title: 'Receive requests',
    icon: Inbox,
    accent: true,
    body: 'Accept the jobs that suit you, contact the customer and get paid directly.',
  },
];

const NEEDS = [
  'A mobile number',
  'Your NIC (front and back)',
  'Your prices for each service',
  'Optional: trade certificate or NVQ, business registration',
] as const;

export function ForProvidersPage() {
  const cta = useProviderCta();
  return (
    <div className="bg-page flex flex-col">
      <section className="border-border bg-surface border-b">
        <div className="mx-auto flex max-w-[720px] flex-col items-center gap-6 px-4 pb-12 pt-8 text-center sm:px-6 lg:px-8 lg:py-[72px]">
          <span className="bg-success-soft text-success-text text-meta rounded-full px-3 py-1 font-bold">
            Free to join
          </span>
          <h1 className="text-title-xl text-text text-balance">Get local jobs without paying to join.</h1>
          <p className="text-body sm:text-lead text-text-muted">
            List your business on Fixit, get verified and receive requests from customers in the Western
            Province. Customers pay you directly — Fixit takes no commission.
          </p>
          {cta && (
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link to={cta.to}>{cta.label}</Link>
            </Button>
          )}
        </div>
      </section>
      <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-14 px-4 py-14 sm:px-6 lg:gap-[88px] lg:px-8 lg:py-[88px]">
        <section aria-labelledby="provider-steps" className="flex flex-col gap-8">
          <h2 id="provider-steps" className="text-title-lg text-text text-center">
            How it works for providers
          </h2>
          <StepsGrid steps={STEPS} />
        </section>
        <section className="border-border bg-surface mx-auto w-full max-w-[720px] rounded-2xl border p-6 lg:p-8">
          <h2 className="text-title-md text-text">What you&apos;ll need</h2>
          <ul className="mt-4 flex flex-col gap-3">
            {NEEDS.map((n) => (
              <li key={n} className="text-body text-text flex gap-3">
                <CircleCheck aria-hidden="true" className="text-success mt-0.5 size-5 shrink-0" />
                {n}
              </li>
            ))}
          </ul>
        </section>
        <CtaBand
          title="Ready to get started?"
          body="It takes about 10 minutes to set up your listing."
          learnMore={false}
        />
      </div>
    </div>
  );
}
