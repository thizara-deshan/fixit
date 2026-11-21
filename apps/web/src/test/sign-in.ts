import type { AuthSession } from '@fixit/contracts';
import { DEMO_PERSONAS, type PersonaKey } from '@fixit/fixtures';
import { authStore } from '@/lib/auth-store';
import { db } from '@/mocks/db/store';
import { rolesOf } from '@/mocks/lib/identity';
import { buildMe } from '@/mocks/lib/me';
import { ACCESS_TOKEN_TTL_SEC, issueAccessToken, setMockRefresh } from '@/mocks/lib/tokens';

/** ARCH §9.4: puts a mock session in authStore (and the mock refresh entry) without an HTTP round-trip. */
export function signInAs(persona: PersonaKey): AuthSession {
  const p = DEMO_PERSONAS.find((x) => x.key === persona);
  if (!p) throw new Error(`unknown persona ${persona}`);
  const d = db();
  const session: AuthSession = {
    accessToken: issueAccessToken(p.userId, rolesOf(d, p.userId)),
    expiresIn: ACCESS_TOKEN_TTL_SEC,
    user: buildMe(d, p.userId),
  };
  setMockRefresh(p.userId);
  authStore.setSession(session);
  return session;
}
