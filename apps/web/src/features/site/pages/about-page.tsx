import { ArticleCard } from '../components/article-card';

export function AboutPage() {
  return (
    <ArticleCard title="About Fixit">
      <p>
        Fixit helps households in the Western Province find a trusted local plumber, electrician, cleaner or
        other home-service pro, compare them on reviews, prices and verification, and send a job request in
        minutes.
      </p>
      <h2>How Fixit works</h2>
      <p>
        You choose a provider and send a request. They accept or decline. You agree the final price and pay
        the provider directly — Fixit doesn&apos;t handle payments or take a commission.
      </p>
      <h2>What &quot;Verified&quot; means</h2>
      <p>Fixit has checked this provider&apos;s national ID and, where listed, their trade qualification.</p>
    </ArticleCard>
  );
}
