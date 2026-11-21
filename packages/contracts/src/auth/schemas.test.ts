import { describe, expect, it } from 'vitest';
import { LoginBody } from './schemas';

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
