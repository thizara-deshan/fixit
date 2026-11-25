/** S1.E4: `/discover?q={trimmed}&loc={townId}`; empty fields are omitted (D-1: no `cat` here). */
export function homeSearchUrl(input: { q: string; loc: string }): string {
  const params = new URLSearchParams();
  const q = input.q.trim();
  if (q) params.set('q', q);
  if (input.loc) params.set('loc', input.loc);
  const s = params.toString();
  return s ? `/discover?${s}` : '/discover';
}
