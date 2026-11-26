import { PlaceholderScreen } from '../placeholder-screen';

export { ProviderOverviewPage } from '@/features/provider-dashboard/pages/overview-page';

export { ProviderRequestsPage } from '@/features/provider-dashboard/pages/requests-page';

export { ProviderRequestPage } from '@/features/provider-dashboard/pages/request-page';

export function ServicesPage() {
  return <PlaceholderScreen frame="bare" title="My Services" />;
}

export function BusinessProfilePage() {
  return <PlaceholderScreen frame="bare" title="Business profile" />;
}

export function ServiceAreasPage() {
  return <PlaceholderScreen frame="bare" title="Service areas" />;
}

export { VerificationPage } from '@/features/provider-business/pages/verification-page';

export function ProviderReviewsPage() {
  return <PlaceholderScreen frame="bare" title="Reviews" />;
}

export function ProviderSettingsPage() {
  return <PlaceholderScreen frame="bare" title="Settings" />;
}
