import { PlaceholderScreen } from '../placeholder-screen';

export { ProviderOverviewPage } from '@/features/provider-dashboard/pages/overview-page';

export { ProviderRequestsPage } from '@/features/provider-dashboard/pages/requests-page';

export { ProviderRequestPage } from '@/features/provider-dashboard/pages/request-page';

export { ServicesPage } from '@/features/provider-business/pages/services-page';

export { BusinessProfilePage } from '@/features/provider-business/pages/business-profile-page';

export { ServiceAreasPage } from '@/features/provider-business/pages/service-areas-page';

export { VerificationPage } from '@/features/provider-business/pages/verification-page';

export function ProviderReviewsPage() {
  return <PlaceholderScreen frame="bare" title="Reviews" />;
}

export function ProviderSettingsPage() {
  return <PlaceholderScreen frame="bare" title="Settings" />;
}
