import { ArrowLeftRight, Search, Send } from 'lucide-react';
import { CategoriesSection } from '../components/categories-section';
import { CtaBand } from '../components/cta-band';
import { FeaturedSection } from '../components/featured-section';
import { Hero } from '../components/hero';
import { StepsGrid, type Step } from '../components/steps-grid';
import { useFeatured } from '../hooks';
import { useScrollToHash } from '../use-scroll-to-hash';

const STEPS: readonly Step[] = [
  {
    n: '01',
    title: 'Search',
    icon: Search,
    body: "Tell us what you need and where. We'll show local pros who do exactly that.",
  },
  {
    n: '02',
    title: 'Compare',
    icon: ArrowLeftRight,
    body: 'Check ratings, reviews, prices and Verified badges to pick the right fit.',
  },
  {
    n: '03',
    title: 'Request',
    icon: Send,
    accent: true,
    body: "Send a service request with your details. The provider accepts and you're booked.",
  },
];

export function HomePage() {
  const featured = useFeatured();
  useScrollToHash(!featured.isPending);
  return (
    <div className="bg-page flex flex-col">
      <Hero floating={featured.data?.[0] ?? null} />
      <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-14 px-4 py-14 sm:px-6 lg:gap-[88px] lg:px-8 lg:py-[88px]">
        <CategoriesSection />
        <FeaturedSection query={featured} />
        <section
          id="how-it-works"
          aria-labelledby="how-it-works-title"
          className="flex scroll-mt-[72px] flex-col gap-8"
        >
          <div className="flex flex-col items-center gap-1 text-center">
            <h2 id="how-it-works-title" className="text-title-lg text-text">
              How it works
            </h2>
            <p className="text-body text-text-muted">Get the job done in three simple steps.</p>
          </div>
          <StepsGrid steps={STEPS} />
        </section>
        <CtaBand
          title="Are you a service provider? Join us."
          body="List your business, get verified and receive requests from customers in your area — free to join."
          learnMore
        />
      </div>
    </div>
  );
}
