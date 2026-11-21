import { z } from 'zod';
import { RequestActor, RequestStatus, TimeSlot } from '../common/enums';
import { Id, IsoDate, IsoDateTime, Lkr, Mobile, RequestRef } from '../common/primitives';
import { ServiceSnapshot } from './schemas';
import type { MachineRequest } from './state-machine';

export const StatusEventRecord = z.object({
  status: RequestStatus,
  at: IsoDateTime,
  actor: RequestActor,
  actorUserId: Id.nullable(),
  reason: z.string().nullable(),
});
export type StatusEventRecord = z.infer<typeof StatusEventRecord>;

/** Storage-neutral request row: what the mock db stores and what API mappers build from Prisma rows. Projections (M08) take this. */
export const RequestRecord = z.object({
  id: Id,
  ref: RequestRef,
  customerId: Id,
  providerId: Id,
  providerUserId: Id,
  serviceId: Id.nullable(),
  service: ServiceSnapshot,
  preferredDate: IsoDate,
  slot: TimeSlot,
  townId: Id,
  addressLine1: z.string(),
  addressLine2: z.string().nullable(),
  description: z.string(),
  customerMobile: Mobile,
  agreedPrice: Lkr.nullable(),
  status: RequestStatus,
  reason: z.string().nullable(),
  closedBy: RequestActor.nullable(),
  createdAt: IsoDateTime,
  updatedAt: IsoDateTime,
  expiresAt: IsoDateTime,
  completedAt: IsoDateTime.nullable(),
  events: z.array(StatusEventRecord), // oldest first
});
export type RequestRecord = z.infer<typeof RequestRecord>;

export function toMachineRequest(r: RequestRecord): MachineRequest {
  return {
    status: r.status,
    customerId: r.customerId,
    providerUserId: r.providerUserId,
    preferredDate: r.preferredDate,
    expiresAt: new Date(r.expiresAt),
  };
}
