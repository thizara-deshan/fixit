import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { MQ, useMediaQuery } from '@/lib/use-media-query';
import { cn } from '@/lib/utils';

export interface ResponsiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  /** 56×56 icon tile (single-message dialogs). */
  icon?: ReactNode;
  /** 'center' for single-message dialogs (prototype), 'left' for forms (SPEC §6.10). */
  align?: 'center' | 'left';
  /** Optional trigger; focus returns to it on close. */
  trigger?: ReactNode;
  children?: ReactNode;
  /** Buttons in desktop order: secondary first, then primary/danger. Phone reverses them so primary is first. */
  footer?: ReactNode;
  /** false while submitting: Esc, overlay and the close button do nothing. */
  dismissible?: boolean;
}

export function ResponsiveDialog({
  open,
  onOpenChange,
  title,
  description,
  icon,
  align = 'left',
  trigger,
  children,
  footer,
  dismissible = true,
}: ResponsiveDialogProps) {
  const isDesktop = useMediaQuery(MQ.sm);
  const handleOpenChange = (next: boolean) => {
    if (!next && !dismissible) return;
    onOpenChange(next);
  };
  const block = (e: Event) => {
    if (!dismissible) e.preventDefault();
  };
  const describedBy = description === undefined ? { 'aria-describedby': undefined } : {};

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
        <DialogContent
          data-variant="dialog"
          showCloseButton={false}
          onEscapeKeyDown={block}
          onInteractOutside={block}
          className={cn('flex flex-col gap-4', align === 'center' && 'items-center text-center')}
          {...describedBy}
        >
          {icon}
          <DialogTitle className="text-title-md text-text">{title}</DialogTitle>
          {description !== undefined && (
            <DialogDescription className="text-body-sm text-text-muted">{description}</DialogDescription>
          )}
          {children}
          {footer && (
            <div className={cn('mt-2 flex gap-3', align === 'center' ? 'justify-center' : 'justify-end')}>
              {footer}
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
      <SheetContent
        data-variant="sheet"
        side="bottom"
        showCloseButton={false}
        onEscapeKeyDown={block}
        onInteractOutside={block}
        className="shadow-toast max-h-[90dvh] gap-0 rounded-t-2xl border-0 p-0"
        {...describedBy}
      >
        <span aria-hidden="true" className="bg-border-strong mx-auto mt-2 h-1 w-9 shrink-0 rounded-full" />
        <div className="flex items-center gap-2 py-1 pl-4 pr-1">
          <SheetTitle className="text-title-md text-text min-w-0 flex-1">{title}</SheetTitle>
          <SheetClose asChild>
            <Button variant="ghost" size="icon" aria-label="Close" disabled={!dismissible}>
              <X aria-hidden="true" className="size-5" />
            </Button>
          </SheetClose>
        </div>
        <div
          className={cn(
            'flex min-h-0 flex-col gap-4 overflow-y-auto px-4 pb-4',
            align === 'center' && 'items-center text-center',
          )}
        >
          {icon}
          {description !== undefined && (
            <SheetDescription className="text-body-sm text-text-muted">{description}</SheetDescription>
          )}
          {children}
        </div>
        {footer && (
          <div className="border-border bg-surface sticky bottom-0 flex flex-col-reverse gap-2 border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))] [&>*]:w-full">
            {footer}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
