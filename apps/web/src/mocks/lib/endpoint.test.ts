import { describe, expect, it } from 'vitest';
import type { Access } from '@fixit/contracts';
import { MockHttpError } from './errors';
import type { MockActor } from './identity';
import { assertAccess } from './endpoint';

const customer: MockActor = { userId: 'u-olivia', roles: ['customer'] };
const provider: MockActor = { userId: 'u-marcus', roles: ['customer', 'provider'] };
const admin: MockActor = { userId: 'u-admin', roles: ['admin'] };

const outcome = (access: readonly Access[], actor: MockActor | null): number | 'ok' => {
  try {
    assertAccess({ access }, actor);
    return 'ok';
  } catch (e) {
    if (e instanceof MockHttpError) return e.status;
    throw e;
  }
};

describe('assertAccess', () => {
  it.each([
    [['public'], null, 'ok'],
    [['public'], admin, 'ok'],
    [['user', 'admin'], null, 401],
    [['user', 'admin'], customer, 'ok'],
    [['user', 'admin'], admin, 'ok'],
    [['user'], admin, 403],
    [['user'], provider, 'ok'],
    [['provider'], customer, 403],
    [['provider'], provider, 'ok'],
    [['provider'], admin, 403],
    [['admin'], customer, 403],
    [['admin'], admin, 'ok'],
  ] as const)('%j with %j → %s', (access, actor, expected) => {
    expect(outcome(access, actor)).toBe(expected);
  });
});
