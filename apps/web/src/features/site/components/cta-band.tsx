import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { useProviderCta } from '../use-provider-cta';

export function CtaBand({ title, body, learnMore }: { title: string; body: string; learnMore: boolean }) {
  const cta = useProviderCta();
  return (
    <section
      aria-labelledby="cta-band"
      className="bg-primary text-primary-foreground flex flex-col gap-6 rounded-2xl px-6 py-7 lg:flex-row lg:items-center lg:justify-between lg:rounded-3xl lg:px-14 lg:py-12"
    >
      <div className="flex flex-col gap-2">
        <h2 id="cta-band" className="text-title-lg tracking-tight">
          {title}
        </h2>
        <p className="text-body text-on-primary-muted max-w-[600px]">{body}</p>
      </div>
      {(cta !== null || learnMore) && (
        <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
          {cta && (
            <Button asChild variant="cta" size="lg" className="w-full sm:w-auto">
              <Link to={cta.to}>
                {cta.label}
                {cta.label === 'Join as a provider' && <ArrowRight aria-hidden="true" className="size-5" />}
              </Link>
            </Button>
          )}
          {learnMore && (
            <Button
              asChild
              size="lg"
              className="border-cta-outline text-primary-foreground hover:bg-primary-hover w-full border-2 bg-transparent sm:w-auto"
            >
              <Link to="/for-providers">Learn more</Link>
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
