import { Outlet } from 'react-router';
import { SegmentedTabLinks } from '@/components/segmented-tabs';
import { customerTabs } from './nav-config';

/** L2 main area (inside PublicLayout). */
export function CustomerLayout() {
  return (
    <div className="max-w-content sm:pb-22 mx-auto flex w-full flex-col gap-6 px-4 pb-14 pt-5 sm:px-6 sm:pt-8 lg:px-8">
      <Outlet />
    </div>
  );
}

/** L2 page header: H1 + subtitle + section tabs (list pages). Detail pages render a BackLink instead of tabs. */
export function CustomerPageHeader({
  title,
  subtitle,
  tabs = false,
}: {
  title: string;
  subtitle?: string;
  tabs?: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-title-lg text-text">{title}</h1>
        {subtitle && <p className="text-body-sm text-text-muted">{subtitle}</p>}
      </div>
      {tabs && <SegmentedTabLinks label="Account sections" items={customerTabs()} />}
    </div>
  );
}
