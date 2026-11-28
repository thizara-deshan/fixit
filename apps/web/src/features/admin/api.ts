import {
  ENDPOINTS as E,
  type AdminOverview,
  type AdminUserDetail,
  type AdminUserList,
  type AdminUserListQuery,
  type HideReviewBody,
  type ModerationList,
  type ModerationQuery,
  type ModerationRow,
  type ReactivateBody,
  type RejectBody,
  type SuspendBody,
  type VerificationDecisionResult,
  type VerificationDetail,
  type VerificationQueue,
  type VerificationQueueQuery,
} from '@fixit/contracts';
import { http, httpBlob, pathOf } from '@/lib/http';

export const fetchOverview = (): Promise<AdminOverview> =>
  http(pathOf(E.admin_overview), { schema: E.admin_overview.response });

export const fetchQueue = (q: VerificationQueueQuery): Promise<VerificationQueue> =>
  http(pathOf(E.admin_verifications_list), {
    query: { status: q.status, page: q.page },
    schema: E.admin_verifications_list.response,
  });
export const fetchVerification = (id: string): Promise<VerificationDetail> =>
  http(pathOf(E.admin_verification_get, { id }), { schema: E.admin_verification_get.response });
export const approveVerification = (id: string): Promise<VerificationDecisionResult> =>
  http(pathOf(E.admin_verification_approve, { id }), {
    method: 'POST',
    schema: E.admin_verification_approve.response,
  });
export const rejectVerification = (id: string, body: RejectBody): Promise<VerificationDecisionResult> =>
  http(pathOf(E.admin_verification_reject, { id }), {
    method: 'POST',
    body,
    schema: E.admin_verification_reject.response,
  });
export const fetchDocumentBlob = (id: string, signal?: AbortSignal): Promise<Blob> =>
  httpBlob(pathOf(E.files_document, { id }), signal);

export const fetchUsers = (q: AdminUserListQuery): Promise<AdminUserList> =>
  http(pathOf(E.admin_users_list), {
    query: { q: q.q === '' ? undefined : q.q, role: q.role, status: q.status, page: q.page },
    schema: E.admin_users_list.response,
  });
export const fetchUser = (id: string): Promise<AdminUserDetail> =>
  http(pathOf(E.admin_user_get, { id }), { schema: E.admin_user_get.response });
export const suspendUser = (id: string, body: SuspendBody): Promise<AdminUserDetail> =>
  http(pathOf(E.admin_user_suspend, { id }), {
    method: 'POST',
    body,
    schema: E.admin_user_suspend.response,
  });
export const reactivateUser = (id: string, body: ReactivateBody): Promise<AdminUserDetail> =>
  http(pathOf(E.admin_user_reactivate, { id }), {
    method: 'POST',
    body,
    schema: E.admin_user_reactivate.response,
  });

export const fetchModeration = (q: ModerationQuery): Promise<ModerationList> =>
  http(pathOf(E.admin_reviews_list), {
    query: { q: q.q === '' ? undefined : q.q, visibility: q.visibility, page: q.page },
    schema: E.admin_reviews_list.response,
  });
export const hideReview = (id: string, body: HideReviewBody): Promise<ModerationRow> =>
  http(pathOf(E.admin_review_hide, { id }), {
    method: 'POST',
    body,
    schema: E.admin_review_hide.response,
  });
export const restoreReview = (id: string): Promise<ModerationRow> =>
  http(pathOf(E.admin_review_restore, { id }), {
    method: 'POST',
    schema: E.admin_review_restore.response,
  });
