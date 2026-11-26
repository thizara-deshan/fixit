import {
  formatInColombo,
  type ProviderRequestView,
  type RequestActor,
  type RequestStatus,
} from '@fixit/contracts';
import { formatDateLong } from '@/lib/format';

/** S20.E2 (Asia/Colombo hour). */
export function greeting(now: Date, firstName: string): string {
  const h = Number(formatInColombo(now, 'H'));
  const part = h >= 5 && h < 12 ? 'morning' : h >= 12 && h < 17 ? 'afternoon' : 'evening';
  return `Good ${part}, ${firstName}`;
}

/** S20.E3. */
export function greetingSub(pending: number): string {
  if (pending === 0) return "You're all caught up.";
  if (pending === 1) return 'You have 1 new request waiting for a reply.';
  return `You have ${String(pending)} new requests waiting for a reply.`;
}

/** D-8: `Olivia M.` → `Olivia`; `Marcus Bell` → `Marcus`. */
export const firstNameOf = (name: string): string => name.trim().split(/\s+/)[0] ?? name;

/** Table/card name: full name once revealed, else `Olivia M.` (§6.3). */
export const customerName = (v: Pick<ProviderRequestView, 'customer'>): string =>
  v.customer.revealed ? v.customer.fullName : v.customer.displayName;

/** S22.E7. */
export function providerActorLabel(actor: RequestActor): string {
  switch (actor) {
    case 'provider':
      return 'by you';
    case 'customer':
      return 'by the customer';
    case 'admin':
      return 'by Fixit';
    case 'system':
      return 'automatically';
  }
}

export const PENDING_PRIVACY_NOTE = 'Full name, address and mobile number are shown after you accept.';

/** S22.E1 closed note; null while Pending/Accepted/Completed. */
export function closedPrivacyNote(status: RequestStatus): string | null {
  if (status === 'declined' || status === 'cancelled' || status === 'expired')
    return `Contact details are hidden because this request is ${status}.`;
  return null;
}

/** S22.E6 (+ D-9). null for open/completed requests. */
export function closedCopy(
  v: Pick<ProviderRequestView, 'status' | 'closedBy' | 'reason' | 'expiresAt' | 'customer'>,
): { line: string; reason: string | null } | null {
  const first = firstNameOf(v.customer.displayName);
  switch (v.status) {
    case 'declined':
      return v.closedBy === 'system'
        ? { line: 'Declined automatically — your account was suspended.', reason: null }
        : { line: 'You declined this request.', reason: v.reason };
    case 'cancelled': {
      const line =
        v.closedBy === 'customer'
          ? `${first} cancelled this request.`
          : v.closedBy === 'admin'
            ? 'Fixit cancelled this request.'
            : 'This request was cancelled.';
      return { line, reason: v.reason };
    }
    case 'expired':
      return {
        line: `This request expired on ${formatDateLong(v.expiresAt)} because it wasn't answered in time.`,
        reason: null,
      };
    default:
      return null;
  }
}
