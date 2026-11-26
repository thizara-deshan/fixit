import { BackLink } from '@/components/back-link';
import { CustomerPageHeader } from '../layouts/customer-layout';
import { PlaceholderScreen } from '../placeholder-screen';

export { RequestFormPage } from '@/features/requests/pages/request-form-page';
export { RequestSentPage } from '@/features/requests/pages/request-sent-page';
export { MyRequestsPage } from '@/features/requests/pages/my-requests-page';
export function SavedPage() {
  return <CustomerPageHeader title="Saved providers" tabs />;
}
export { AccountPage } from '@/features/account/pages/account-page';
export function CustomerRequestPage() {
  return (
    <>
      <BackLink to="/requests">Back to my requests</BackLink>
      <PlaceholderScreen frame="bare" title="Request detail" />
    </>
  );
}
export function LeaveReviewPage() {
  return (
    <>
      <BackLink to="..">Back to request</BackLink>
      <PlaceholderScreen frame="bare" title="Leave a review" />
    </>
  );
}
