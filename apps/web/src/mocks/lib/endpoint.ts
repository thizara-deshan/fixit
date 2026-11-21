// apps/web/src/mocks/lib/endpoint.ts
import { http, HttpResponse, type JsonBodyType } from 'msw';
import type { z } from 'zod';
import type { EndpointDef } from '@fixit/contracts';
import type { MockDb } from '../db/schema';
import { commit, db } from '../db/store';
import { forcedResponse, simulateLatency, takeForcedError } from './controls';
import { errorResponse, mockError, toErrorResponse } from './errors';
import { resolveActor, tryResolveActor, type MockActor } from './identity';

type SchemaOut<S> = S extends z.ZodType ? z.output<S> : undefined;
type BodyOf<E> = E extends { body: infer S } ? SchemaOut<S> : undefined;
type QueryOf<E> = E extends { query: infer S } ? SchemaOut<S> : undefined;
// 204 endpoints return nothing, so their impl returns void.
// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
type ResultOf<E> = E extends { response: infer S extends z.ZodType } ? z.input<S> : void;

export interface MockCtx<E extends EndpointDef> {
  actor: MockActor | null;
  params: Record<string, string>;
  body: BodyOf<E>;
  query: QueryOf<E>;
  db: MockDb;
  now: Date;
  request: Request;
}

/** Same role semantics as the API (ARCH §3): 401 for anonymous, 403 for the wrong role. */
export function assertAccess(def: Pick<EndpointDef, 'access'>, actor: MockActor | null): void {
  if (def.access.includes('public')) return;
  if (!actor) throw mockError(401, 'UNAUTHENTICATED', 'Sign in required');
  const isAdmin = actor.roles.includes('admin');
  const ok =
    (def.access.includes('admin') && isAdmin) ||
    (def.access.includes('user') && !isAdmin) ||
    (def.access.includes('provider') && actor.roles.includes('provider'));
  if (!ok) throw mockError(403, 'FORBIDDEN', 'Role not allowed');
}

async function readJson(request: Request): Promise<unknown> {
  const text = await request.text();
  if (text === '') return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw mockError(400, 'VALIDATION_FAILED', 'Body is not valid JSON');
  }
}

const toStringParams = (
  params: Record<string, string | readonly string[] | undefined>,
): Record<string, string> =>
  Object.fromEntries(Object.entries(params).flatMap(([k, v]) => (typeof v === 'string' ? [[k, v]] : [])));

export function mockEndpoint<E extends EndpointDef>(
  def: E,
  impl: (ctx: MockCtx<E>) => ResultOf<E> | Promise<ResultOf<E>>,
) {
  const route = http[def.method.toLowerCase() as Lowercase<EndpointDef['method']>];
  return route(`/api${def.path}`, async ({ request, params }) => {
    await simulateLatency();
    const forced = takeForcedError(def.id);
    if (forced) return forcedResponse(forced);
    let out: ResultOf<E>;
    try {
      const actor = def.access.includes('public') ? tryResolveActor(request) : resolveActor(request);
      assertAccess(def, actor);
      const body = (def.body ? def.body.parse(await readJson(request)) : undefined) as BodyOf<E>;
      const query = (
        def.query ? def.query.parse(Object.fromEntries(new URL(request.url).searchParams)) : undefined
      ) as QueryOf<E>;
      // ResultOf<E> is void for 204 endpoints.
      // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
      const result = await impl({
        actor,
        params: toStringParams(params),
        body,
        query,
        db: db(),
        now: new Date(),
        request,
      });
      out = result;
    } catch (e) {
      return toErrorResponse(e);
    }
    commit(); // persist after every successful handler
    if (!def.response) return new HttpResponse(null, { status: 204 });
    const parsed = def.response.safeParse(out);
    if (!parsed.success) {
      console.error(`[mocks] ${def.id} response breaks its contract`, parsed.error);
      return errorResponse(500, 'INTERNAL', 'Mock response does not match the contract');
    }
    return HttpResponse.json(parsed.data as JsonBodyType);
  });
}
