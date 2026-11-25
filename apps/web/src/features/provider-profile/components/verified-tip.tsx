import { useId, useRef, useState } from 'react';
import { Check, Info } from 'lucide-react';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const TITLE = 'What does Verified mean?';
const BODY = "Fixit has checked this provider's national ID and, where listed, their trade qualification.";

export function VerifiedTip() {
  const [open, setOpen] = useState(false);
  const focusOpenedAt = useRef(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const descId = useId();
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <button
          ref={buttonRef}
          type="button"
          aria-describedby={descId}
          aria-expanded={open}
          className="bg-success-soft text-success-text text-meta inline-flex h-11 items-center gap-1.5 rounded-full pl-1 pr-2.5 font-bold sm:h-7"
          onMouseEnter={() => {
            setOpen(true);
          }}
          onMouseLeave={() => {
            setOpen(false);
          }}
          onFocus={() => {
            focusOpenedAt.current = Date.now();
            setOpen(true);
          }}
          onBlur={() => {
            setOpen(false);
          }}
          onClick={() => {
            if (Date.now() - focusOpenedAt.current < 400) return; // tap = focus + click (D-7)
            setOpen((v) => !v);
          }}
        >
          <span
            aria-hidden="true"
            className="bg-success text-primary-foreground grid size-[18px] place-items-center rounded-full"
          >
            <Check className="size-3" strokeWidth={3} />
          </span>
          Verified
          <Info aria-hidden="true" className="size-4" />
        </button>
      </PopoverAnchor>
      <span id={descId} className="sr-only">{`${TITLE} ${BODY}`}</span>
      <PopoverContent
        side="bottom"
        align="start"
        collisionPadding={16}
        role="tooltip"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
        }}
        onCloseAutoFocus={(e) => {
          e.preventDefault();
        }}
        onInteractOutside={(e) => {
          if (e.target instanceof Node && buttonRef.current?.contains(e.target)) e.preventDefault();
        }}
        className={cn(
          'bg-tooltip-bg text-primary-foreground text-meta w-[min(280px,calc(100vw-32px))] rounded-md border-0 px-3.5 py-3 font-medium',
        )}
      >
        <p className="font-bold">{TITLE}</p>
        <p>{BODY}</p>
      </PopoverContent>
    </Popover>
  );
}
