import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { DocumentMeta, OwnProvider, VerificationState } from '@fixit/contracts';
import { refreshMe } from '@/features/auth/hooks';
import { qk } from '@/lib/query-keys';
import {
  deleteDocument,
  fetchOwnProvider,
  fetchVerification,
  removePhoto,
  submitVerification,
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
