import { act } from '@testing-library/react';

type Listener = (event: MediaQueryListEvent) => void;
interface Entry {
  query: string;
  last: boolean;
  listeners: Set<Listener>;
}

let width = 1440;
const entries = new Set<Entry>();

/** Supports `(min-width: Npx)` and `(max-width: Npx)`, joined with `and`. */
function evaluate(query: string, w: number): boolean {
  const re = /\((min|max)-width:\s*(\d+(?:\.\d+)?)px\)/g;
  let found = false;
  let ok = true;
  for (let m = re.exec(query); m !== null; m = re.exec(query)) {
    found = true;
    const v = Number(m[2]);
    ok = ok && (m[1] === 'min' ? w >= v : w <= v);
  }
  return found && ok;
}

/** Called from setup.ts before each test: viewport 1440 and no listeners. */
export function installMatchMedia(): void {
  width = 1440;
  entries.clear();
  window.matchMedia = (query: string): MediaQueryList => {
    const entry: Entry = { query, last: evaluate(query, width), listeners: new Set() };
    entries.add(entry);
    const list = {
      media: query,
      onchange: null,
      get matches() {
        return evaluate(query, width);
      },
      addEventListener: (_type: string, l: Listener) => entry.listeners.add(l),
      removeEventListener: (_type: string, l: Listener) => entry.listeners.delete(l),
      addListener: (l: Listener) => entry.listeners.add(l),
      removeListener: (l: Listener) => entry.listeners.delete(l),
      dispatchEvent: () => true,
    };
    return list as unknown as MediaQueryList;
  };
}

/** Changes the simulated viewport and fires `change` on every query whose result flipped. */
export function setViewportWidth(next: number): void {
  act(() => {
    width = next;
    for (const e of entries) {
      const now = evaluate(e.query, width);
      if (now === e.last) continue;
      e.last = now;
      for (const l of e.listeners) l({ matches: now, media: e.query } as MediaQueryListEvent);
    }
  });
}
