import {
  ENDPOINTS as E,
  type DocumentMeta,
  type AreasBody,
  type DocumentType,
  type OwnProvider,
  type PhotoResult,
  type Service,
  type ServiceBody,
  type UpdateBusinessBody,
  type UpdateBusinessResult,
  type VerificationState,
} from '@fixit/contracts';
import { ApiError, http, pathOf } from '@/lib/http';

/** null = never started onboarding (404). */
export async function fetchOwnProvider(): Promise<OwnProvider | null> {
  try {
    return await http(pathOf(E.provider_me), { schema: E.provider_me.response });
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export function uploadPhoto(file: File, signal: AbortSignal): Promise<PhotoResult> {
  const form = new FormData();
  form.append('file', file);
  return http(pathOf(E.provider_photo_put), {
    method: 'PUT',
    form,
    signal,
    schema: E.provider_photo_put.response,
  });
}
export const removePhoto = (): Promise<void> =>
  http(pathOf(E.provider_photo_delete), { method: 'DELETE', schema: undefined });

export const fetchVerification = (): Promise<VerificationState> =>
  http(pathOf(E.verification_get), { schema: E.verification_get.response });

export function uploadDocument(type: DocumentType, file: File, signal: AbortSignal): Promise<DocumentMeta> {
  const form = new FormData();
  form.append('type', type);
  form.append('file', file);
  return http(pathOf(E.verification_document_upload), {
    method: 'POST',
    form,
    signal,
    schema: E.verification_document_upload.response,
  });
}
export const deleteDocument = (id: string): Promise<void> =>
  http(pathOf(E.verification_document_delete, { id }), { method: 'DELETE', schema: undefined });

export const submitVerification = (): Promise<VerificationState> =>
  http(pathOf(E.verification_submit), { method: 'POST', schema: E.verification_submit.response });

export const updateBusiness = (body: UpdateBusinessBody): Promise<UpdateBusinessResult> =>
  http(pathOf(E.provider_business_update), {
    method: 'PATCH',
    body,
    schema: E.provider_business_update.response,
  });

export const createService = (body: ServiceBody): Promise<Service> =>
  http(pathOf(E.provider_service_create), {
    method: 'POST',
    body,
    schema: E.provider_service_create.response,
  });

export const updateService = (id: string, body: ServiceBody): Promise<Service> =>
  http(pathOf(E.provider_service_update, { id }), {
    method: 'PATCH',
    body,
    schema: E.provider_service_update.response,
  });

export const deleteService = (id: string): Promise<void> =>
  http(pathOf(E.provider_service_delete, { id }), { method: 'DELETE', schema: undefined });

export const saveAreas = (body: AreasBody): Promise<OwnProvider> =>
  http(pathOf(E.provider_areas_put), { method: 'PUT', body, schema: E.provider_areas_put.response });
