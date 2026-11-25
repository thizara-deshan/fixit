import { SkeletonProfileHeader, SkeletonSectionCard } from '@/components/skeletons';

export function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <SkeletonProfileHeader />
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex flex-col gap-6">
          <SkeletonSectionCard lines={3} />
          <SkeletonSectionCard lines={5} />
        </div>
        <SkeletonSectionCard lines={4} />
      </div>
    </div>
  );
}
