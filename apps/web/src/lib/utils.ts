import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/** Must list every --text-* and --shadow-* name from globals.css @theme. */
const TEXT_SIZES = [
  'display',
  'title-xl',
  'stat',
  'price-xl',
  'title-lg',
  'price-lg',
  'logo',
  'title-md',
  'title-sm',
  'lead',
  'title-xs',
  'body',
  'body-sm',
  'label',
  'meta',
  'caption',
  'mono',
];
const SHADOWS = ['xs', 'knob', 'badge', 'search-sm', 'hover', 'search', 'tooltip', 'float', 'toast', 'modal'];

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: TEXT_SIZES }],
      shadow: [{ shadow: SHADOWS }],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
