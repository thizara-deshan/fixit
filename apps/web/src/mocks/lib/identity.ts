import { AccessTokenClaims, deriveRoles, type Role } from '@fixit/contracts';
import { db } from '../db/store';
import type { MockDb } from '../db/schema';
import { mockError } from './errors';
import { decodeJwtPayload } from './tokens';

export interface MockActor {
  userId: string;
  roles: Role[];
}

export function isPublished(d: MockDb, userId: string): boolean {
  return Object.values(d.providers).some((p) => p.userId === userId && p.onboardingComplete);
}

export function rolesOf(d: MockDb, userId: string): Role[] {
  return deriveRoles({
    isAdmin: d.users[userId]?.isAdmin ?? false,
    providerPublished: isPublished(d, userId),
  });
}

/** Bearer → actor. Mock tokens AND real JWTs (payload read, not verified — D2). No header → null. */
export function resolveActor(request: Request, now: Date = new Date()): MockActor | null {
  const header = request.headers.get('Authorization');
  if (!header?.startsWith('Bearer ')) return null;
  const claims = AccessTokenClaims.safeParse(decodeJwtPayload(header.slice(7)));
  if (!claims.success || claims.data.exp * 1000 <= now.getTime()) {
    throw mockError(401, 'UNAUTHENTICATED', 'Access token missing, invalid or expired');
  }
  const d = db();
  const user = d.users[claims.data.sub];
  if (!user) return { userId: claims.data.sub, roles: claims.data.roles }; // shadow user registered against the real API
  if (user.status === 'suspended') throw mockError(401, 'ACCOUNT_SUSPENDED', 'Account suspended');
  return { userId: user.id, roles: rolesOf(d, user.id) };
}

/** Public endpoints ignore a bad or expired token instead of failing (e.g. logging in again after expiry). */
export function tryResolveActor(request: Request): MockActor | null {
  try {
    return resolveActor(request);
  } catch {
    return null;
  }
}
