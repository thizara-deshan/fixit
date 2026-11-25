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
import {
  CatalogResponse,
  DiscoverQuery,
  DiscoverResult,
  ProviderCard,
  ProviderPublicProfile,
  PublicReviewPage,
} from './catalog/schemas';
import { PageQuery } from './common/pagination';
import { CreateRequestBody, CustomerRequestView, Eligibility } from './requests/schemas';

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
  providers_search: {
    id: 'providers_search',
    domain: 'catalog',
    method: 'GET',
    path: '/providers',
    access: ['public'],
    owner: 'none',
    query: DiscoverQuery,
    response: DiscoverResult,
    refs: ['F-06', 'F-07', 'F-08', 'S2'],
  },
  providers_get: {
    id: 'providers_get',
    domain: 'catalog',
    method: 'GET',
    path: '/providers/:id',
    access: ['public'],
    owner: 'none',
    response: ProviderPublicProfile,
    refs: ['F-09', 'S3', 'BR-01', 'BR-41'],
  },
  providers_reviews: {
    id: 'providers_reviews',
    domain: 'catalog',
    method: 'GET',
    path: '/providers/:id/reviews',
    access: ['public'],
    owner: 'none',
    query: PageQuery,
    response: PublicReviewPage,
    refs: ['S3.E11', 'F-23', 'D-003'],
  },
  requests_eligibility: {
    id: 'requests_eligibility',
    domain: 'requests',
    method: 'GET',
    path: '/me/request-eligibility/:providerId',
    access: ['user'],
    owner: 'self',
    response: Eligibility,
    refs: ['F-14', 'S3.E7', 'S12'],
  },
  requests_create: {
    id: 'requests_create',
    domain: 'requests',
    method: 'POST',
    path: '/me/requests',
    access: ['user'],
    owner: 'self',
    body: CreateRequestBody,
    response: CustomerRequestView,
    refs: ['F-11', 'F-14', 'S12', 'A11'],
  },
  requests_get: {
    id: 'requests_get',
    domain: 'requests',
    method: 'GET',
    path: '/me/requests/:ref',
    access: ['user'],
    owner: 'request_customer',
    response: CustomerRequestView,
    refs: ['S13', 'S15'],
  },
} as const satisfies Record<string, EndpointDef>;
export type EndpointId = keyof typeof ENDPOINTS;
