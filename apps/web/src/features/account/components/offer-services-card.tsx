import { useId } from 'react';
import { Link, useNavigate } from 'react-router';
import type { Me } from '@fixit/contracts';
import { Switch } from '@/components/ui/switch';

const linkClass =
  'text-label text-primary hover:text-primary-hover inline-flex min-h-11 items-center font-semibold underline-offset-2 hover:underline sm:min-h-0';

export function OfferServicesCard({ me }: { me: Me }) {
  const navigate = useNavigate();
  const id = useId();
  const isProvider = me.roles.includes('provider');
  const draftStep = me.provider && !me.provider.onboarding.complete ? me.provider.onboarding.step : null;
  return (
    <section
      aria-labelledby={`${id}-h`}
      className="border-border bg-surface flex flex-col gap-3 rounded-2xl border p-5 sm:p-7"
    >
      <div className="flex items-center justify-between gap-4">
        <h2 id={`${id}-h`} className="text-title-sm text-text">
          I offer services
        </h2>
        <Switch
          aria-labelledby={`${id}-h`}
          checked={isProvider}
          disabled={isProvider}
          onCheckedChange={(on) => {
            if (on) void navigate(`/become-a-provider/${String(draftStep ?? 1)}`);
          }}
          className="relative after:absolute after:-inset-2" // 44 px hit area around the 26 px switch
        />
      </div>
      {isProvider ? (
        <>
          <p className="text-body-sm text-text">
            You're listed as {me.provider?.businessName ?? 'your business'}.
          </p>
          <Link to="/dashboard" className={linkClass}>
            Go to your dashboard
          </Link>
          <p className="text-meta text-text-subtle">
            To stop new requests for a while, pause them in your dashboard settings.
          </p>
        </>
      ) : (
        <>
          <p className="text-body-sm text-text-muted">
            List your business on Fixit and receive job requests.
          </p>
          {draftStep !== null && (
            <Link to={`/become-a-provider/${String(draftStep)}`} className={linkClass}>
              Continue setting up your listing
            </Link>
          )}
        </>
      )}
    </section>
  );
}
