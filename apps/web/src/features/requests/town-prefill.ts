/** S12: the Discover `loc` if the provider serves it, else empty (no choice). */
export function initialTownId(areas: readonly { id: string }[], loc: string | null): string {
  return loc !== null && areas.some((a) => a.id === loc) ? loc : '';
}
