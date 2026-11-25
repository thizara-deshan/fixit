import { useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { CONTACT_EMAIL } from '@/lib/env';
import { SystemFrame } from './not-found-page';

/** S41. `errorId` = server requestId when known, else a short client id. */
export function ErrorPage({ errorId }: { errorId?: string | undefined }) {
  const [fallbackId] = useState(() => crypto.randomUUID().slice(0, 8));
  return (
    <SystemFrame>
      <EmptyState
        icon={TriangleAlert}
        tone="warning"
        titleAs="h1"
        title="Something went wrong"
        body={`Please try again. If it keeps happening, email us at ${CONTACT_EMAIL}.`}
        action={{
          label: 'Try again',
          onClick: () => {
            window.location.reload();
          },
        }}
        secondaryAction={{ label: 'Go to home', to: '/' }}
      >
        <p className="text-caption text-text-subtle font-mono font-normal">{`Error ID: ${errorId ?? fallbackId}`}</p>
      </EmptyState>
    </SystemFrame>
  );
}
