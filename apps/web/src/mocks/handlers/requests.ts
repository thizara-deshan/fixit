import { checkCreateRequest, ENDPOINTS as E, expiresAt, type RequestRecord } from '@fixit/contracts';
import { expireDue } from '../db/expire';
import { isListed } from '../lib/cards';
import { mockEndpoint } from '../lib/endpoint';
import { mockError } from '../lib/errors';
import { eligibilityFor } from '../lib/profile';
import {
  applyTransition,
  customerViewOf,
  inboxList,
  myRequestList,
  openRequestsOf,
  ownInboxRequest,
  ownProvider,
  providerViewOf,
  transitionOr409,
} from '../lib/requests';

export const requestsHandlers = [
  mockEndpoint(E.requests_eligibility, ({ db: d, actor, params }) => {
    if (!actor) throw mockError(401, 'UNAUTHENTICATED', 'Sign in required'); // assertAccess already guarantees this
    return eligibilityFor(d, actor.userId, params.providerId ?? '');
  }),

  mockEndpoint(E.requests_create, ({ db: d, actor, body, now }) => {
    if (!actor) throw mockError(401, 'UNAUTHENTICATED', 'Sign in required');
    expireDue(d, now);
    const user = d.users[actor.userId];
    if (!user) throw mockError(401, 'UNAUTHENTICATED', 'Unknown user');
    const p = d.providers[body.providerId];
    const open = openRequestsOf(d, user.id);
    const check = checkCreateRequest({
      now,
      customer: {
        id: user.id,
        emailConfirmed: user.emailConfirmedAt !== null,
        hasMobile: user.mobile !== null,
      },
      provider: p
        ? {
            userId: p.userId,
            listed: isListed(d, p),
            paused: p.paused,
            serviceIds: Object.values(d.services)
              .filter((s) => s.providerId === p.id)
              .map((s) => s.id),
            townIds: d.areas.filter((a) => a.providerId === p.id).map((a) => a.townId),
          }
        : { userId: '', listed: false, paused: false, serviceIds: [], townIds: [] },
      openTotal: open.length,
      openWithProviderRef: open.find((r) => r.providerId === body.providerId)?.ref ?? null,
      body,
    });
    if (!check.ok)
      throw mockError(422, 'RULE_VIOLATION', check.rule, {
        details: { rule: check.rule, ...(check.ref ? { ref: check.ref } : {}) },
      });
    const service = d.services[body.serviceId];
    // unreachable after checkCreateRequest (listed + service_not_offered), but narrows the types
    if (!p || !service) throw mockError(500, 'INTERNAL', 'Provider or service vanished');
    if (user.mobile === null && body.mobile !== undefined) user.mobile = body.mobile; // BR-23: saved to the profile
    if (user.mobile === null) throw mockError(500, 'INTERNAL', 'mobile_missing passed without a mobile');
    const at = now.toISOString();
    const ref = `FX-${String(d.refSeq)}`;
    d.refSeq += 1;
    const record: RequestRecord = {
      id: `r-${ref}`,
      ref,
      customerId: user.id,
      providerId: p.id,
      providerUserId: p.userId,
      serviceId: service.id,
      service: { name: service.name, price: service.price, unit: service.unit },
      preferredDate: body.preferredDate,
      slot: body.slot,
      townId: body.townId,
      addressLine1: body.addressLine1,
      addressLine2: body.addressLine2 ?? null,
      description: body.description,
      customerMobile: user.mobile,
      agreedPrice: null,
      status: 'pending',
      reason: null,
      closedBy: null,
      createdAt: at,
      updatedAt: at,
      expiresAt: expiresAt(now, body.preferredDate).toISOString(),
      completedAt: null,
      events: [{ status: 'pending', at, actor: 'customer', actorUserId: user.id, reason: null }],
    };
    d.requests[record.id] = record;
    return customerViewOf(d, record, now);
  }),

  mockEndpoint(E.requests_get, ({ db: d, actor, params, now }) => {
    if (!actor) throw mockError(401, 'UNAUTHENTICATED', 'Sign in required');
    expireDue(d, now);
    const r = Object.values(d.requests).find((x) => x.ref === params.ref && x.customerId === actor.userId);
    if (!r) throw mockError(404, 'NOT_FOUND', 'Request not found'); // other owner → 404, never 403
    return customerViewOf(d, r, now);
  }),

  mockEndpoint(E.requests_list, ({ db: d, actor, query, now }) => {
    if (!actor) throw mockError(401, 'UNAUTHENTICATED', 'Sign in required');
    expireDue(d, now);
    return myRequestList(d, actor.userId, query, now);
  }),

  mockEndpoint(E.requests_cancel, ({ db: d, actor, params, body, now }) => {
    if (!actor) throw mockError(401, 'UNAUTHENTICATED', 'Sign in required');
    expireDue(d, now);
    const r = Object.values(d.requests).find((x) => x.ref === params.ref && x.customerId === actor.userId);
    if (!r) throw mockError(404, 'NOT_FOUND', 'Request not found'); // other owner → 404
    transitionOr409(r, 'cancelled', { kind: 'customer', userId: actor.userId }, now, { reason: body.reason });
    const at = now.toISOString();
    r.status = 'cancelled';
    r.closedBy = 'customer';
    r.reason = body.reason ?? null;
    r.updatedAt = at;
    r.events.push({
      status: 'cancelled',
      at,
      actor: 'customer',
      actorUserId: actor.userId,
      reason: body.reason ?? null,
    });
    return customerViewOf(d, r, now);
  }),

  mockEndpoint(E.requests_inbox_list, ({ db: d, actor, query, now }) => {
    if (!actor) throw mockError(401, 'UNAUTHENTICATED', 'Sign in required');
    expireDue(d, now);
    const p = ownProvider(d, actor.userId);
    return inboxList(d, p.id, query, now);
  }),

  mockEndpoint(E.requests_inbox_get, ({ db: d, actor, params, now }) => {
    if (!actor) throw mockError(401, 'UNAUTHENTICATED', 'Sign in required');
    expireDue(d, now);
    const p = ownProvider(d, actor.userId);
    return providerViewOf(d, ownInboxRequest(d, p.id, params.ref ?? ''), now);
  }),

  mockEndpoint(E.requests_accept, ({ db: d, actor, params, body, now }) => {
    if (!actor) throw mockError(401, 'UNAUTHENTICATED', 'Sign in required');
    const p = ownProvider(d, actor.userId);
    const r = ownInboxRequest(d, p.id, params.ref ?? '');
    // D-5: no sweep first — a lapsed Pending is refused `expired` by the state machine.
    transitionOr409(r, 'accepted', { kind: 'provider', userId: actor.userId }, now);
    applyTransition(r, 'accepted', 'provider', actor.userId, now);
    r.agreedPrice = body.agreedPrice ?? null;
    return providerViewOf(d, r, now);
  }),

  mockEndpoint(E.requests_decline, ({ db: d, actor, params, body, now }) => {
    if (!actor) throw mockError(401, 'UNAUTHENTICATED', 'Sign in required');
    const p = ownProvider(d, actor.userId);
    const r = ownInboxRequest(d, p.id, params.ref ?? '');
    transitionOr409(r, 'declined', { kind: 'provider', userId: actor.userId }, now); // D-5
    applyTransition(r, 'declined', 'provider', actor.userId, now, body.reason ?? null);
    return providerViewOf(d, r, now);
  }),

  mockEndpoint(E.requests_complete, ({ db: d, actor, params, body, now }) => {
    if (!actor) throw mockError(401, 'UNAUTHENTICATED', 'Sign in required');
    const p = ownProvider(d, actor.userId);
    const r = ownInboxRequest(d, p.id, params.ref ?? '');
    transitionOr409(r, 'completed', { kind: 'provider', userId: actor.userId }, now);
    if (body.agreedPrice !== undefined) r.agreedPrice = body.agreedPrice; // D-11: omitted = unchanged
    applyTransition(r, 'completed', 'provider', actor.userId, now);
    return providerViewOf(d, r, now);
  }),

  mockEndpoint(E.requests_agreed_price, ({ db: d, actor, params, body, now }) => {
    if (!actor) throw mockError(401, 'UNAUTHENTICATED', 'Sign in required');
    const p = ownProvider(d, actor.userId);
    const r = ownInboxRequest(d, p.id, params.ref ?? '');
    if (r.status !== 'accepted')
      throw mockError(409, 'INVALID_TRANSITION', 'Agreed price can only change while Accepted', {
        details: { reason: 'invalid_transition', status: r.status },
      });
    r.agreedPrice = body.agreedPrice;
    r.updatedAt = now.toISOString();
    return providerViewOf(d, r, now);
  }),
];
