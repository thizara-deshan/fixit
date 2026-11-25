import { useParams } from 'react-router';
import { NotFoundPage } from '@/app/errors/not-found-page';
import { BackLink } from '@/components/back-link';
import { LoadingRegion } from '@/components/loading-region';
import { ApiError } from '@/lib/http';
import { lastDiscoverUrl } from '@/lib/last-discover';
import { useBodyClass } from '@/lib/use-body-class';
import { ProfileHeader } from '../components/profile-header';
import { ProfileSkeleton } from '../components/profile-skeleton';
import { AboutSection, ServiceAreaSection, ServicesSection } from '../components/profile-sections';
import { ReviewsSection } from '../components/reviews-section';
import { StickyRequestBar } from '../components/sticky-request-bar';
import { useProviderProfile, useRequestAction } from '../hooks';

/** S3. */
export function ProviderProfilePage() {
  const { id = '' } = useParams();
  const profile = useProviderProfile(id);
  const action = useRequestAction(profile.data);
  useBodyClass(profile.data ? 'pb-36 sm:pb-0' : '');
  if (profile.isError) {
    if (profile.error instanceof ApiError && profile.error.status === 404) {
      return <NotFoundPage variant="provider" />;
    }
    throw profile.error; // S41 via the route boundary
  }
  const p = profile.data;
  return (
    <div className="max-w-content lg:pb-22 mx-auto flex w-full flex-col gap-6 px-4 pb-14 pt-6 sm:px-6 lg:px-8">
      <BackLink to={lastDiscoverUrl()}>Back to results</BackLink>
      <LoadingRegion loading={!p} skeleton={<ProfileSkeleton />}>
        {p && (
          <>
            <ProfileHeader profile={p} action={action} />
            <div className="mt-6 flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
              <AboutSection bio={p.bio} className="order-1 lg:order-none lg:col-start-1 lg:row-start-1" />
              <ServicesSection
                services={p.services}
                className="order-2 lg:order-none lg:col-start-1 lg:row-start-2"
              />
              <ReviewsSection
                providerId={p.id}
                businessName={p.businessName}
                rating={p.rating}
                reviewCount={p.reviewCount}
                className="order-4 sm:order-3 lg:order-none lg:col-start-1 lg:row-start-3"
              />
              <ServiceAreaSection
                areas={p.areas}
                className="order-3 sm:order-4 lg:sticky lg:top-24 lg:order-none lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:self-start"
              />
            </div>
            <StickyRequestBar profile={p} action={action} />
          </>
        )}
      </LoadingRegion>
    </div>
  );
}
