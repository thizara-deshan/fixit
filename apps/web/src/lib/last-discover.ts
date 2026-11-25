const KEY = 'fixit.lastDiscover';

/** Called by Discover on every URL change. `search` is `location.search` ('' or '?…'). */
export function rememberDiscover(search: string): void {
  try {
    sessionStorage.setItem(KEY, `/discover${search}`);
  } catch {
    // storage disabled: back links fall back to /discover
  }
}

/** For S3 "Back to results" and S13 "Back to search". */
export function lastDiscoverUrl(): string {
  try {
    const v = sessionStorage.getItem(KEY);
    return v?.startsWith('/discover') ? v : '/discover';
  } catch {
    return '/discover';
  }
}
