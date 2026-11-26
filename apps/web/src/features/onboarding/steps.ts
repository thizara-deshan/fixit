/** SPEC S19 step table. Index = step − 1. */
export const STEPS = [
  { title: 'Business details', sub: 'This is what customers see first.' },
  { title: 'Category', sub: 'Choose the one category that fits your work best.' },
  {
    title: 'Services & prices',
    sub: 'Add the services you offer. Your lowest price shows as "Starting at".',
  },
  { title: 'Service areas', sub: 'Where do you work? Customers in these towns can find you.' },
  { title: 'Profile photo', sub: 'A clear photo of you or your logo builds trust.' },
] as const;
export type WizardStep = 1 | 2 | 3 | 4 | 5;
