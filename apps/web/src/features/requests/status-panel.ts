import type { CustomerRequestView, RequestStatus } from '@fixit/contracts';
import { formatCancelCutoffDay, formatDateLong, formatDeadline, formatLkr } from '@/lib/format';

export const PANEL_BORDER: Record<RequestStatus, string> = {
  pending: 'border-t-warning',
  accepted: 'border-t-primary',
  completed: 'border-t-success',
  declined: 'border-t-danger',
  cancelled: 'border-t-icon-subtle',
  expired: 'border-t-border-control',
};

export interface PanelCopy {
  title: string;
  /** Body lines, 15 muted, in order. */
  lines: string[];
  /** Agreed price line + subtle note (BR-12), Accepted/Completed only. */
  agreedPrice: string | null;
  showContact: boolean;
  showCancel: boolean;
  showReview: boolean;
  /** `Find another provider` target, closed statuses only. */
  findAnotherHref: string | null;
}

const PROVIDER_UNAVAILABLE = 'Reason: Provider unavailable';

export function statusPanel(v: CustomerRequestView): PanelCopy {
  const b = v.provider.businessName;
  const findAnother = `/discover?cat=${encodeURIComponent(v.provider.categoryId)}&loc=${encodeURIComponent(v.town.id)}`;
  const price = v.agreedPrice === null ? null : `Agreed price: ${formatLkr(v.agreedPrice)}`;
  const reasonLine = v.reason ? [`Reason: ${v.reason}`] : [];
  const base = {
    agreedPrice: null,
    showContact: false,
    showCancel: false,
    showReview: false,
    findAnotherHref: null,
  };
  switch (v.status) {
    case 'pending':
      return {
        ...base,
        title: `Waiting for ${b} to reply`,
        lines: [
          `They have until ${formatDeadline(v.expiresAt)} to accept or decline. We'll email you either way.`,
        ],
        showCancel: v.canCancel,
      };
    case 'accepted':
      return {
        ...base,
        title: `${b} accepted your request`,
        lines: [
          v.canCancel
            ? `You can cancel until 11:59 PM on ${formatCancelCutoffDay(v.preferredDate)}.`
            : `It's too late to cancel online. Contact ${b} directly.`,
        ],
        agreedPrice: price,
        showContact: true,
        showCancel: v.canCancel,
      };
    case 'completed':
      return {
        ...base,
        title: `Job completed on ${formatDateLong(v.completedAt ?? v.updatedAt)}`,
        lines: [],
        agreedPrice: price,
        showContact: true,
        showReview: true,
      };
    case 'declined':
      return {
        ...base,
        title: `${b} declined this request`,
        lines: v.closedBy === 'system' ? [PROVIDER_UNAVAILABLE] : reasonLine,
        findAnotherHref: findAnother,
      };
    case 'cancelled':
      if (v.closedBy === 'admin')
        return {
          ...base,
          title: 'Fixit cancelled this request',
          lines: reasonLine,
          findAnotherHref: findAnother,
        };
      if (v.closedBy === 'system')
        return {
          ...base,
          title: 'This request was cancelled',
          lines: [PROVIDER_UNAVAILABLE],
          findAnotherHref: findAnother,
        };
      return {
        ...base,
        title: 'You cancelled this request',
        lines: reasonLine,
        findAnotherHref: findAnother,
      };
    case 'expired':
      return {
        ...base,
        title: 'This request expired',
        lines: [`${b} didn't reply in time.`],
        findAnotherHref: findAnother,
      };
  }
}
