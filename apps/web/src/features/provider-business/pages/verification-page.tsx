import { useCallback, useState } from 'react';
import { Lock } from 'lucide-react';
import { DOCUMENT_MISSING, missingRequiredDocuments, type DocumentType } from '@fixit/contracts';
import { DiscardChangesGuard } from '@/components/discard-changes-guard';
import { FormErrorBanner } from '@/components/form-error-banner';
import { LoadingRegion } from '@/components/loading-region';
import { SectionError } from '@/components/section-error';
import { SkeletonSectionCard } from '@/components/skeletons';
import { SubmitButton } from '@/components/submit-button';
import { FORM_COPY } from '@/lib/error-copy';
import { ApiError } from '@/lib/http';
import { notify } from '@/lib/toast';
import { DocumentSlot } from '../components/document-slot';
import { SubmittedDocuments } from '../components/submitted-documents';
import { VerificationStatusCard } from '../components/verification-status-card';
import { useSubmitVerification, useVerification } from '../hooks';

const SLOTS: DocumentType[] = ['nic_front', 'nic_back', 'trade_certificate', 'business_registration'];

export function VerificationPage() {
  const v = useVerification();
  const submit = useSubmitVerification();
  const [busy, setBusy] = useState<Partial<Record<DocumentType, boolean>>>({});
  const [uploadedThisVisit, setUploadedThisVisit] = useState(false);
  const [missing, setMissing] = useState<Partial<Record<DocumentType, string>>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const onBusyChange = useCallback((t: DocumentType, b: boolean) => {
    setBusy((s) => (s[t] === b ? s : { ...s, [t]: b }));
  }, []);
  const onUploaded = useCallback(() => {
    setUploadedThisVisit(true);
  }, []);
  const anyBusy = Object.values(busy).some(Boolean);

  async function onSubmit() {
    if (!v.data) return;
    setBanner(null);
    const gaps = missingRequiredDocuments(v.data.documents.map((d) => d.type));
    setMissing(Object.fromEntries(gaps.map((t) => [t, DOCUMENT_MISSING[t]])));
    if (gaps.length > 0) return;
    try {
      await submit.mutateAsync();
      setUploadedThisVisit(false);
      notify("Documents submitted. We'll email you when they're checked.");
    } catch (e) {
      setBanner(
        e instanceof ApiError && e.rule === 'documents_missing'
          ? DOCUMENT_MISSING.nic_front
          : FORM_COPY.saveFailed,
      );
    }
  }

  return (
    <div className="flex max-w-[880px] flex-col gap-5 sm:gap-7">
      <h1 className="text-title-lg text-text">Verification</h1>
      {v.isPending && (
        <LoadingRegion
          loading
          skeleton={
            <>
              <SkeletonSectionCard lines={3} />
              <SkeletonSectionCard lines={6} />
            </>
          }
        />
      )}
      {v.isError && (
        <SectionError
          onRetry={() => {
            void v.refetch();
          }}
        />
      )}
      {v.data && (
        <>
          <DiscardChangesGuard when={anyBusy || uploadedThisVisit} />
          <VerificationStatusCard state={v.data} />
          {v.data.editable ? (
            <>
              {banner && <FormErrorBanner>{banner}</FormErrorBanner>}
              <form
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  void onSubmit();
                }}
                className="border-border bg-surface flex flex-col gap-5 rounded-2xl border p-5 sm:p-6"
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {SLOTS.map((t) => (
                    <DocumentSlot
                      key={t}
                      type={t}
                      doc={v.data.documents.find((d) => d.type === t) ?? null}
                      missingError={missing[t]}
                      onBusyChange={onBusyChange}
                      onUploaded={onUploaded}
                    />
                  ))}
                </div>
                <p className="text-meta text-text-muted flex items-center gap-2">
                  <Lock aria-hidden="true" className="size-4" />
                  Only you and Fixit admins can see these documents.
                </p>
                <SubmitButton
                  pending={submit.isPending}
                  pendingLabel="Submitting…"
                  disabled={anyBusy}
                  className="w-full sm:w-auto sm:self-start"
                >
                  {v.data.status === 'rejected' ? 'Submit again' : 'Submit for review'}
                </SubmitButton>
              </form>
            </>
          ) : (
            <SubmittedDocuments documents={v.data.documents} />
          )}
        </>
      )}
    </div>
  );
}
