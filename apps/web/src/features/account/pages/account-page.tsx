import { useCallback, useState } from 'react';
import { CustomerPageHeader } from '@/app/layouts/customer-layout';
import { DiscardChangesGuard } from '@/components/discard-changes-guard';
import { useAuth } from '@/lib/auth-store';
import { CONTACT_EMAIL } from '@/lib/env';
import { DetailsCard } from '../components/details-card';
import { OfferServicesCard } from '../components/offer-services-card';
import { PasswordCard } from '../components/password-card';

export function AccountPage() {
  const { me } = useAuth();
  const [detailsDirty, setDetailsDirty] = useState(false);
  const [passwordDirty, setPasswordDirty] = useState(false);
  const onDetailsDirty = useCallback((d: boolean) => {
    setDetailsDirty(d);
  }, []);
  const onPasswordDirty = useCallback((d: boolean) => {
    setPasswordDirty(d);
  }, []);
  if (!me) return null; // RequireAuth guarantees a user; null only during sign-out
  return (
    <>
      <CustomerPageHeader title="Account settings" tabs />
      <div className="max-w-form flex w-full flex-col gap-5">
        <DetailsCard me={me} onDirtyChange={onDetailsDirty} />
        <PasswordCard me={me} onDirtyChange={onPasswordDirty} />
        <OfferServicesCard me={me} />
        <p className="text-meta text-text-muted">To delete your account, email us at {CONTACT_EMAIL}.</p>
      </div>
      <DiscardChangesGuard when={detailsDirty || passwordDirty} />
    </>
  );
}
