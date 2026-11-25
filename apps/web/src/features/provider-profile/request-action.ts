import type { Eligibility } from '@fixit/contracts';

export type RequestAction =
  | { kind: 'hidden' }
  | { kind: 'loading' }
  | { kind: 'request'; to: string } // enabled primary `Request Service`
  | { kind: 'disabled'; helper: string } // disabled primary `Request Service`
  | { kind: 'edit'; to: '/dashboard/profile'; helper: 'This is your listing.' }
  | { kind: 'view'; to: string; helper: string };

export const LIMIT_HELPER = 'You have 5 open requests. Wait for one to finish or cancel one to send another.';

/** SPEC S3.E7 table, evaluated in order. `paused` comes from the profile so a guest sees the paused state. */
export function toRequestAction(
  e: Eligibility,
  p: { id: string; businessName: string; paused: boolean },
): RequestAction {
  const paused: RequestAction = {
    kind: 'disabled',
    helper: `${p.businessName} isn't taking new requests right now.`,
  };
  switch (e.state) {
    case 'admin':
    case 'provider_unavailable':
      return { kind: 'hidden' };
    case 'own_listing':
      return { kind: 'edit', to: '/dashboard/profile', helper: 'This is your listing.' };
    case 'provider_paused':
      return paused;
    case 'guest':
      return p.paused ? paused : { kind: 'request', to: `/login?next=/providers/${p.id}/request` };
    case 'open_with_provider':
      return {
        kind: 'view',
        to: `/requests/${e.ref}`,
        helper: `You already have an open request with ${p.businessName}.`,
      };
    case 'open_limit_reached':
      return { kind: 'disabled', helper: LIMIT_HELPER };
    case 'email_unconfirmed':
    case 'ok':
      return { kind: 'request', to: `/providers/${p.id}/request` };
  }
}
