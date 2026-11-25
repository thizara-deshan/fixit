import { useId, useRef, useState, type SubmitEvent } from 'react';
import { ChevronDown, MapPin, Search } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { useCatalog } from '../hooks';
import { homeSearchUrl } from '../search-url';

const POPULAR = ['Plumbing', 'Cleaning', 'Electrical', 'Handyman'] as const;

export function HeroSearch() {
  const navigate = useNavigate();
  const { data: catalog } = useCatalog();
  const [q, setQ] = useState('');
  const [loc, setLoc] = useState('');
  const qRef = useRef<HTMLInputElement>(null);
  const qId = useId();
  const locId = useId();

  const onSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    void navigate(homeSearchUrl({ q, loc }));
  };

  return (
    <div className="flex flex-col gap-4">
      <form
        role="search"
        aria-label="Search providers"
        onSubmit={onSubmit}
        className="border-border bg-surface shadow-search flex flex-col rounded-2xl border p-2 sm:flex-row sm:items-center sm:gap-2"
      >
        <label
          htmlFor={qId}
          className="focus-within:ring-primary flex h-14 min-w-0 flex-1 items-center gap-3 rounded-md px-3 focus-within:ring-2 sm:h-[60px]"
        >
          <Search aria-hidden="true" className="text-icon-subtle size-5 shrink-0" />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-caption text-text font-bold">Service</span>
            <input
              id={qId}
              ref={qRef}
              type="text"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
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
          className="focus-within:ring-primary relative flex h-14 min-w-0 items-center gap-3 rounded-md px-3 focus-within:ring-2 sm:h-[60px] sm:w-[220px]"
        >
          <MapPin aria-hidden="true" className="text-icon-subtle size-5 shrink-0" />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-caption text-text font-bold">Location</span>
            <select
              id={locId}
              value={loc}
              onChange={(e) => {
                setLoc(e.target.value);
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
        <Button
          type="submit"
          size="lg"
          className="mt-2 h-[52px] w-full rounded-lg sm:mt-0 sm:h-14 sm:w-auto sm:px-7"
        >
          <Search aria-hidden="true" className="size-5" />
          Search
        </Button>
      </form>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-meta text-text-subtle">Popular:</span>
        {POPULAR.map((label) => (
          <button
            key={label}
            type="button"
            onClick={() => {
              setQ(label);
              qRef.current?.focus();
            }}
            className="border-border bg-surface text-meta text-text-muted hover:border-primary hover:text-primary focus-visible:ring-primary h-11 rounded-full border px-3 font-semibold focus-visible:outline-none focus-visible:ring-2 sm:h-8"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
