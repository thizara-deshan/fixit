import type { Eligibility } from '@fixit/contracts';

export type BlockIcon = 'lock' | 'pause' | 'mail' | 'inbox';
export type BlockAction = { label: string; to: string } | { label: 'Resend email'; resend: true };
export type Block =
  | { kind: 'none' }
  | { kind: 'not_found' }
  | {
      kind: 'card';
      icon: BlockIcon;
      title: string;
      body: string;
      action: BlockAction;
      secondary?: { label: string; to: string };
    };

export interface BlockContext {
  providerId: string;
  businessName: string;
  categoryId: string;
  email: string;
  loc: string | null;
}

/** SPEC S12 blocked states. undefined (eligibility failed to load), ok, guest, admin → no block (D-3). */
export function toBlock(e: Eligibility | undefined, c: BlockContext): Block {
  if (!e) return { kind: 'none' };
  switch (e.state) {
    case 'own_listing':
      return {
        kind: 'card',
        icon: 'lock',
        title: "You can't request your own listing",
        body: 'Customers see this page when they want to book you.',
        action: { label: 'Go to your dashboard', to: '/dashboard' },
      };
    case 'provider_unavailable':
      return { kind: 'not_found' };
    case 'provider_paused': {
      const q = new URLSearchParams({ cat: c.categoryId });
      if (c.loc) q.set('loc', c.loc);
      return {
        kind: 'card',
        icon: 'pause',
        title: `${c.businessName} isn't taking new requests right now`,
        body: 'Try again later or choose another provider.',
        action: { label: 'Find another provider', to: `/discover?${q.toString()}` },
      };
    }
    case 'email_unconfirmed':
      return {
        kind: 'card',
        icon: 'mail',
        title: 'Confirm your email first',
        body: `We sent a link to ${c.email}. Confirm it, then come back to send your request.`,
        action: { label: 'Resend email', resend: true },
        secondary: { label: 'Back to profile', to: `/providers/${c.providerId}` },
      };
    case 'open_with_provider':
      return {
        kind: 'card',
        icon: 'inbox',
        title: `You already have an open request with ${c.businessName}`,
        body: 'You can send another once this one is finished.',
        action: { label: 'View request', to: `/requests/${e.ref}` },
      };
    case 'open_limit_reached':
      return {
        kind: 'card',
        icon: 'inbox',
        title: 'You have 5 open requests',
        body: 'You can have up to 5 open requests at a time. Cancel one or wait for one to finish.',
        action: { label: 'Go to my requests', to: '/requests' },
      };
    case 'ok':
    case 'guest':
    case 'admin':
      return { kind: 'none' };
  }
}
