import { computeStartingPrice, SERVICES_MAX, type Service, type ServiceBody } from '@fixit/contracts';
import type { FxProvider, FxService } from '@fixit/fixtures';
import type { MockDb } from '../db/schema';
import { mockError } from './errors';
import { ruleError } from './own-provider';

export const servicesOf = (d: MockDb, providerId: string): FxService[] =>
  Object.values(d.services).filter((s) => s.providerId === providerId);

export const toService = ({ id, name, price, unit }: FxService): Service => ({ id, name, price, unit });

/** BR-10, recomputed in the same write as the service change (ARCH §7.7). */
export function recomputeStartingPrice(d: MockDb, p: FxProvider): void {
  const s = computeStartingPrice(servicesOf(d, p.id));
  p.startingPrice = s?.amount ?? null;
  p.startingUnit = s?.unit ?? null;
}

function assertUniqueName(d: MockDb, p: FxProvider, name: string, exceptId?: string): void {
  const key = name.trim().toLowerCase();
  if (servicesOf(d, p.id).some((s) => s.id !== exceptId && s.name.trim().toLowerCase() === key))
    throw mockError(409, 'CONFLICT', 'Service name taken', { details: { rule: 'service_name_taken' } });
}

/** Another provider's or unknown id → 404 (ARCH §3). */
export function ownService(d: MockDb, p: FxProvider, id: string): FxService {
  const s = d.services[id];
  if (!s || s.providerId !== p.id) throw mockError(404, 'NOT_FOUND', 'Service not found');
  return s;
}

export function createService(d: MockDb, p: FxProvider, body: ServiceBody): FxService {
  if (servicesOf(d, p.id).length >= SERVICES_MAX) throw ruleError('services_max');
  assertUniqueName(d, p, body.name);
  const s: FxService = { id: crypto.randomUUID(), providerId: p.id, ...body };
  d.services[s.id] = s;
  recomputeStartingPrice(d, p);
  return s;
}

export function updateService(d: MockDb, p: FxProvider, id: string, body: ServiceBody): FxService {
  const s = ownService(d, p, id);
  assertUniqueName(d, p, body.name, id);
  Object.assign(s, body);
  recomputeStartingPrice(d, p);
  return s;
}

export function deleteService(d: MockDb, p: FxProvider, id: string): void {
  ownService(d, p, id);
  if (servicesOf(d, p.id).length <= 1) throw ruleError('services_min');
  Reflect.deleteProperty(d.services, id);
  recomputeStartingPrice(d, p);
}
