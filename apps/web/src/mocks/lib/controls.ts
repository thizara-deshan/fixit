import { HttpResponse } from 'msw';
import { z } from 'zod';
import { errorResponse } from './errors';

export const LATENCIES = ['zero', 'normal', 'slow'] as const;
export type Latency = (typeof LATENCIES)[number];
export const FORCED_KINDS = ['500', '409', '401', 'network', 'rule_provider_paused'] as const;
export type ForcedKind = (typeof FORCED_KINDS)[number];
export const ANY_ENDPOINT = '*';

const KEY = 'fixit.mock.controls';
const Controls = z.object({
  latency: z.enum(LATENCIES).catch('normal'),
  forced: z.record(z.string(), z.enum(FORCED_KINDS)).catch({}),
});
export type MockControls = z.infer<typeof Controls>;

export function getControls(): MockControls {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = Controls.safeParse(raw ? JSON.parse(raw) : {});
    return parsed.success ? parsed.data : { latency: 'normal', forced: {} };
  } catch {
    return { latency: 'normal', forced: {} };
  }
}

function save(c: MockControls): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(c));
  } catch {
    // storage unavailable: controls fall back to defaults
  }
}

export function setLatency(latency: Latency): void {
  save({ ...getControls(), latency });
}

export function armForcedError(target: string, kind: ForcedKind): void {
  const c = getControls();
  save({ ...c, forced: { ...c.forced, [target]: kind } });
}

export function clearForcedErrors(): void {
  save({ ...getControls(), forced: {} });
}

/** Consumes the forced error for this endpoint id, else the "any request" one. */
export function takeForcedError(endpointId: string): ForcedKind | null {
  const c = getControls();
  const key = endpointId in c.forced ? endpointId : ANY_ENDPOINT in c.forced ? ANY_ENDPOINT : null;
  if (key === null) return null;
  const kind = c.forced[key] ?? null;
  const forced = Object.fromEntries(Object.entries(c.forced).filter(([k]) => k !== key));
  save({ ...c, forced });
  return kind;
}

export async function simulateLatency(): Promise<void> {
  const { latency } = getControls();
  const ms = latency === 'zero' ? 0 : latency === 'slow' ? 2000 : 300 + Math.round(Math.random() * 500);
  if (ms > 0) await new Promise((resolve) => setTimeout(resolve, ms));
}

export function forcedResponse(kind: ForcedKind): Response {
  switch (kind) {
    case 'network':
      return HttpResponse.error();
    case '401':
      return errorResponse(401, 'UNAUTHENTICATED', 'Forced 401 (DevPanel)');
    case '409':
      return errorResponse(409, 'INVALID_TRANSITION', 'Forced 409 (DevPanel)', {
        details: { reason: 'invalid_transition' },
      });
    case '500':
      return errorResponse(500, 'INTERNAL', 'Forced 500 (DevPanel)');
    case 'rule_provider_paused':
      return errorResponse(422, 'RULE_VIOLATION', 'Forced provider_paused (DevPanel)', {
        details: { rule: 'provider_paused' },
      });
  }
}
