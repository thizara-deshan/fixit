import {
  Drill,
  Hammer,
  PaintRoller,
  SprayCan,
  Sprout,
  WashingMachine,
  Wrench,
  Zap,
  type LucideIcon,
  type LucideProps,
} from 'lucide-react';
import type { CategoryIcon as CategoryIconName } from '@fixit/contracts';

export const CATEGORY_ICONS: Record<CategoryIconName, LucideIcon> = {
  wrench: Wrench,
  zap: Zap,
  'spray-can': SprayCan,
  sprout: Sprout,
  'paint-roller': PaintRoller,
  hammer: Hammer,
  drill: Drill,
  'washing-machine': WashingMachine,
};

/** Decorative category icon (SPEC §2.10). */
export function CategoryIcon({ icon, ...props }: { icon: CategoryIconName } & LucideProps) {
  const Icon = CATEGORY_ICONS[icon];
  return <Icon aria-hidden="true" {...props} />;
}
