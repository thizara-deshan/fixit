import { z } from 'zod';
import { AuthMethod, ReverificationReason, Role, VerificationStatus } from '../common/enums';
import { Email, Id, Mobile } from '../common/primitives';

export const LoginBody = z.object({
  email: Email,
  password: z.string().min(1, 'Enter your password.'),
});
export type LoginBody = z.infer<typeof LoginBody>;

export const Me = z.object({
  id: Id,
  fullName: z.string(),
  displayName: z.string(),
  email: z.string(),
  emailConfirmed: z.boolean(),
  mobile: Mobile.nullable(),
  authMethods: z.array(AuthMethod),
  roles: z.array(Role), // ['admin'] | ['customer'] | ['customer','provider']
  openRequestCount: z.number().int(), // BR-33 UX hint
  provider: z
    .object({
      id: Id,
      businessName: z.string().nullable(), // null while draft step 1 incomplete
      onboarding: z.object({ complete: z.boolean(), step: z.number().int().min(1).max(5) }),
      verificationStatus: VerificationStatus,
      reverificationReason: ReverificationReason.nullable(),
      rejectionReason: z.string().nullable(),
      paused: z.boolean(),
      pendingRequestCount: z.number().int(),
    })
    .nullable(), // null = never started onboarding
});
export type Me = z.infer<typeof Me>;

export const AuthSession = z.object({ accessToken: z.string(), expiresIn: z.number().int(), user: Me });
export type AuthSession = z.infer<typeof AuthSession>;

export const AccessTokenClaims = z.object({
  sub: Id,
  roles: z.array(Role),
  iat: z.number(),
  exp: z.number(),
});
export type AccessTokenClaims = z.infer<typeof AccessTokenClaims>;
