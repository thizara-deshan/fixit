import { z } from 'zod';
import { AuthMethod, ReverificationReason, Role, VerificationStatus } from '../common/enums';
import { Email, FullName, Id, Mobile, MobileOrEmpty, Password } from '../common/primitives';

export const LoginBody = z.object({
  email: Email,
  password: z.string().min(1, 'Enter your password.'),
});
export type LoginBody = z.infer<typeof LoginBody>;

/* ---------- SPEC copy used by forms and the server (written once) ---------- */
export const EMAIL_TAKEN = 'This email already has an account.';
export const PASSWORDS_DONT_MATCH = "Passwords don't match.";
export const PASSWORD_REUSED = "Choose a password you haven't just used.";
export const CURRENT_PASSWORD_WRONG = 'Current password is incorrect.';
export const PROVIDER_MOBILE_REQUIRED = 'Providers need a mobile number — customers use it after you accept.';

export const SignupIntent = z.enum(['provider']);
export type SignupIntent = z.infer<typeof SignupIntent>;

/** S6 / A1. `intent` is informational for the server; the client keeps it for S8 (D-3). */
export const RegisterBody = z.object({
  fullName: FullName,
  email: Email,
  password: Password,
  intent: SignupIntent.optional(),
});
export type RegisterBody = z.infer<typeof RegisterBody>;
export const SignupForm = RegisterBody.omit({ intent: true });
export type SignupForm = z.infer<typeof SignupForm>;

const Token = z.string().min(1).max(200);

export const ConfirmEmailBody = z.object({ token: Token });
export type ConfirmEmailBody = z.infer<typeof ConfirmEmailBody>;
export const ConfirmEmailResult = z.object({ status: z.enum(['confirmed', 'already_confirmed']) });
export type ConfirmEmailResult = z.infer<typeof ConfirmEmailResult>;

export const ForgotPasswordBody = z.object({ email: Email });
export type ForgotPasswordBody = z.infer<typeof ForgotPasswordBody>;

export const ResetPasswordBody = z.object({ token: Token, password: Password });
export type ResetPasswordBody = z.infer<typeof ResetPasswordBody>;
/** S10 form: the token comes from the URL, not a field. */
export const ResetPasswordForm = z
  .object({ password: Password, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, {
    message: PASSWORDS_DONT_MATCH,
    path: ['confirmPassword'],
  });
export type ResetPasswordForm = z.infer<typeof ResetPasswordForm>;

/** S18 / S12 / S19 (A9). `mobile: ''` or `null` clears it (customers only, BR-23). */
export const UpdateMeBody = z.object({
  fullName: FullName.optional(),
  mobile: MobileOrEmpty.nullable().optional(),
});
export type UpdateMeBody = z.infer<typeof UpdateMeBody>;
export const AccountDetailsForm = z.object({ fullName: FullName, mobile: MobileOrEmpty });
export type AccountDetailsForm = z.infer<typeof AccountDetailsForm>;

export const ChangePasswordBody = z.object({
  currentPassword: z.string().min(1, 'Enter your password.'),
  newPassword: Password,
});
export type ChangePasswordBody = z.infer<typeof ChangePasswordBody>;
export const ChangePasswordForm = ChangePasswordBody.extend({ confirmPassword: z.string() })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: PASSWORDS_DONT_MATCH,
    path: ['confirmPassword'],
  })
  .refine((v) => v.newPassword !== v.currentPassword, { message: PASSWORD_REUSED, path: ['newPassword'] });
export type ChangePasswordForm = z.infer<typeof ChangePasswordForm>;

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
