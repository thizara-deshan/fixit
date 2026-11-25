import { Link } from 'react-router';
import type { Category } from '@fixit/contracts';
import { CategoryIcon } from '@/components/category-icon';

export function CategoryCard({ category }: { category: Category }) {
  return (
    <Link
      to={`/discover?cat=${category.id}`}
      className="border-border bg-surface hover:border-primary hover:shadow-hover focus-visible:ring-primary flex h-full flex-col gap-3 rounded-xl border p-4 transition focus-visible:outline-none focus-visible:ring-2 motion-safe:hover:-translate-y-0.5 sm:p-5"
    >
      <span className="bg-primary-soft text-primary grid h-10 w-11 place-items-center rounded-lg sm:h-12 sm:w-[52px]">
        <CategoryIcon icon={category.icon} className="size-6 sm:size-7" />
      </span>
      <span className="text-title-xs text-text">{category.name}</span>
      <span className="text-body-sm text-text-subtle line-clamp-2">{category.blurb}</span>
    </Link>
  );
}
