import { describe, expect, it } from 'vitest';
import { FINAL_STATUSES, RequestStatus } from '../common/enums';
import { expiresAt } from './rules';
import {
  assertTransition,
  canTransition,
  TransitionError,
  type MachineActor,
  type MachineRequest,
  type TransitionReason,
} from './state-machine';

const CREATED = new Date('2026-03-09T04:30:00.000Z'); // 10:00 Colombo, 9 Mar
const NOW = new Date('2026-03-10T04:30:00.000Z'); // 10:00 Colombo, 10 Mar
const PREFERRED = '2026-03-15'; // cancelDeadline = 2026-03-14T18:30Z
const EXPIRES = expiresAt(CREATED, PREFERRED); // 2026-03-12T04:30Z (72 h bound)
const at = (iso: string) => new Date(iso);
const shift = (d: Date, ms: number) => new Date(d.getTime() + ms);

const P: MachineActor = { kind: 'provider', userId: 'p1' };
const OTHER_P: MachineActor = { kind: 'provider', userId: 'p2' };
const C: MachineActor = { kind: 'customer', userId: 'c1' };
const OTHER_C: MachineActor = { kind: 'customer', userId: 'c2' };
const A: MachineActor = { kind: 'admin', userId: 'a1' };
const S: MachineActor = { kind: 'system' };
const EVERY_ACTOR = [C, P, A, S];

const req = (status: RequestStatus): MachineRequest => ({
  status,
  customerId: 'c1',
  providerUserId: 'p1',
  preferredDate: PREFERRED,
  expiresAt: EXPIRES,
});
const OK = { ok: true };
const NO = (reason: TransitionReason) => ({ ok: false, reason });
const REASON_10 = 'a'.repeat(10);

it('fixture: request expires on the 72 h bound', () => {
  expect(EXPIRES.toISOString()).toBe('2026-03-12T04:30:00.000Z');
});

describe('from pending', () => {
  it('1 accepted by P before expiry → ok', () => {
    expect(canTransition(req('pending'), 'accepted', P, NOW)).toEqual(OK);
  });
  it('2 accepted by other provider → not_owner', () => {
    expect(canTransition(req('pending'), 'accepted', OTHER_P, NOW)).toEqual(NO('not_owner'));
  });
  it('3 accepted by C → not_allowed_for_actor', () => {
    expect(canTransition(req('pending'), 'accepted', C, NOW)).toEqual(NO('not_allowed_for_actor'));
  });
  it('4 accepted by admin → not_allowed_for_actor', () => {
    expect(canTransition(req('pending'), 'accepted', A, NOW)).toEqual(NO('not_allowed_for_actor'));
  });
  it('5 accepted by P at expiresAt → expired', () => {
    expect(canTransition(req('pending'), 'accepted', P, EXPIRES)).toEqual(NO('expired'));
  });
  it('6 declined by P → ok', () => {
    expect(canTransition(req('pending'), 'declined', P, NOW)).toEqual(OK);
  });
  it('7 declined by system (provider suspended) → ok', () => {
    expect(canTransition(req('pending'), 'declined', S, NOW)).toEqual(OK);
  });
  it('8 declined by C → not_allowed_for_actor', () => {
    expect(canTransition(req('pending'), 'declined', C, NOW)).toEqual(NO('not_allowed_for_actor'));
  });
  it('9 cancelled by C before expiry → ok', () => {
    expect(canTransition(req('pending'), 'cancelled', C, NOW)).toEqual(OK);
  });
  it('10 cancelled by other customer → not_owner', () => {
    expect(canTransition(req('pending'), 'cancelled', OTHER_C, NOW)).toEqual(NO('not_owner'));
  });
  it('11 cancelled by C after expiresAt → expired', () => {
    expect(canTransition(req('pending'), 'cancelled', C, shift(EXPIRES, 1))).toEqual(NO('expired'));
  });
  it('12 cancelled by admin with a 10-char reason → ok', () => {
    expect(canTransition(req('pending'), 'cancelled', A, NOW, { reason: REASON_10 })).toEqual(OK);
  });
  it.each([
    ['no reason', undefined],
    ['9 chars', 'a'.repeat(9)],
    ['501 chars', 'a'.repeat(501)],
    ['10 spaces', ' '.repeat(10)],
  ])('13 cancelled by admin with %s → reason_required', (_label, reason) => {
    expect(canTransition(req('pending'), 'cancelled', A, NOW, { reason })).toEqual(NO('reason_required'));
  });
  it('14 cancelled by system (customer suspended) → ok', () => {
    expect(canTransition(req('pending'), 'cancelled', S, NOW)).toEqual(OK);
  });
  it('15 cancelled by P → not_allowed_for_actor (providers never cancel)', () => {
    expect(canTransition(req('pending'), 'cancelled', P, NOW)).toEqual(NO('not_allowed_for_actor'));
  });
  it('16 expired by system at expiresAt → ok', () => {
    expect(canTransition(req('pending'), 'expired', S, EXPIRES)).toEqual(OK);
  });
  it('17 expired by system 1 ms before expiresAt → not_yet_expired', () => {
    expect(canTransition(req('pending'), 'expired', S, shift(EXPIRES, -1))).toEqual(NO('not_yet_expired'));
  });
  it.each([C, P, A])('18 expired by $kind → not_allowed_for_actor', (actor) => {
    expect(canTransition(req('pending'), 'expired', actor, EXPIRES)).toEqual(NO('not_allowed_for_actor'));
  });
  it('19 completed by P → invalid_transition', () => {
    expect(canTransition(req('pending'), 'completed', P, NOW)).toEqual(NO('invalid_transition'));
  });
  it.each(EVERY_ACTOR)('32 pending → pending by $kind → invalid_transition', (actor) => {
    expect(canTransition(req('pending'), 'pending', actor, NOW)).toEqual(NO('invalid_transition'));
  });
});

describe('from accepted', () => {
  it('20 cancelled by C at 23:59 Colombo the day before → ok', () => {
    expect(canTransition(req('accepted'), 'cancelled', C, at('2026-03-14T18:29:00.000Z'))).toEqual(OK);
  });
  it('21 cancelled by C at 00:00 on preferredDate → past_cancel_deadline', () => {
    expect(canTransition(req('accepted'), 'cancelled', C, at('2026-03-14T18:30:00.000Z'))).toEqual(
      NO('past_cancel_deadline'),
    );
  });
  it('22 cancelled by admin with reason after the cut-off → ok', () => {
    expect(
      canTransition(req('accepted'), 'cancelled', A, at('2026-03-14T20:00:00.000Z'), { reason: REASON_10 }),
    ).toEqual(OK);
  });
  it('23 cancelled by system (suspension) after the cut-off → ok', () => {
    expect(canTransition(req('accepted'), 'cancelled', S, at('2026-03-14T20:00:00.000Z'))).toEqual(OK);
  });
  it('24 cancelled by P → not_allowed_for_actor', () => {
    expect(canTransition(req('accepted'), 'cancelled', P, NOW)).toEqual(NO('not_allowed_for_actor'));
  });
  it('25 completed by P on preferredDate → ok', () => {
    expect(canTransition(req('accepted'), 'completed', P, at('2026-03-15T06:00:00.000Z'))).toEqual(OK);
  });
  it.each([
    ['a day earlier', '2026-03-13T06:00:00.000Z'],
    ['23:59 Colombo the day before (18:29 UTC)', '2026-03-14T18:29:00.000Z'],
  ])('26 completed by P %s → before_preferred_date', (_label, iso) => {
    expect(canTransition(req('accepted'), 'completed', P, at(iso))).toEqual(NO('before_preferred_date'));
  });
  it('26b completed by P at 00:00 Colombo on preferredDate (18:30 UTC day before) → ok', () => {
    expect(canTransition(req('accepted'), 'completed', P, at('2026-03-14T18:30:00.000Z'))).toEqual(OK);
  });
  it('27 completed by P 30 days after preferredDate → ok', () => {
    expect(canTransition(req('accepted'), 'completed', P, at('2026-04-14T06:00:00.000Z'))).toEqual(OK);
  });
  it.each([C, A])('28 completed by $kind → not_allowed_for_actor', (actor) => {
    expect(canTransition(req('accepted'), 'completed', actor, at('2026-03-15T06:00:00.000Z'))).toEqual(
      NO('not_allowed_for_actor'),
    );
  });
  const case29 = (['declined', 'expired', 'pending'] as const).flatMap((to) =>
    EVERY_ACTOR.map((actor) => ({ to, actor })),
  );
  it.each(case29)('29 accepted → $to by $actor.kind → invalid_transition', ({ to, actor }) => {
    expect(canTransition(req('accepted'), to, actor, NOW)).toEqual(NO('invalid_transition'));
  });
  it('30 completed by other provider → not_owner', () => {
    expect(canTransition(req('accepted'), 'completed', OTHER_P, at('2026-03-15T06:00:00.000Z'))).toEqual(
      NO('not_owner'),
    );
  });
  it('33 accepted → accepted by P → invalid_transition', () => {
    expect(canTransition(req('accepted'), 'accepted', P, NOW)).toEqual(NO('invalid_transition'));
  });
});

describe('31 final statuses', () => {
  const cases = FINAL_STATUSES.flatMap((from) =>
    RequestStatus.options.flatMap((to) => EVERY_ACTOR.map((actor) => ({ from, to, actor }))),
  );
  it('covers 4 × 6 × 4 combinations', () => {
    expect(cases).toHaveLength(96);
  });
  it.each(cases)('$from → $to by $actor.kind → final_status', ({ from, to, actor }) => {
    expect(canTransition(req(from), to, actor, NOW, { reason: REASON_10 })).toEqual(NO('final_status'));
  });
});

describe('assertTransition', () => {
  it('returns on an allowed transition', () => {
    expect(() => {
      assertTransition(req('pending'), 'accepted', P, NOW);
    }).not.toThrow();
  });
  it('throws TransitionError carrying the reason', () => {
    try {
      assertTransition(req('completed'), 'cancelled', C, NOW);
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(TransitionError);
      expect((e as TransitionError).reason).toBe('final_status');
    }
  });
});
