import type { WizardStep } from './steps';

/** D-2. Returns the step to render; if it differs from the URL, the page redirects there. */
export function resolveStep(raw: string | undefined, saved: number, fromWizard: boolean): WizardStep {
  const savedStep = Math.min(5, Math.max(1, Math.trunc(saved))) as WizardStep;
  const n = raw !== undefined && /^[1-5]$/.test(raw) ? (Number(raw) as WizardStep) : null;
  if (n === null || !fromWizard) return savedStep;
  return n <= savedStep ? n : savedStep;
}
