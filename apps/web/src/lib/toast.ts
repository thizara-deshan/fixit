import { createElement } from 'react';
import { CircleAlert } from 'lucide-react';
import { toast } from 'sonner';

export const TOAST_MS = 4000; // SPEC §6.5
export const TOAST_WITH_ACTION_MS = 8000;

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export const toastDuration = (action?: ToastAction): number => (action ? TOAST_WITH_ACTION_MS : TOAST_MS);

/** One toast at a time: a new one replaces the old (SPEC §6.5). */
export function notify(message: string, action?: ToastAction): void {
  toast.dismiss();
  toast(message, action ? { duration: toastDuration(action), action } : { duration: toastDuration() });
}

/** SPEC §6.3 "Action failed": leading CircleAlert and an optional `Try again` action. */
export function notifyError(message: string, retry?: () => void): void {
  const icon = createElement(CircleAlert, { className: 'size-4', 'aria-hidden': true });
  const action = retry ? { label: 'Try again', onClick: retry } : undefined;
  toast.dismiss();
  toast(
    message,
    action ? { icon, duration: toastDuration(action), action } : { icon, duration: toastDuration() },
  );
}
