import { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { MQ, useMediaQuery } from '@/lib/use-media-query';
import { FilterGroups, type FilterGroupsProps } from './filter-groups';
import { showCountLabel } from '../copy';

interface FiltersSheetProps extends FilterGroupsProps {
  badge: number; // appliedFilterCount
  total: number | undefined; // live count; undefined while loading → button shows `Show providers`
  onClearAll: () => void;
}

export function FiltersSheet({ badge, total, onClearAll, ...groups }: FiltersSheetProps) {
  const tablet = useMediaQuery(MQ.sm);
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="secondary" className="h-11 w-full">
          <SlidersHorizontal aria-hidden="true" className="size-5" />
          Filters
          {badge > 0 && (
            <span
              className="bg-primary text-primary-foreground text-caption grid size-5 place-items-center rounded-full font-extrabold"
              aria-label={`${String(badge)} applied`}
            >
              {badge}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent
        side={tablet ? 'right' : 'bottom'}
        className={
          tablet
            ? 'w-[380px] max-w-[100vw] gap-0 p-0 sm:max-w-[380px]'
            : 'shadow-toast max-h-[88vh] gap-0 rounded-t-2xl p-0'
        }
      >
        {!tablet && (
          <span aria-hidden="true" className="bg-border-strong mx-auto mt-2 h-1 w-9 rounded-full" />
        )}
        <div className="flex h-14 items-center px-4 pr-16">
          <SheetTitle className="text-lead font-extrabold">Filters</SheetTitle>
          <SheetDescription className="sr-only">Changes apply as you make them.</SheetDescription>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          <FilterGroups {...groups} />
        </div>
        <div className="border-border bg-surface flex items-center justify-between gap-3 border-t px-4 py-3">
          <Button variant="link" size="inline" className="min-h-11" onClick={onClearAll}>
            Clear all
          </Button>
          <Button
            size="lg"
            onClick={() => {
              setOpen(false);
            }}
          >
            {total === undefined ? 'Show providers' : showCountLabel(total)}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
