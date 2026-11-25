import { useId, type ReactNode } from 'react';
import { CircleAlert } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface FieldControlProps {
  id: string;
  'aria-describedby': string | undefined;
  'aria-invalid': true | undefined;
  'aria-required': true | undefined;
}

interface FormFieldProps {
  label: string;
  required?: boolean;
  /** Shows a visible "Optional" after the label. */
  optional?: boolean;
  help?: ReactNode;
  /** Right-aligned on the label row (e.g. S5 "Forgot password?"). */
  labelAside?: ReactNode;
  error?: string | undefined;
  /** Render the control with the wiring props spread onto it. */
  children: (control: FieldControlProps) => ReactNode;
  className?: string;
}

export function FormField({
  label,
  required = false,
  optional = false,
  help,
  labelAside,
  error,
  children,
  className,
}: FormFieldProps) {
  const id = useId();
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  const describedBy =
    [help !== undefined ? helpId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={id}>
          {label}
          {required && <span className="sr-only"> (required)</span>}
          {optional && <span className="text-text-subtle ml-1.5 font-medium">Optional</span>}
        </Label>
        {labelAside}
      </div>
      {children({
        id,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
        'aria-required': required ? true : undefined,
      })}
      {help !== undefined && (
        <p id={helpId} className="text-meta text-text-muted">
          {help}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-meta text-danger-text flex items-start gap-1.5">
          <CircleAlert aria-hidden="true" className="mt-px size-4 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
