import { CustomerPageHeader } from '../layouts/customer-layout';

export { RequestFormPage } from '@/features/requests/pages/request-form-page';
export { RequestSentPage } from '@/features/requests/pages/request-sent-page';
export { MyRequestsPage } from '@/features/requests/pages/my-requests-page';
export function SavedPage() {
  return <CustomerPageHeader title="Saved providers" tabs />;
}
export { AccountPage } from '@/features/account/pages/account-page';
export { CustomerRequestPage } from '@/features/requests/pages/customer-request-page';
export { LeaveReviewPage } from '@/features/requests/pages/leave-review-page';
