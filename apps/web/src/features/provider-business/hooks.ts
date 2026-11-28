import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import type {
  AreasBody,
  DocumentMeta,
  OwnProvider,
  ServiceBody,
  UpdateBusinessBody,
  VerificationState,
} from '@fixit/contracts';
import { refreshMe } from '@/features/auth/hooks';
import { qk } from '@/lib/query-keys';
import {
  createService,
  deleteDocument,
  deleteService,
  fetchOwnProvider,
  fetchVerification,
  removePhoto,
  saveAreas,
  submitVerification,
  updateBusiness,
  updateService,
  uploadPhoto,
} from './api';

export const useOwnProvider = (enabled = true) =>
  useQuery({ queryKey: qk.ownProvider, queryFn: fetchOwnProvider, enabled });

/** Upload result → patch the cached OwnProvider (no refetch). */
export function usePhotoCache() {
  const qc = useQueryClient();
  return (photoUrl: string | null) => {
    qc.setQueryData<OwnProvider | null>(qk.ownProvider, (old) => (old ? { ...old, photoUrl } : old));
  };
}
export { uploadPhoto };

export function useRemovePhoto() {
  const setPhoto = usePhotoCache();
  return useMutation({
    mutationFn: removePhoto,
    onSuccess: () => {
      setPhoto(null);
    },
  });
}

export const useVerification = () => useQuery({ queryKey: qk.verification, queryFn: fetchVerification });

/** After a slot upload: replace the cached document of that type. */
export function useDocumentCache() {
  const qc = useQueryClient();
  return {
    put: (doc: DocumentMeta) =>
      qc.setQueryData<VerificationState>(qk.verification, (old) =>
        old ? { ...old, documents: [...old.documents.filter((d) => d.type !== doc.type), doc] } : old,
      ),
    drop: (id: string) =>
      qc.setQueryData<VerificationState>(qk.verification, (old) =>
        old ? { ...old, documents: old.documents.filter((d) => d.id !== id) } : old,
      ),
  };
}

export function useDeleteDocument() {
  const cache = useDocumentCache();
  return useMutation({
    mutationFn: (id: string) => deleteDocument(id),
    onSuccess: (_v, id) => cache.drop(id),
  });
}

/** A27: status card updates; Me refresh moves the nav dot and the L3 banner. */
export function useSubmitVerification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: submitVerification,
    onSuccess: (state) => {
      qc.setQueryData(qk.verification, state);
      void qc.invalidateQueries({ queryKey: qk.ownProvider });
      refreshMe(qc);
    },
  });
}

/** D-10: public views (S1–S3, Discover) and S20 read the listing. */
function invalidateListing(qc: QueryClient): Promise<unknown> {
  return Promise.all([
    qc.invalidateQueries({ queryKey: ['catalog'] }),
    qc.invalidateQueries({ queryKey: qk.dashboard }),
  ]);
}

/** Service writes change startingPrice: wait for the fresh OwnProvider before the caller toasts. */
function useServiceMutation<V>(fn: (v: V) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => Promise.all([qc.invalidateQueries({ queryKey: qk.ownProvider }), invalidateListing(qc)]),
  });
}
export const useCreateService = () => useServiceMutation((body: ServiceBody) => createService(body));
export const useUpdateService = () =>
  useServiceMutation(({ id, body }: { id: string; body: ServiceBody }) => updateService(id, body));
export const useDeleteService = () => useServiceMutation((id: string) => deleteService(id));

/** A23. A re-verification moves S26, the L3 banner and the nav (Me). */
export function useUpdateBusiness() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateBusinessBody) => updateBusiness(body),
    onSuccess: (result) => {
      qc.setQueryData(qk.ownProvider, result.provider);
      void invalidateListing(qc);
      if (result.reverification !== null) {
        void qc.invalidateQueries({ queryKey: qk.verification });
        refreshMe(qc);
      }
    },
  });
}

export function useSaveAreas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AreasBody) => saveAreas(body),
    onSuccess: (own) => {
      qc.setQueryData(qk.ownProvider, own);
      void invalidateListing(qc);
    },
  });
}
