import { z } from 'zod';
import {
  AuthSession,
  ChangePasswordBody,
  ConfirmEmailBody,
  ConfirmEmailResult,
  ForgotPasswordBody,
  LoginBody,
  Me,
  RegisterBody,
  ResetPasswordBody,
  UpdateMeBody,
} from './auth/schemas';
import { CatalogResponse, ProviderCard } from './catalog/schemas';

export type Access = 'public' | 'user' | 'provider' | 'admin';
// user = signed-in non-admin (every user is a customer); provider = user with a published listing
export type OwnerRule =
  'none' | 'self' | 'request_customer' | 'request_provider' | 'resource_provider' | 'provider_or_admin';
export type Domain = 'auth' | 'catalog' | 'providers' | 'requests' | 'reviews' | 'admin';
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface EndpointDef {
  id: string;
  domain: Domain;
  method: HttpMethod;
  path: `/${string}`; // relative to /api, Express-style params (/me/requests/:ref)
  access: readonly Access[]; // who passes the role check
  owner: OwnerRule; // other owner → 404
  body?: z.ZodType;
  query?: z.ZodType;
  response?: z.ZodType; // undefined = 204
  multipart?: true;
  rateLimited?: true;
  refs: readonly string[];
}

/** One entry per row of ARCHITECTURE §3. Entries are added by the milestone that first needs them. */
export const ENDPOINTS = {
  auth_login: {
    id: 'auth_login',
    domain: 'auth',
    method: 'POST',
    path: '/auth/login',
    access: ['public'],
    owner: 'none',
    body: LoginBody,
    response: AuthSession,
    rateLimited: true,
    refs: ['F-01', 'S5', 'A3'],
  },
  auth_refresh: {
    id: 'auth_refresh',
    domain: 'auth',
    method: 'POST',
    path: '/auth/refresh',
    access: ['public'],
    owner: 'none',
    response: AuthSession,
    rateLimited: true,
    refs: ['§6.6'],
  },
  auth_logout: {
    id: 'auth_logout',
    domain: 'auth',
    method: 'POST',
    path: '/auth/logout',
    access: ['public'],
    owner: 'none',
    refs: ['A4'],
  },
  auth_me: {
    id: 'auth_me',
    domain: 'auth',
    method: 'GET',
    path: '/auth/me',
    access: ['user', 'admin'],
    owner: 'self',
    response: Me,
    refs: ['nav', '§6.8'],
  },
  auth_register: {
    id: 'auth_register',
    domain: 'auth',
    method: 'POST',
    path: '/auth/register',
    access: ['public'],
    owner: 'none',
    body: RegisterBody,
    rateLimited: true,
    refs: ['F-01', 'S6', 'A1'],
  },
  auth_admin_login: {
    id: 'auth_admin_login',
    domain: 'auth',
    method: 'POST',
    path: '/auth/admin/login',
    access: ['public'],
    owner: 'none',
    body: LoginBody,
    response: AuthSession,
    rateLimited: true,
    refs: ['F-30', 'S29'],
  },
  auth_google: {
    id: 'auth_google',
    domain: 'auth',
    method: 'GET',
    path: '/auth/google',
    access: ['public'],
    owner: 'none',
    query: z.object({ next: z.string().optional(), intent: z.enum(['provider']).optional() }),
    refs: ['F-02', 'S5', 'S6', 'A2'],
  }, // 302, browser navigation
  auth_google_callback: {
    id: 'auth_google_callback',
    domain: 'auth',
    method: 'GET',
    path: '/auth/google/callback',
    access: ['public'],
    owner: 'none',
    refs: ['F-02'],
  }, // 302
  auth_confirm_email: {
    id: 'auth_confirm_email',
    domain: 'auth',
    method: 'POST',
    path: '/auth/confirm-email',
    access: ['public'],
    owner: 'none',
    body: ConfirmEmailBody,
    response: ConfirmEmailResult,
    refs: ['S8', 'A6'],
  },
  auth_resend_confirmation: {
    id: 'auth_resend_confirmation',
    domain: 'auth',
    method: 'POST',
    path: '/auth/resend-confirmation',
    access: ['user'],
    owner: 'self',
    rateLimited: true,
    refs: ['S7', 'S8', 'S12', 'A5'],
  },
  auth_forgot_password: {
    id: 'auth_forgot_password',
    domain: 'auth',
    method: 'POST',
    path: '/auth/forgot-password',
    access: ['public'],
    owner: 'none',
    body: ForgotPasswordBody,
    rateLimited: true,
    refs: ['S9', 'A7'],
  },
  auth_reset_password: {
    id: 'auth_reset_password',
    domain: 'auth',
    method: 'POST',
    path: '/auth/reset-password',
    access: ['public'],
    owner: 'none',
    body: ResetPasswordBody,
    rateLimited: true,
    refs: ['S10', 'A8'],
  },
  me_update: {
    id: 'me_update',
    domain: 'auth',
    method: 'PATCH',
    path: '/me',
    access: ['user'],
    owner: 'self',
    body: UpdateMeBody,
    response: Me,
    refs: ['S18', 'S12', 'S19', 'A9'],
  },
  me_password: {
    id: 'me_password',
    domain: 'auth',
    method: 'POST',
    path: '/me/password',
    access: ['user'],
    owner: 'self',
    body: ChangePasswordBody,
    refs: ['S18', 'A9'],
  },
  catalog_get: {
    id: 'catalog_get',
    domain: 'catalog',
    method: 'GET',
    path: '/catalog',
    access: ['public'],
    owner: 'none',
    response: CatalogResponse,
    refs: ['S1', 'S2', 'S12', 'S19', 'S24', 'S25'],
  },
  providers_featured: {
    id: 'providers_featured',
    domain: 'catalog',
    method: 'GET',
    path: '/providers/featured',
    access: ['public'],
    owner: 'none',
    response: z.array(ProviderCard),
    refs: ['F-05', 'S1', 'BR-08'],
  },
} as const satisfies Record<string, EndpointDef>;
export type EndpointId = keyof typeof ENDPOINTS;
