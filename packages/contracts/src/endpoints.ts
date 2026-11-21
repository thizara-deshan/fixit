import type { z } from 'zod';
import { AuthSession, LoginBody, Me } from './auth/schemas';

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
} as const satisfies Record<string, EndpointDef>;
export type EndpointId = keyof typeof ENDPOINTS;
