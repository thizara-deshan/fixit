import { SkeletonSectionCard } from '@/components/skeletons';

export function RequestFormSkeleton() {
  return (
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
      <SkeletonSectionCard lines={10} />
      <div className="hidden lg:block">
        <SkeletonSectionCard lines={5} />
      </div>
    </div>
  );
}
