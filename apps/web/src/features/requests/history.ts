import type { RequestActor } from '@fixit/contracts';

export function actorLabel(actor: RequestActor, businessName: string): string {
  switch (actor) {
    case 'customer':
      return 'by you';
    case 'provider':
      return `by ${businessName}`;
    case 'admin':
      return 'by Fixit';
    case 'system':
      return 'automatically';
  }
}
