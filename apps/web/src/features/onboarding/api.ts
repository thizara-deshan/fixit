import { ENDPOINTS as E, type OwnProvider } from '@fixit/contracts';
import type {
  OnboardingStep1Body,
  OnboardingStep2Body,
  OnboardingStep3Body,
  OnboardingStep4Body,
} from '@fixit/contracts';
import { http, pathOf } from '@/lib/http';

export type StepBody =
  | { step: 1; body: OnboardingStep1Body }
  | { step: 2; body: OnboardingStep2Body }
  | { step: 3; body: OnboardingStep3Body }
  | { step: 4; body: OnboardingStep4Body };

export const saveStep = ({ step, body }: StepBody): Promise<OwnProvider> =>
  http(pathOf(E.provider_onboarding_save, { step: String(step) }), {
    method: 'PUT',
    body,
    schema: E.provider_onboarding_save.response,
  });

export const publishListing = (): Promise<OwnProvider> =>
  http(pathOf(E.provider_publish), { method: 'POST', schema: E.provider_publish.response });
