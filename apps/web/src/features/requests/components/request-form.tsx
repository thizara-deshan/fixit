import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Send } from 'lucide-react';
import {
  bookingWindow,
  makeCreateRequestSchema,
  MOBILE_MESSAGE,
  type Me,
  type ProviderPublicProfile,
} from '@fixit/contracts';
import { FormErrorBanner } from '@/components/form-error-banner';
import { FormField } from '@/components/form-field';
import { SubmitButton } from '@/components/submit-button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { requestRuleBanner } from '@/lib/error-copy';
import { mapApiErrorToForm } from '@/lib/form-errors';
import { ApiError } from '@/lib/http';
import { useFormDraft } from '@/lib/use-form-draft';
import { useCreateRequest } from '../hooks';
import { MobileField } from './mobile-field';
import { BR11_NOTE } from './request-summary';
import { ServiceOptions } from './service-options';
import { SlotControl } from './slot-control';

const selectClass =
  'border-border-control bg-surface text-body text-text focus-visible:ring-ring h-12 w-full rounded-md border px-3 focus-visible:ring-2 focus-visible:outline-none aria-invalid:border-danger';
const grouping = new Intl.NumberFormat('en-US');

interface Props {
  profile: ProviderPublicProfile;
  me: Me;
  initialTownId: string;
  onServiceChange: (serviceId: string) => void;
  onDirtyChange: (dirty: boolean) => void;
  onSent: (ref: string) => void;
}

export function RequestForm({ profile, me, initialTownId, onServiceChange, onDirtyChange, onSent }: Props) {
  const now = useMemo(() => new Date(), []);
  const schema = useMemo(() => makeCreateRequestSchema(now), [now]);
  const window = bookingWindow(now);
  const create = useCreateRequest();
  const [banner, setBanner] = useState<string | null>(null);
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      providerId: profile.id,
      serviceId: '',
      preferredDate: '',
      townId: initialTownId,
      addressLine1: '',
      addressLine2: '',
      description: '',
      ...(me.mobile === null ? { mobile: '' } : {}),
    },
  });
  useFormDraft(`request.${profile.id}`, form);
  const { errors, isDirty } = form.formState;
  const serviceId = useWatch({ control: form.control, name: 'serviceId' });
  const description = useWatch({ control: form.control, name: 'description' });
  useEffect(() => {
    onServiceChange(serviceId);
  }, [serviceId, onServiceChange]);
  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const onSubmit = form.handleSubmit(async (values) => {
    setBanner(null);
    try {
      const view = await create.mutateAsync(values);
      onSent(view.ref);
    } catch (e) {
      if (e instanceof ApiError && e.rule === 'mobile_missing') {
        form.setError('mobile', { type: 'server', message: MOBILE_MESSAGE }, { shouldFocus: true });
        return;
      }
      setBanner(requestRuleBanner(e, profile.businessName) ?? mapApiErrorToForm(e, form.setError));
    }
  });

  return (
    <form
      noValidate
      onSubmit={(e) => void onSubmit(e)}
      className="border-border bg-surface flex flex-col gap-6 rounded-2xl border p-5 sm:p-7"
    >
      {banner && <FormErrorBanner>{banner}</FormErrorBanner>}
      <ServiceOptions
        services={profile.services}
        field={form.register('serviceId')}
        error={errors.serviceId?.message}
      />
      <FormField
        label="Preferred date"
        required
        error={errors.preferredDate?.message}
        help="Same-day bookings aren't available."
      >
        {(p) => (
          <Input {...p} type="date" min={window.min} max={window.max} {...form.register('preferredDate')} />
        )}
      </FormField>
      <SlotControl field={form.register('slot')} error={errors.slot?.message} />
      <FormField
        label="Town"
        required
        error={errors.townId?.message}
        help={`${profile.businessName} works in these towns.`}
      >
        {(p) => (
          <select {...p} className={selectClass} {...form.register('townId')}>
            <option value="">Choose your town</option>
            {profile.areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        )}
      </FormField>
      <div className="flex flex-col gap-4">
        <FormField label="Address line 1" required error={errors.addressLine1?.message}>
          {(p) => <Input {...p} autoComplete="address-line1" {...form.register('addressLine1')} />}
        </FormField>
        <FormField label="Address line 2" optional error={errors.addressLine2?.message}>
          {(p) => <Input {...p} autoComplete="address-line2" {...form.register('addressLine2')} />}
        </FormField>
        <p className="text-meta text-text-muted">Only shared with {profile.businessName} if they accept.</p>
      </div>
      <FormField
        label="Description"
        required
        error={errors.description?.message}
        help={`${grouping.format(description.length)} / 1,000`}
      >
        {(p) => (
          <Textarea
            {...p}
            rows={5}
            placeholder="What needs doing? Include anything that helps the provider quote — the problem, the size of the job, access details."
            {...form.register('description')}
          />
        )}
      </FormField>
      <MobileField
        mobile={me.mobile}
        businessName={profile.businessName}
        field={me.mobile === null ? form.register('mobile') : undefined}
        error={errors.mobile?.message}
      />
      <div className="flex flex-col gap-3">
        <p className="text-meta text-text-subtle">{BR11_NOTE}</p>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
          <Link
            to={`/providers/${profile.id}`}
            className="text-label text-text-muted hover:text-primary inline-flex min-h-11 items-center justify-center font-semibold sm:justify-start"
          >
            Cancel
          </Link>
          <div className="border-border bg-surface fixed inset-x-0 bottom-0 z-30 border-t px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3 sm:static sm:z-auto sm:order-first sm:border-0 sm:bg-transparent sm:p-0">
            <SubmitButton
              pending={create.isPending}
              pendingLabel="Sending…"
              size="lg"
              className="h-12 w-full sm:w-auto"
            >
              <Send aria-hidden="true" className="size-4" />
              Send request
            </SubmitButton>
          </div>
        </div>
      </div>
    </form>
  );
}
