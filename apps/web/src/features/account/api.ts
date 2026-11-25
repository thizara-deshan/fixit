import { ENDPOINTS as E, type ChangePasswordBody, type Me, type UpdateMeBody } from '@fixit/contracts';
import { http, pathOf } from '@/lib/http';

export const updateMe = (body: UpdateMeBody): Promise<Me> =>
  http(pathOf(E.me_update), { method: E.me_update.method, body, schema: E.me_update.response });

export const changePassword = (body: ChangePasswordBody): Promise<void> =>
  http(pathOf(E.me_password), { method: E.me_password.method, body, schema: undefined });
