import { useState, type ComponentProps } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/** SPEC S5: password with a show/hide toggle (44 target). */
export function PasswordInput({ className, ...props }: Omit<ComponentProps<'input'>, 'type'>) {
  const [shown, setShown] = useState(false);
  const Icon = shown ? EyeOff : Eye;
  return (
    <div className="relative">
      <Input type={shown ? 'text' : 'password'} className={cn('pr-12', className)} {...props} />
      <button
        type="button"
        onClick={() => {
          setShown((s) => !s);
        }}
        aria-label={shown ? 'Hide password' : 'Show password'}
        aria-pressed={shown}
        className="text-text-muted hover:text-text focus-visible:ring-ring absolute inset-y-0 right-0 grid w-11 place-items-center rounded-md focus-visible:outline-none focus-visible:ring-2"
      >
        <Icon aria-hidden="true" className="size-5" />
      </button>
    </div>
  );
}
