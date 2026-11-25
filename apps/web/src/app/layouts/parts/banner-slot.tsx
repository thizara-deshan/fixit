import type { ReactNode } from 'react';

/** SPEC §6.8: at most 2 banners, already in priority order. Rules arrive in M04/M11; layouts pass [] for now. */
export function BannerSlot({
  banners,
  placement,
}: {
  banners: readonly ReactNode[];
  placement: 'strip' | 'main';
}) {
  const shown = banners.slice(0, 2);
  if (shown.length === 0) return null;
  if (placement === 'main') return <div className="flex flex-col gap-2">{shown}</div>;
  return (
    <div className="border-border bg-surface border-b">
      <div className="max-w-content mx-auto flex flex-col gap-2 px-4 py-3 sm:px-6 lg:px-8">{shown}</div>
    </div>
  );
}
