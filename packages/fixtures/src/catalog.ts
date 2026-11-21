import type { FxCategory, FxDistrict, FxTown } from './types';

export const CATEGORIES: readonly FxCategory[] = [
  {
    id: 'plumbing',
    name: 'Plumbing',
    blurb: 'Leaks, drains, water heaters',
    icon: 'wrench',
    order: 1,
    active: true,
  },
  {
    id: 'electrical',
    name: 'Electrical',
    blurb: 'Wiring, lighting, panels',
    icon: 'zap',
    order: 2,
    active: true,
  },
  {
    id: 'cleaning',
    name: 'Cleaning',
    blurb: 'Regular, deep & move-out cleans',
    icon: 'spray-can',
    order: 3,
    active: true,
  },
  {
    id: 'gardening',
    name: 'Gardening',
    blurb: 'Lawns, hedges, planting',
    icon: 'sprout',
    order: 4,
    active: true,
  },
  {
    id: 'painting',
    name: 'Painting & Decorating',
    blurb: 'Interior, exterior, wallpaper',
    icon: 'paint-roller',
    order: 5,
    active: true,
  },
  {
    id: 'carpentry',
    name: 'Carpentry',
    blurb: 'Custom builds, doors, decks',
    icon: 'hammer',
    order: 6,
    active: true,
  },
  {
    id: 'handyman',
    name: 'Handyman',
    blurb: 'Small jobs, mounting, repairs',
    icon: 'drill',
    order: 7,
    active: true,
  },
  {
    id: 'appliance',
    name: 'Appliance Repair',
    blurb: 'Washers, fridges, ovens',
    icon: 'washing-machine',
    order: 8,
    active: true,
  },
];

export const DISTRICTS: readonly FxDistrict[] = [
  { id: 'colombo', name: 'Colombo', order: 1 },
  { id: 'gampaha', name: 'Gampaha', order: 2 },
  { id: 'kalutara', name: 'Kalutara', order: 3 },
];

const TOWN_NAMES: Record<string, readonly string[]> = {
  colombo: [
    'Colombo',
    'Dehiwala-Mount Lavinia',
    'Sri Jayawardenepura Kotte',
    'Moratuwa',
    'Maharagama',
    'Kaduwela',
    'Homagama',
    'Kesbewa',
  ],
  gampaha: ['Negombo', 'Gampaha', 'Ja-Ela', 'Wattala', 'Kelaniya', 'Kadawatha'],
  kalutara: ['Panadura', 'Kalutara', 'Horana', 'Beruwala'],
};

/** "Sri Jayawardenepura Kotte" → "sri-jayawardenepura-kotte" */
export const toTownId = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export const TOWNS: readonly FxTown[] = DISTRICTS.flatMap((d) =>
  (TOWN_NAMES[d.id] ?? []).map((name, i) => ({
    id: toTownId(name),
    name,
    districtId: d.id,
    order: i + 1,
    active: true,
  })),
);

/** ARCH §8.3 localisation table: prototype location → base town id. */
export const PROTOTYPE_LOCATION_TO_TOWN = {
  austin: 'colombo',
  'round-rock': 'dehiwala-mount-lavinia',
  'cedar-park': 'sri-jayawardenepura-kotte',
  pflugerville: 'maharagama',
} as const;
