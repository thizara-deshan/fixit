import { useCallback, useEffect, useState } from 'react';

/** Counts down whole seconds after start(). `label` is "m:ss" (0:59). */
export function useCooldown(seconds: number): { remaining: number; label: string; start: () => void } {
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (endsAt === null) return;
    const id = window.setInterval(() => {
      setNow(Date.now());
    }, 250);
    return () => {
      window.clearInterval(id);
    };
  }, [endsAt]);
  // endsAt is 1 ms short of the full window, so floor() reads (seconds − 1) right after start: "0:59".
  const remaining = endsAt === null ? 0 : Math.max(0, Math.floor((endsAt - now) / 1000));
  const start = useCallback(() => {
    const t = Date.now();
    setNow(t);
    setEndsAt(t + seconds * 1000 - 1);
  }, [seconds]);
  const label = `${String(Math.floor(remaining / 60))}:${String(remaining % 60).padStart(2, '0')}`;
  return { remaining, label, start };
}
