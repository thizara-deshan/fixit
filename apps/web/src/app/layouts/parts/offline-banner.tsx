import { useOnlineStatus } from '@/lib/use-online-status';

export function OfflineBanner() {
  const online = useOnlineStatus();
  return (
    <div role="status" aria-live="polite">
      {!online && (
        <p className="bg-warning-soft text-label text-warning-text-strong px-4 py-2 text-center font-semibold">
          You&apos;re offline. Some things won&apos;t work until you reconnect.
        </p>
      )}
    </div>
  );
}
