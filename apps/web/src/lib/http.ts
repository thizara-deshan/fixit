import type { z } from 'zod';
import { AuthSession, ErrorEnvelope, type EndpointDef, type ErrorCode } from '@fixit/contracts';
import { authStore } from './auth-store';

export class ApiError extends Error {
  override readonly name = 'ApiError';
  constructor(
    readonly status: number,
    readonly code: ErrorCode | 'NETWORK',
    message: string,
    readonly envelope?: ErrorEnvelope['error'],
  ) {
    super(message);
  }
  get rule() {
    return this.envelope?.details?.rule;
  }
  get fieldErrors() {
    return this.envelope?.fieldErrors;
  }
}

type QueryValue = string | number | boolean | readonly string[] | undefined;
export type Query = Record<string, QueryValue>;
export interface HttpOpts<S extends z.ZodType | undefined> {
  method?: EndpointDef['method'];
  query?: Query;
  body?: unknown;
  form?: FormData;
  schema: S;
  signal?: AbortSignal;
}
type Out<S> = S extends z.ZodType ? z.output<S> : undefined;

/** D-a: a 401 from these is an answer (bad credentials, no session), not an expired access token. */
const NO_REFRESH_PATHS = new Set([
  '/auth/login',
  '/auth/admin/login',
  '/auth/register',
  '/auth/google/mock',
  '/auth/refresh',
  '/auth/logout',
]);

/** D-f: absolute URL so Node fetch (Vitest) and the browser behave the same. */
export function apiUrl(path: string, query: Query = {}): string {
  const url = new URL(`/api${path}`, window.location.origin);
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) continue;
    if (typeof value === 'object') for (const v of value) url.searchParams.append(key, v);
    else url.searchParams.set(key, String(value));
  }
  return url.toString();
}

/** '/me/requests/:ref' + { ref } → '/me/requests/FX-2061' */
export function pathOf(def: Pick<EndpointDef, 'path'>, params: Record<string, string> = {}): string {
  return def.path.replace(/:([A-Za-z]+)/g, (_match, name: string) => {
    const value = params[name];
    if (value === undefined) throw new Error(`pathOf: missing :${name} for ${def.path}`);
    return encodeURIComponent(value);
  });
}

export async function http<S extends z.ZodType | undefined>(
  path: string,
  opts: HttpOpts<S>,
): Promise<Out<S>> {
  const hadToken = authStore.accessToken() !== null;
  let res = await send(path, opts);
  if (res.status === 401 && hadToken && !NO_REFRESH_PATHS.has(path)) {
    if (await refreshOnce())
      res = await send(path, opts); // exactly one retry
    else authStore.signOut(lastRefreshFailure === 'ACCOUNT_SUSPENDED' ? 'suspended' : 'expired');
  }
  if (!res.ok) throw await toApiError(res);
  if (opts.schema === undefined || res.status === 204) return undefined as Out<S>;
  return opts.schema.parse(await res.json()) as Out<S>; // contract mismatch → ZodError → S41 (M03)
}

async function send(path: string, o: HttpOpts<z.ZodType | undefined>): Promise<Response> {
  const headers = new Headers({ Accept: 'application/json' });
  const token = authStore.accessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  let body: BodyInit | null = null;
  if (o.form) body = o.form;
  else if (o.body !== undefined) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(o.body);
  }
  try {
    return await fetch(apiUrl(path, o.query), {
      method: o.method ?? 'GET',
      headers,
      body,
      signal: o.signal ?? null,
      credentials: 'same-origin',
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e;
    throw new ApiError(0, 'NETWORK', 'Network error');
  }
}

async function readEnvelope(res: Response): Promise<ErrorEnvelope['error'] | undefined> {
  try {
    const parsed = ErrorEnvelope.safeParse(await res.json());
    return parsed.success ? parsed.data.error : undefined;
  } catch {
    return undefined;
  }
}

async function toApiError(res: Response): Promise<ApiError> {
  const env = await readEnvelope(res);
  return env
    ? new ApiError(res.status, env.code, env.message, env)
    : new ApiError(res.status, 'INTERNAL', `HTTP ${String(res.status)}`);
}

let refreshing: Promise<boolean> | null = null;
let lastRefreshFailure: ErrorCode | 'NETWORK' | null = null;

/** Single-flight: concurrent 401s share one refresh. Also used once at boot to restore the session. */
export function refreshOnce(): Promise<boolean> {
  refreshing ??= (async () => {
    try {
      const res = await fetch(apiUrl('/auth/refresh'), {
        method: 'POST',
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
      });
      if (!res.ok) {
        lastRefreshFailure = (await readEnvelope(res))?.code ?? 'INTERNAL';
        return false;
      }
      authStore.setSession(AuthSession.parse(await res.json()));
      lastRefreshFailure = null;
      return true;
    } catch {
      lastRefreshFailure = 'NETWORK';
      return false;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}
