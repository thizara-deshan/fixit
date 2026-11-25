import { ArticleCard } from '../components/article-card';

export const PRIVACY_HEADINGS = [
  'What we collect',
  'Your national ID and other documents',
  'Who sees your details',
  'How long we keep it',
  'Your choices',
  'Contact',
] as const;

/** Body copy comes from the legal draft before launch (M22, M00 gap #1). */
export function PrivacyPage() {
  return (
    <ArticleCard title="Privacy">
      {PRIVACY_HEADINGS.map((h) => (
        <section key={h} className="flex flex-col gap-4">
          <h2>{h}</h2>
          <p className="text-body-sm text-text-subtle">Content coming before launch.</p>
        </section>
      ))}
    </ArticleCard>
  );
}
