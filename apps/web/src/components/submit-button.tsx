import type { ComponentProps, ReactNode } from 'react';
import { LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = Omit<ComponentProps<typeof Button>, 'type' | 'children'> & {
  pending: boolean;
  pendingLabel: string;
  children: ReactNode;
};

/** SPEC §6.1: while pending the label changes, a spinner shows, and the button is disabled + aria-busy. */
export function SubmitButton({ pending, pendingLabel, children, disabled, ...props }: Props) {
  return (
    <Button type="submit" disabled={pending || disabled} aria-busy={pending || undefined} {...props}>
      {pending && (
        <LoaderCircle aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" />
      )}
      {pending ? pendingLabel : children}
    </Button>
  );
}
