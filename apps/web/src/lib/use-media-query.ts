import { useCallback, useSyncExternalStore } from 'react';

/** The only two breakpoints (SPEC §2.7, ARCH §5.2). */
export const MQ = { sm: '(min-width: 641px)', lg: '(min-width: 1024px)' } as const;

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => {
        list.removeEventListener('change', onChange);
      };
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
