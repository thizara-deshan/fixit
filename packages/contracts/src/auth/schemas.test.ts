import { describe, expect, it } from 'vitest';
import {
  ChangePasswordForm,
  LoginBody,
  RegisterBody,
  ResetPasswordForm,
  SignupForm,
  UpdateMeBody,
} from './schemas';

const messages = (input: unknown) => {
  const r = LoginBody.safeParse(input);
  return r.success ? [] : r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
};

describe('LoginBody', () => {
  it('trims and lowercases the email', () => {
    expect(LoginBody.parse({ email: '  Olivia@Fixit.TEST ', password: 'x' }).email).toBe('olivia@fixit.test');
  });
  it('uses the SPEC S5 messages for empty fields', () => {
    expect(messages({ email: '', password: '' })).toEqual([
      'email: Enter your email address.',
      'password: Enter your password.',
    ]);
  });
  it('rejects a malformed email with the SPEC message', () => {
    expect(messages({ email: 'olivia', password: 'x' })).toEqual([
      'email: Enter a valid email address, like name@example.com.',
    ]);
  });
});

const firstByPath = (r: {
  success: boolean;
  error?: { issues: { path: PropertyKey[]; message: string }[] };
}) => {
  const out: Record<string, string> = {};
  for (const i of r.error?.issues ?? []) out[i.path.join('.')] ??= i.message;
  return out;
};

describe('SignupForm (S6)', () => {
  it('empty submit shows the SPEC messages', () => {
    expect(firstByPath(SignupForm.safeParse({ fullName: '', email: '', password: '' }))).toEqual({
      fullName: 'Enter your full name.',
      email: 'Enter your email address.',
      password: 'Use at least 8 characters with a letter and a number.',
    });
  });
  it.each(['abcdefgh', '12345678', 'ab1'])('rejects weak password %s', (password) => {
    expect(
      firstByPath(SignupForm.safeParse({ fullName: 'Ann Lee', email: 'a@b.co', password })).password,
    ).toBe('Use at least 8 characters with a letter and a number.');
  });
  it('one-letter name → length message', () => {
    expect(
      firstByPath(SignupForm.safeParse({ fullName: 'A', email: 'a@b.co', password: 'abc12345' })).fullName,
    ).toBe('Name must be 2 to 80 characters.');
  });
  it('RegisterBody accepts intent=provider only', () => {
    expect(
      RegisterBody.safeParse({
        fullName: 'Ann Lee',
        email: 'a@b.co',
        password: 'abc12345',
        intent: 'provider',
      }).success,
    ).toBe(true);
    expect(
      RegisterBody.safeParse({ fullName: 'Ann Lee', email: 'a@b.co', password: 'abc12345', intent: 'admin' })
        .success,
    ).toBe(false);
  });
});

describe('ResetPasswordForm (S10)', () => {
  it('mismatch → Passwords don’t match.', () => {
    expect(
      firstByPath(ResetPasswordForm.safeParse({ password: 'abc12345', confirmPassword: 'abc12346' })),
    ).toEqual({
      confirmPassword: "Passwords don't match.",
    });
  });
});

describe('ChangePasswordForm (S18)', () => {
  it('same as current → reuse message', () => {
    expect(
      firstByPath(
        ChangePasswordForm.safeParse({
          currentPassword: 'abc12345',
          newPassword: 'abc12345',
          confirmPassword: 'abc12345',
        }),
      ),
    ).toEqual({ newPassword: "Choose a password you haven't just used." });
  });
});

describe('UpdateMeBody', () => {
  it('normalises the mobile and clears on empty', () => {
    expect(UpdateMeBody.parse({ mobile: '077 123 4567' }).mobile).toBe('+94771234567');
    expect(UpdateMeBody.parse({ mobile: '' }).mobile).toBeNull();
    expect(UpdateMeBody.parse({}).mobile).toBeUndefined();
  });
});
