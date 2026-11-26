import { useEffect, useRef, useSyncExternalStore } from 'react';

export const ROW_FLASH_MS = 900; // SPEC §2.8

let snapshot: ReadonlySet<string> = new Set();
const listeners = new Set<() => void>();
const emit = (next: ReadonlySet<string>) => {
  snapshot = next;
  for (const l of listeners) l();
};

/** Marks a row (by ref) as flashing for 900 ms. */
export function flashRow(key: string): void {
  emit(new Set([...snapshot, key]));
  setTimeout(() => {
    emit(new Set([...snapshot].filter((k) => k !== key)));
  }, ROW_FLASH_MS);
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

/** The refs flashing right now. */
export const useFlashingRows = (): ReadonlySet<string> => useSyncExternalStore(subscribe, () => snapshot);

/** D-7 / SPEC §6.11: flash every row whose status changed since this list last rendered it. */
export function useFlashOnStatusChange(rows: readonly { ref: string; status: string }[]): void {
  const last = useRef(new Map<string, string>());
  useEffect(() => {
    for (const r of rows) {
      const prev = last.current.get(r.ref);
      if (prev !== undefined && prev !== r.status) flashRow(r.ref);
      last.current.set(r.ref, r.status);
    }
  }, [rows]);
}
