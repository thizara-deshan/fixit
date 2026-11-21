import type { z } from 'zod';

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
export const ENDPOINTS = {} as const satisfies Record<string, EndpointDef>;
export type EndpointId = keyof typeof ENDPOINTS;
