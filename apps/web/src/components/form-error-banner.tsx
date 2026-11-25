import { useEffect, useRef, type ReactNode } from 'react';
import { NoticeBanner } from './notice-banner';

/** SPEC §6.3 / S5.E8: danger banner at the top of a form, announced and scrolled into view when it appears. */
export function FormErrorBanner({
  children,
  variant = 'danger',
}: {
  children: ReactNode;
  variant?: 'danger' | 'info';
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // jsdom has no scrollIntoView, hence the optional call through a widened type
    const node: { scrollIntoView?: HTMLElement['scrollIntoView'] } | null = ref.current;
    node?.scrollIntoView?.({ block: 'nearest' });
  }, [children]);
  return (
    <div ref={ref} role={variant === 'danger' ? 'alert' : 'status'}>
      <NoticeBanner variant={variant}>{children}</NoticeBanner>
    </div>
  );
}
