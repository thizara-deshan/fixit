import { TriangleAlert } from 'lucide-react';
import { EmptyState } from './empty-state';

/** SPEC §6.3: replaces one section's card; `onRetry` refetches only that section. */
export function SectionError({ onRetry, className }: { onRetry: () => void; className?: string }) {
  return (
    <EmptyState
      icon={TriangleAlert}
      tone="warning"
      title="We couldn't load this."
      body="Check your connection and try again."
      action={{ label: 'Try again', onClick: onRetry }}
      className={className}
    />
  );
}
