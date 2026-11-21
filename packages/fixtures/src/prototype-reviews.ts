/** Copied from the prototype (data.json). Newest first. */
export const PROTOTYPE_RATINGS = {
  p01: { rating: 4.9, reviewCount: 212 },
  p02: { rating: 4.3, reviewCount: 64 },
  p03: { rating: 4.8, reviewCount: 138 },
  p04: { rating: 4.7, reviewCount: 301 },
  p05: { rating: 4.5, reviewCount: 89 },
  p06: { rating: 4.6, reviewCount: 117 },
  p07: { rating: 4.9, reviewCount: 76 },
  p08: { rating: 3.8, reviewCount: 41 },
  p09: { rating: 4.4, reviewCount: 158 },
  p10: { rating: 4.1, reviewCount: 52 },
} as const;
export type PrototypeProviderId = keyof typeof PROTOTYPE_RATINGS;
export const PROTOTYPE_PROVIDER_IDS = Object.keys(PROTOTYPE_RATINGS) as PrototypeProviderId[];

export interface WrittenReview {
  author: string;
  rating: number;
  text: string;
}
export const WRITTEN_REVIEWS: Record<PrototypeProviderId, readonly WrittenReview[]> = {
  p01: [
    {
      author: 'Sarah K.',
      rating: 5,
      text: 'Arrived within two hours and fixed our burst pipe. Super professional.',
    },
    { author: 'David L.', rating: 5, text: 'Clear quote before starting, no surprises on the bill.' },
    {
      author: 'Monica R.',
      rating: 4,
      text: 'Great work on the water heater. Slightly late but called ahead.',
    },
  ],
  p02: [
    { author: 'Chris P.', rating: 5, text: 'Fixed a running toilet in 20 minutes. Fair price.' },
    { author: 'Hannah W.', rating: 4, text: 'Good job on our new faucet, would book again.' },
    { author: 'Leo M.', rating: 4, text: 'Had to come back for a second visit but sorted it.' },
  ],
  p03: [
    { author: 'Jason T.', rating: 5, text: 'Installed our EV charger quickly and explained everything.' },
    { author: 'Amy G.', rating: 5, text: 'Very knowledgeable, spotted an issue the last guy missed.' },
    { author: 'Robert F.', rating: 4, text: 'Pricey but worth it for peace of mind.' },
  ],
  p04: [
    { author: 'Emily S.', rating: 5, text: 'House has never looked better. Lovely team.' },
    { author: 'Marco D.', rating: 5, text: 'Reliable every two weeks for six months now.' },
    { author: 'Tina B.', rating: 4, text: 'Thorough clean, missed one window but fixed it next visit.' },
  ],
  p05: [
    { author: 'Nina J.', rating: 5, text: 'Transformed our backyard with native plants.' },
    { author: 'Paul H.', rating: 4, text: 'Dependable weekly mowing, good communication.' },
    { author: 'Grace O.', rating: 4, text: 'Nice work, booking took a few days.' },
  ],
  p06: [
    { author: 'Laura V.', rating: 5, text: 'Crisp edges and they cleaned up perfectly.' },
    { author: 'Sam E.', rating: 4, text: 'Kitchen cabinets look brand new.' },
    { author: 'Ivy C.', rating: 5, text: 'Finished a day early. Highly recommend.' },
  ],
  p07: [
    { author: 'Owen R.', rating: 5, text: 'Built-in bookshelves are stunning. True craftsmanship.' },
    { author: 'Rachel N.', rating: 5, text: 'Fixed three sticking doors in one visit.' },
    { author: 'Ben A.', rating: 5, text: 'Our new deck is solid and beautiful.' },
  ],
  p08: [
    { author: 'Kate Y.', rating: 4, text: 'Mounted our TV neatly, good value.' },
    { author: 'Mike Z.', rating: 3, text: 'Job done but arrived an hour late.' },
    { author: 'Sofia L.', rating: 4, text: 'Assembled a whole bedroom set quickly.' },
  ],
  p09: [
    { author: 'Alan W.', rating: 5, text: 'Fridge fixed on the first visit, part was in the van.' },
    { author: 'Joy P.', rating: 4, text: 'Honest diagnosis, saved us buying a new washer.' },
    { author: 'Dev S.', rating: 4, text: 'Good service, call-out fee a little high.' },
  ],
  p10: [
    { author: 'Tyler B.', rating: 4, text: 'Flexible weekend booking was a lifesaver.' },
    { author: 'Megan F.', rating: 5, text: 'Friendly and detailed, apartment sparkled.' },
    { author: 'Luis G.', rating: 3, text: 'Decent clean, a few spots missed.' },
  ],
};
