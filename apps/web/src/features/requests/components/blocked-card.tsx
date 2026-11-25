import { CirclePause, Inbox, Lock, Mail, type LucideIcon } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { useResendConfirmation } from '@/features/auth/hooks';
import type { Block, BlockIcon } from '../blocked-state';

const ICONS: Record<BlockIcon, LucideIcon> = { lock: Lock, pause: CirclePause, mail: Mail, inbox: Inbox };

export function BlockedCard({ block }: { block: Extract<Block, { kind: 'card' }> }) {
  const resend = useResendConfirmation();
  const a = block.action;
  const action =
    'resend' in a
      ? {
          label: a.label,
          onClick: () => {
            if (!resend.isPending) resend.mutate();
          },
        }
      : a;
  return (
    <EmptyState
      icon={ICONS[block.icon]}
      title={block.title}
      body={block.body}
      action={action}
      secondaryAction={block.secondary}
    />
  );
}
