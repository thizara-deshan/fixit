import { useEffect, useState } from 'react';

/** True only once `flag` has stayed true for `delayMs` (no skeleton flash on fast loads). */
export function useDelayedFlag(flag: boolean, delayMs = 150): boolean {
  const [elapsed, setElapsed] = useState(false);
  useEffect(() => {
    if (!flag) {
      setElapsed(false);
      return;
    }
    const t = setTimeout(() => {
      setElapsed(true);
    }, delayMs);
    return () => {
      clearTimeout(t);
    };
  }, [flag, delayMs]);
  return flag && elapsed;
}
