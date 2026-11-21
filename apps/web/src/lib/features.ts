/** Should/Could features stay hidden until their milestone flips the flag (CLAUDE.md, ARCHITECTURE §5.1). */
export type FeatureFlag =
  | 'savedProviders' // F-10
  | 'checklist' // F-21
  | 'pause' // F-22
  | 'replies' // F-23
  | 'providerReviews' // F-24
  | 'adminCatalog' // F-34
  | 'adminRequests' // F-35
  | 'metrics'; // F-36

export const features: Readonly<Record<FeatureFlag, boolean>> = {
  savedProviders: false,
  checklist: false,
  pause: false,
  replies: false,
  providerReviews: false,
  adminCatalog: false,
  adminRequests: false,
  metrics: false,
};
