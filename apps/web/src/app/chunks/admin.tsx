import { PlaceholderScreen } from '../placeholder-screen';

export { AdminOverviewPage } from '@/features/admin/pages/overview-page';
export { VerificationQueuePage } from '@/features/admin/pages/verification-queue-page';
export { VerificationReviewPage } from '@/features/admin/pages/verification-review-page';
export { UsersPage } from '@/features/admin/pages/users-page';
export { UserDetailPage } from '@/features/admin/pages/user-detail-page';
export { ReviewsModerationPage } from '@/features/admin/pages/reviews-moderation-page';

export function AdminRequestsPage() {
  return <PlaceholderScreen frame="bare" title="All requests" />;
}

export function AdminRequestPage() {
  return <PlaceholderScreen frame="bare" title="Request detail" />;
}

export function CatalogPage() {
  return <PlaceholderScreen frame="bare" title="Categories & towns" />;
}
