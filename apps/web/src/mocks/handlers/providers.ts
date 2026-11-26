import {
  checkUpload,
  DocumentUploadFields,
  dashboardStats,
  ENDPOINTS as E,
  OnboardingStepParam,
  parseOnboardingBody,
  UPLOAD_COPY,
} from '@fixit/contracts';
import { expireDue } from '../db/expire';
import { mockEndpoint, mockFileEndpoint } from '../lib/endpoint';
import { mockError } from '../lib/errors';
import { deleteFile, getFile, placeholderFile, putFile } from '../lib/files';
import { readMultipart } from '../lib/multipart';
import { applyOnboardingStep, publishDraft, requireDraft, toOwnProvider } from '../lib/own-provider';
import { ownProvider } from '../lib/requests';
import {
  stageDocument,
  submitVerification,
  toDocumentMeta,
  unstageDocument,
  verificationStateOf,
} from '../lib/verification';

export const providersHandlers = [
  mockEndpoint(E.provider_dashboard, ({ db: d, actor, now }) => {
    if (!actor) throw mockError(401, 'UNAUTHENTICATED', 'Sign in required');
    expireDue(d, now);
    const p = ownProvider(d, actor.userId);
    const records = Object.values(d.requests).filter((r) => r.providerId === p.id);
    return {
      stats: dashboardStats(records, { rating: p.ratingAvg, count: p.reviewCount }, now),
      services: Object.values(d.services)
        .filter((s) => s.providerId === p.id)
        .map((s) => ({ id: s.id, name: s.name, price: s.price, unit: s.unit })),
      checklist: null, // D-1: M24
    };
  }),
  mockEndpoint(E.provider_me, ({ db: d, actor }) => {
    if (!actor) throw mockError(401, 'UNAUTHENTICATED', 'Sign in required');
    return toOwnProvider(d, requireDraft(d, actor.userId));
  }),
  mockEndpoint(E.provider_onboarding_save, async ({ db: d, actor, params, request, now }) => {
    if (!actor) throw mockError(401, 'UNAUTHENTICATED', 'Sign in required');
    const step = OnboardingStepParam.safeParse(params.step);
    if (!step.success) throw mockError(404, 'NOT_FOUND', 'Unknown step');
    const raw: unknown = await request.json().catch(() => undefined);
    // safe: OnboardingStepParam only accepts 1–4
    const input = parseOnboardingBody(step.data as OnboardingStepParam, raw);
    return toOwnProvider(d, applyOnboardingStep(d, actor.userId, input, now));
  }),
  mockEndpoint(E.provider_publish, ({ db: d, actor, now }) => {
    if (!actor) throw mockError(401, 'UNAUTHENTICATED', 'Sign in required');
    return toOwnProvider(d, publishDraft(d, actor.userId, now));
  }),
  mockEndpoint(E.provider_photo_put, async ({ db: d, actor, request }) => {
    if (!actor) throw mockError(401, 'UNAUTHENTICATED', 'Sign in required');
    const p = requireDraft(d, actor.userId);
    const file = (await readMultipart(request)).get('file');
    if (!file?.fileName)
      throw mockError(400, 'VALIDATION_FAILED', 'Validation failed', {
        fieldErrors: { file: ['Choose a file.'] },
      });
    const problem = checkUpload('photo', { mimeType: file.mimeType ?? '', sizeBytes: file.bytes.length });
    if (problem === 'type') throw mockError(415, 'UNSUPPORTED_MEDIA', UPLOAD_COPY.photo.type);
    if (problem === 'size') throw mockError(413, 'PAYLOAD_TOO_LARGE', UPLOAD_COPY.photo.size);
    if (p.photoKey) deleteFile(`photo:${p.photoKey}`);
    const key = `${p.id}-${crypto.randomUUID().slice(0, 8)}`;
    putFile(`photo:${key}`, new Blob([file.bytes], { type: file.mimeType ?? 'application/octet-stream' }));
    p.photoKey = key;
    return { photoUrl: `/api/files/photos/${key}` };
  }),
  mockEndpoint(E.provider_photo_delete, ({ db: d, actor }) => {
    if (!actor) throw mockError(401, 'UNAUTHENTICATED', 'Sign in required');
    const p = requireDraft(d, actor.userId);
    if (p.photoKey) deleteFile(`photo:${p.photoKey}`);
    p.photoKey = null;
  }),
  mockFileEndpoint(
    E.files_photo,
    ({ db: d, params }) => {
      const key = params.key ?? '';
      if (!Object.values(d.providers).some((p) => p.photoKey === key))
        throw mockError(404, 'NOT_FOUND', 'No such photo');
      return getFile(`photo:${key}`) ?? placeholderFile();
    },
    'public, max-age=31536000, immutable',
  ),
  mockEndpoint(E.verification_get, ({ db: d, actor }) => {
    if (!actor) throw mockError(401, 'UNAUTHENTICATED', 'Sign in required');
    return verificationStateOf(d, ownProvider(d, actor.userId));
  }),
  mockEndpoint(E.verification_document_upload, async ({ db: d, actor, request, now }) => {
    if (!actor) throw mockError(401, 'UNAUTHENTICATED', 'Sign in required');
    const p = ownProvider(d, actor.userId);
    const parts = await readMultipart(request);
    const { type } = DocumentUploadFields.parse({ type: parts.get('type')?.text });
    const file = parts.get('file');
    if (!file?.fileName)
      throw mockError(400, 'VALIDATION_FAILED', 'Validation failed', {
        fieldErrors: { file: ['Choose a file.'] },
      });
    const mimeType = file.mimeType ?? '';
    const problem = checkUpload('document', { mimeType, sizeBytes: file.bytes.length });
    if (problem === 'type') throw mockError(415, 'UNSUPPORTED_MEDIA', UPLOAD_COPY.document.type);
    if (problem === 'size') throw mockError(413, 'PAYLOAD_TOO_LARGE', UPLOAD_COPY.document.size);
    return toDocumentMeta(
      stageDocument(d, p, { type, fileName: file.fileName, mimeType, bytes: file.bytes }, now),
    );
  }),
  mockEndpoint(E.verification_document_delete, ({ db: d, actor, params }) => {
    if (!actor) throw mockError(401, 'UNAUTHENTICATED', 'Sign in required');
    unstageDocument(d, ownProvider(d, actor.userId), params.id ?? '');
  }),
  mockEndpoint(E.verification_submit, ({ db: d, actor, now }) => {
    if (!actor) throw mockError(401, 'UNAUTHENTICATED', 'Sign in required');
    const p = ownProvider(d, actor.userId);
    submitVerification(d, p, now);
    return verificationStateOf(d, p);
  }),
  mockFileEndpoint(
    E.files_document,
    ({ db: d, actor, params }) => {
      const doc = d.documents[params.id ?? ''];
      const isAdmin = actor?.roles.includes('admin') ?? false;
      const mine =
        !isAdmin && actor ? Object.values(d.providers).find((p) => p.userId === actor.userId)?.id : undefined;
      if (!doc || (!isAdmin && doc.providerId !== mine))
        throw mockError(404, 'NOT_FOUND', 'No such document');
      return getFile(`doc:${doc.id}`) ?? placeholderFile();
    },
    'no-store',
  ),
];
