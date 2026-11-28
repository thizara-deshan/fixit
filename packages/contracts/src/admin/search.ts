/** S33 (D-7): name, email, business — substring, case-insensitive; mobile when the query is ≥ 3 digits. */
export function matchesUserSearch(
  q: string,
  u: { fullName: string; email: string; mobile: string | null; businessName: string | null },
): boolean {
  const needle = q.trim().toLowerCase();
  if (needle === '') return true;
  const digits = needle.replace(/[\s-]/g, '');
  if (u.mobile && /^\+?\d{3,}$/.test(digits)) {
    const local = u.mobile.replace(/^\+94/, '0'); // +94771234567 → 0771234567
    if (u.mobile.includes(digits) || local.includes(digits)) return true;
  }
  return [u.fullName, u.email, u.businessName ?? ''].some((s) => s.toLowerCase().includes(needle));
}

/** S37: provider business, author full name or review text. */
export function matchesReviewSearch(
  q: string,
  r: { businessName: string; authorName: string; text: string },
): boolean {
  const needle = q.trim().toLowerCase();
  if (needle === '') return true;
  return [r.businessName, r.authorName, r.text].some((s) => s.toLowerCase().includes(needle));
}
