import { CONTACT_EMAIL } from '@/lib/env';
import { ArticleCard } from '../components/article-card';

export function ContactPage() {
  return (
    <ArticleCard title="Contact us">
      <p>
        Email us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and we&apos;ll reply within 2
        working days.
      </p>
      <h2>Deleting your account</h2>
      <p>To delete your account, email us from the address you signed up with.</p>
      <h2>Problems with a job</h2>
      <p>
        Contact the provider first using the phone number shown on your request. If that doesn&apos;t work,
        email us with your request reference (like FX-2061).
      </p>
    </ArticleCard>
  );
}
