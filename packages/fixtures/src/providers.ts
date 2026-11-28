import type { PriceUnit, VerificationStatus } from '@fixit/contracts';
import type { FxArea, FxDocument, FxProvider, FxService, FxSubmission } from './types';

const DAY = 86_400_000;

interface ProviderSeed {
  id: string;
  ownerId: string;
  businessName: string;
  categoryId: string;
  baseTownId: string;
  years: number;
  verification: VerificationStatus;
  paused?: boolean;
  bio: string;
  services: readonly (readonly [name: string, price: number, unit: PriceUnit])[];
  otherTowns: readonly string[];
}

export const PROVIDER_SEEDS: readonly ProviderSeed[] = [
  {
    id: 'p01',
    ownerId: 'u-marcus',
    businessName: 'Bell & Sons Plumbing',
    categoryId: 'plumbing',
    baseTownId: 'colombo',
    years: 14,
    verification: 'verified',
    bio: 'Family-run plumbing business serving Colombo for over a decade. Upfront pricing, same-day call-outs and tidy work.',
    services: [
      ['Leak repair', 2500, 'per_hour'],
      ['Drain unclogging', 3000, 'per_hour'],
      ['Water heater install', 13500, 'fixed'],
      ['Fixture replacement', 3500, 'per_hour'],
      ['Emergency call-outs', 4500, 'per_visit'],
    ],
    otherTowns: ['maharagama', 'dehiwala-mount-lavinia', 'moratuwa', 'kesbewa'],
  },
  {
    id: 'p02',
    ownerId: 'u-dana',
    businessName: 'FlowRight Plumbing',
    categoryId: 'plumbing',
    baseTownId: 'dehiwala-mount-lavinia',
    years: 6,
    verification: 'pending_review',
    bio: 'Independent plumber focused on residential repairs and bathroom refits. Friendly, careful and affordable.',
    services: [
      ['Toilet repair', 2000, 'per_hour'],
      ['Faucet install', 3500, 'per_hour'],
      ['Garbage disposal', 5000, 'per_hour'],
      ['Bathroom refits', 54000, 'fixed'],
    ],
    otherTowns: ['maharagama', 'sri-jayawardenepura-kotte', 'moratuwa'],
  },
  {
    id: 'p03',
    ownerId: 'u-priya',
    businessName: 'BrightSpark Electric',
    categoryId: 'electrical',
    baseTownId: 'sri-jayawardenepura-kotte',
    years: 11,
    verification: 'verified',
    bio: 'Licensed master electrician. From a single outlet to full panel upgrades, done safely and to code.',
    services: [
      ['Outlet & switch install', 3000, 'per_hour'],
      ['Lighting fixtures', 3500, 'per_hour'],
      ['Panel upgrades', 42000, 'fixed'],
      ['EV charger install', 19500, 'fixed'],
      ['Safety inspections', 4000, 'per_hour'],
    ],
    otherTowns: ['dehiwala-mount-lavinia', 'colombo', 'kaduwela', 'kelaniya'],
  },
  {
    id: 'p04',
    ownerId: 'u-alicia',
    businessName: 'Fresh Nest Cleaning',
    categoryId: 'cleaning',
    baseTownId: 'colombo',
    years: 8,
    verification: 'verified',
    bio: 'A small, trusted team offering eco-friendly home cleaning. Weekly, bi-weekly or one-off deep cleans.',
    services: [
      ['Regular cleaning', 2000, 'per_visit'],
      ['Deep cleaning', 4000, 'per_visit'],
      ['Move-in / move-out', 6500, 'per_visit'],
      ['Oven & fridge cleaning', 1500, 'per_visit'],
    ],
    otherTowns: ['maharagama', 'wattala', 'kelaniya'],
  },
  {
    id: 'p05',
    ownerId: 'u-tom',
    businessName: 'GreenLeaf Gardens',
    categoryId: 'gardening',
    baseTownId: 'maharagama',
    years: 9,
    verification: 'verified',
    bio: 'Garden care and landscaping for the Western Province climate. Drought-friendly planting is our specialty.',
    services: [
      ['Lawn mowing', 1500, 'per_hour'],
      ['Hedge trimming', 2000, 'per_hour'],
      ['Planting & mulching', 2500, 'per_hour'],
      ['Seasonal clean-ups', 4500, 'per_hour'],
      ['Irrigation checks', 1500, 'per_hour'],
    ],
    otherTowns: ['dehiwala-mount-lavinia', 'colombo', 'homagama'],
  },
  {
    id: 'p06',
    ownerId: 'u-jamal',
    businessName: 'True Coat Painting',
    categoryId: 'painting',
    baseTownId: 'dehiwala-mount-lavinia',
    years: 12,
    verification: 'verified',
    bio: 'Interior and exterior painting with clean lines and careful prep. Furniture covered, floors protected.',
    services: [
      ['Interior painting', 1500, 'per_hour'],
      ['Exterior painting', 2000, 'per_hour'],
      ['Cabinet refinishing', 27000, 'fixed'],
      ['Wallpaper removal', 1500, 'per_hour'],
    ],
    otherTowns: ['sri-jayawardenepura-kotte', 'maharagama', 'colombo', 'moratuwa'],
  },
  {
    id: 'p07',
    ownerId: 'u-lena',
    businessName: 'Oak & Iron Carpentry',
    categoryId: 'carpentry',
    baseTownId: 'sri-jayawardenepura-kotte',
    years: 17,
    verification: 'verified',
    bio: 'Custom woodwork and repairs by a craftsperson with 17 years at the bench. Built to last.',
    services: [
      ['Custom shelving', 2500, 'per_hour'],
      ['Door hanging & repair', 2500, 'per_hour'],
      ['Deck building', 75000, 'fixed'],
      ['Trim & molding', 2500, 'per_hour'],
      ['Furniture repair', 2500, 'per_hour'],
    ],
    otherTowns: ['colombo', 'kaduwela', 'gampaha'],
  },
  {
    id: 'p08',
    ownerId: 'u-hank',
    businessName: 'HandyHank Home Repairs',
    categoryId: 'handyman',
    baseTownId: 'colombo',
    years: 4,
    verification: 'not_submitted',
    bio: 'No job too small. TV mounting, flat-pack assembly, minor repairs and odd jobs around the house.',
    services: [
      ['TV mounting', 1500, 'per_hour'],
      ['Furniture assembly', 1500, 'per_hour'],
      ['Drywall patching', 2000, 'per_hour'],
      ['Picture hanging', 1500, 'per_hour'],
      ['Minor repairs', 1500, 'per_hour'],
    ],
    otherTowns: ['wattala', 'ja-ela'],
  },
  {
    id: 'p09',
    ownerId: 'u-kevin',
    businessName: 'ApplianceDoc',
    categoryId: 'appliance',
    baseTownId: 'maharagama',
    years: 10,
    verification: 'verified',
    bio: 'Factory-trained technician repairing all major brands. Most parts carried in the van for first-visit fixes.',
    services: [
      ['Washer & dryer repair', 2500, 'per_visit'],
      ['Refrigerator repair', 3000, 'per_visit'],
      ['Oven & stove repair', 3000, 'per_visit'],
      ['Dishwasher repair', 2500, 'per_visit'],
    ],
    otherTowns: ['dehiwala-mount-lavinia', 'colombo', 'sri-jayawardenepura-kotte', 'homagama', 'kadawatha'],
  },
  {
    id: 'p10',
    ownerId: 'u-grace',
    businessName: 'Sparkle & Shine Cleaners',
    categoryId: 'cleaning',
    baseTownId: 'sri-jayawardenepura-kotte',
    years: 3,
    verification: 'rejected',
    bio: 'New, energetic cleaning service with flexible evening and weekend slots.',
    services: [
      ['Regular cleaning', 1500, 'per_visit'],
      ['Apartment cleaning', 1500, 'per_visit'],
      ['Post-party clean-up', 2500, 'per_visit'],
      ['Laundry & ironing', 1000, 'per_visit'],
    ],
    otherTowns: ['dehiwala-mount-lavinia', 'negombo', 'ja-ela'],
  },
  {
    id: 'p12',
    ownerId: 'u-chathura',
    businessName: 'Ranasinghe Garden Care',
    categoryId: 'gardening',
    baseTownId: 'homagama',
    years: 2,
    verification: 'not_submitted',
    bio: 'New garden care service for lawns, hedges and small landscaping jobs around Homagama.',
    services: [
      ['Lawn mowing', 2000, 'per_visit'],
      ['Hedge trimming', 1500, 'per_hour'],
      ['Garden clean-up', 6000, 'fixed'],
    ],
    otherTowns: ['maharagama', 'kesbewa'],
  },
  {
    id: 'p13',
    ownerId: 'u-nadeesha',
    businessName: 'Lanka Paint Works',
    categoryId: 'painting',
    baseTownId: 'negombo',
    years: 9,
    verification: 'verified',
    paused: true,
    bio: 'Interior and exterior painting with careful preparation and clean finishes.',
    services: [
      ['Interior painting', 2500, 'per_hour'],
      ['Exterior painting', 3000, 'per_hour'],
      ['Single room repaint', 25000, 'fixed'],
    ],
    otherTowns: ['ja-ela', 'kadawatha'],
  },
  {
    id: 'p14',
    ownerId: 'u-ruwan',
    businessName: 'Jayasekara Carpentry',
    categoryId: 'carpentry',
    baseTownId: 'moratuwa',
    years: 11,
    verification: 'verified',
    bio: 'Custom furniture, doors and window frames.',
    services: [
      ['Door repair', 2500, 'per_hour'],
      ['Custom shelving', 18000, 'fixed'],
    ],
    otherTowns: ['colombo', 'kesbewa'],
  },
];

export const serviceId = (providerId: string, index: number): string => `${providerId}-s${String(index + 1)}`;

export function buildProviders(now: Date): {
  providers: FxProvider[];
  services: FxService[];
  areas: FxArea[];
  submissions: FxSubmission[];
  documents: FxDocument[];
} {
  const ago = (days: number) => new Date(now.getTime() - days * DAY).toISOString();
  const providers: FxProvider[] = PROVIDER_SEEDS.map((s) => ({
    id: s.id,
    userId: s.ownerId,
    businessName: s.businessName,
    bio: s.bio,
    yearsExperience: s.years,
    categoryId: s.categoryId,
    baseTownId: s.baseTownId,
    photoKey: null,
    onboardingStep: 5,
    onboardingComplete: true,
    publishedAt: ago(380),
    verificationStatus: s.verification,
    verifiedAt: s.verification === 'verified' ? ago(370) : null,
    reverificationReason: null,
    paused: s.paused ?? false,
    ratingAvg: null,
    reviewCount: 0,
    startingPrice: null,
    startingUnit: null, // computed in buildWorld
    createdAt: ago(390),
  }));
  // Kasun Silva: draft, steps 1–2 done, on step 3 (services). Not published → roles stay ['customer'].
  providers.push({
    id: 'p11',
    userId: 'u-kasun',
    businessName: 'Silva Electricals',
    bio: 'Electrician in Kaduwela for small home jobs: rewiring, ceiling fans and switch boards.',
    yearsExperience: 5,
    categoryId: 'electrical',
    baseTownId: null,
    photoKey: null,
    onboardingStep: 3,
    onboardingComplete: false,
    publishedAt: null,
    verificationStatus: 'not_submitted',
    verifiedAt: null,
    reverificationReason: null,
    paused: false,
    ratingAvg: null,
    reviewCount: 0,
    startingPrice: null,
    startingUnit: null,
    createdAt: ago(3),
  });
  const services: FxService[] = PROVIDER_SEEDS.flatMap((s) =>
    s.services.map(([name, price, unit], i) => ({
      id: serviceId(s.id, i),
      providerId: s.id,
      name,
      price,
      unit,
    })),
  );
  const areas: FxArea[] = PROVIDER_SEEDS.flatMap((s) => [
    { providerId: s.id, townId: s.baseTownId, isBase: true },
    ...[...s.otherTowns].sort().map((townId) => ({ providerId: s.id, townId, isBase: false })),
  ]);
  const submissions: FxSubmission[] = [
    {
      id: 's-p01-1',
      providerId: 'p01',
      attempt: 1,
      trigger: 'provider',
      status: 'approved',
      submittedAt: ago(372),
      decidedAt: ago(370),
      rejectionReason: null,
    },
    {
      id: 's-p02-1',
      providerId: 'p02',
      attempt: 1,
      trigger: 'provider',
      status: 'pending_review',
      submittedAt: ago(1),
      decidedAt: null,
      rejectionReason: null,
    },
    {
      id: 's-p10-1',
      providerId: 'p10',
      attempt: 1,
      trigger: 'provider',
      status: 'rejected',
      submittedAt: ago(4),
      decidedAt: ago(2),
      rejectionReason: 'The photo of the back of your NIC is blurry. Upload a clearer photo.',
    },
  ];
  const documents: FxDocument[] = [
    ...(['nic_front', 'nic_back'] as const).map((type) => ({
      id: `d-p01-${type}`,
      providerId: 'p01',
      submissionId: 's-p01-1',
      type,
      fileName: type === 'nic_front' ? 'nic-front.jpg' : 'nic-back.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: type === 'nic_front' ? 501_220 : 476_310,
      createdAt: ago(372),
    })),
    {
      id: 'd-p02-nic-front',
      providerId: 'p02',
      submissionId: 's-p02-1',
      type: 'nic_front',
      fileName: 'nic-front.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 482_113,
      createdAt: ago(1),
    },
    {
      id: 'd-p02-nic-back',
      providerId: 'p02',
      submissionId: 's-p02-1',
      type: 'nic_back',
      fileName: 'nic-back.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 455_902,
      createdAt: ago(1),
    },
    ...(['nic_front', 'nic_back'] as const).flatMap((type) => {
      const base = { providerId: 'p10', type, mimeType: 'image/jpeg', createdAt: ago(4) };
      const fileName = type === 'nic_front' ? 'nic-front.jpg' : 'nic-back.jpg';
      const sizeBytes = type === 'nic_front' ? 512_004 : 398_771;
      return [
        { ...base, id: `d-p10-${type}`, submissionId: 's-p10-1', fileName, sizeBytes },
        { ...base, id: `d-p10-${type}-r`, submissionId: null, fileName, sizeBytes, createdAt: ago(2) },
      ];
    }),
  ];
  return { providers, services, areas, submissions, documents };
}
