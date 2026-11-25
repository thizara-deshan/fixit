import { Link } from 'react-router';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { FormField } from '@/components/form-field';
import { PhoneInput } from '@/components/phone-input';
import { formatPhone } from '@/lib/format';

export function MobileField({
  mobile,
  businessName,
  field,
  error,
}: {
  mobile: string | null;
  businessName: string;
  field: UseFormRegisterReturn;
  error?: string | undefined;
}) {
  if (mobile !== null) {
    return (
      <p className="text-body text-text flex flex-wrap items-center gap-x-3 gap-y-1">
        <span>Your mobile: {formatPhone(mobile)}</span>
        <Link
          to="/account"
          className="text-label text-primary inline-flex min-h-11 items-center font-semibold sm:min-h-0"
        >
          Change
        </Link>
      </p>
    );
  }
  return (
    <FormField
      label="Mobile number"
      required
      error={error}
      help={`Saved to your account. ${businessName} sees it only after accepting.`}
    >
      {(p) => <PhoneInput {...p} {...field} />}
    </FormField>
  );
}
