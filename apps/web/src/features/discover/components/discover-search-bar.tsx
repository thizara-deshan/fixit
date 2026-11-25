import { useId, useState, type SubmitEvent } from 'react';
import { ChevronDown, MapPin, Search } from 'lucide-react';
import type { CatalogResponse } from '@fixit/contracts';
import { Button } from '@/components/ui/button';

interface Props {
  catalog: CatalogResponse | undefined;
  q: string | undefined; // from URL
  loc: string | undefined; // from URL
  onSearch: (q: string, loc: string | undefined) => void; // newSearch (PUSH)
  onLocationChange: (loc: string | undefined) => void; // setFilter({ loc }) — applies immediately
}

/** S2.E1. Render with `key={q ?? ''}` so the text re-syncs when the URL changes. */
export function DiscoverSearchBar({ catalog, q, loc, onSearch, onLocationChange }: Props) {
  const [text, setText] = useState(q ?? '');
  const qId = useId();
  const locId = useId();

  const onSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    onSearch(text, loc);
  };

  return (
    <form
      role="search"
      aria-label="Search providers"
      onSubmit={onSubmit}
      className="border-border bg-surface shadow-search-sm flex flex-col rounded-xl border p-1.5 sm:flex-row sm:items-center sm:gap-2"
    >
      <label
        htmlFor={qId}
        className="focus-within:ring-primary flex h-14 min-w-0 flex-1 items-center gap-3 rounded-md px-3 focus-within:ring-2"
      >
        <Search aria-hidden="true" className="text-icon-subtle size-5 shrink-0" />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-caption text-text font-bold">Service</span>
          <input
            id={qId}
            type="text"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
            }}
            placeholder="What service do you need?"
            maxLength={80}
            className="text-body text-text placeholder:text-text-subtle sm:text-body-sm w-full bg-transparent outline-none"
          />
        </span>
      </label>
      <span aria-hidden="true" className="bg-border mx-3 h-px sm:mx-0 sm:h-10 sm:w-px" />
      <label
        htmlFor={locId}
        className="focus-within:ring-primary relative flex h-14 min-w-0 items-center gap-3 rounded-md px-3 focus-within:ring-2 sm:w-[220px]"
      >
        <MapPin aria-hidden="true" className="text-icon-subtle size-5 shrink-0" />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-caption text-text font-bold">Location</span>
          <select
            id={locId}
            value={loc ?? ''}
            onChange={(e) => {
              onLocationChange(e.target.value || undefined);
            }}
            className="text-body text-text sm:text-body-sm w-full appearance-none truncate bg-transparent pr-6 outline-none"
          >
            <option value="">All locations</option>
            {catalog?.districts.map((d) => (
              <optgroup key={d.id} label={d.name}>
                {catalog.towns
                  .filter((t) => t.districtId === d.id)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </span>
        <ChevronDown
          aria-hidden="true"
          className="text-text-muted pointer-events-none absolute right-3 size-4"
        />
      </label>
      <Button type="submit" size="lg" className="mt-2 h-12 w-full sm:mt-0 sm:h-14 sm:w-auto sm:px-7">
        <Search aria-hidden="true" className="size-5" />
        Search
      </Button>
    </form>
  );
}
