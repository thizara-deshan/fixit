import { Button } from '@/components/ui/button';
import { FilterGroups, type FilterGroupsProps } from './filter-groups';

export function FilterPanel(props: FilterGroupsProps & { onClearAll: () => void }) {
  const { onClearAll, ...groups } = props;
  return (
    <aside
      aria-label="Filters"
      className="border-border bg-surface sticky top-24 hidden flex-col gap-6 self-start rounded-2xl border p-6 lg:flex"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lead text-text font-extrabold">Filters</h2>
        <Button variant="link" size="inline" onClick={onClearAll}>
          Clear all
        </Button>
      </div>
      <FilterGroups {...groups} />
    </aside>
  );
}
