import { HttpResponse } from 'msw';
import { ZodError } from 'zod';
import { ErrorEnvelope, TransitionError, type ErrorCode } from '@fixit/contracts';

type Extra = Pick<ErrorEnvelope['error'], 'fieldErrors' | 'details'>;

export class MockHttpError extends Error {
  override readonly name = 'MockHttpError';
  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    message: string,
    readonly extra: Extra = {},
  ) {
    super(message);
  }
}

export const mockError = (
  status: number,
  code: ErrorCode,
  message: string = code,
  extra: Extra = {},
): MockHttpError => new MockHttpError(status, code, message, extra);

export function errorResponse(status: number, code: ErrorCode, message: string, extra: Extra = {}): Response {
  const body = ErrorEnvelope.parse({
    error: { code, message, requestId: `mock-${crypto.randomUUID()}`, ...extra },
  });
  return HttpResponse.json(body, { status });
}

export function toFieldErrors(e: ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of e.issues) {
    const key = issue.path.map(String).join('.') || '_form';
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

/** MockHttpError | ZodError (request parsing) | TransitionError → ErrorEnvelope, like the API filter (ARCH §7.3). */
export function toErrorResponse(e: unknown): Response {
  if (e instanceof MockHttpError) return errorResponse(e.status, e.code, e.message, e.extra);
  if (e instanceof ZodError)
    return errorResponse(400, 'VALIDATION_FAILED', 'Validation failed', { fieldErrors: toFieldErrors(e) });
  if (e instanceof TransitionError)
    return errorResponse(409, 'INVALID_TRANSITION', e.message, { details: { reason: e.reason } });
  console.error('[mocks] unhandled error', e);
  return errorResponse(500, 'INTERNAL', 'Mock handler crashed');
}
