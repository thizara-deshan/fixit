import { beforeEach, describe, expect, it } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { authStore } from './auth-store';
import { useFormDraft } from './use-form-draft';
import { signInAs } from '@/test/sign-in';

function Draft() {
  const form = useForm({ defaultValues: { fullName: 'Olivia Martinez', password: '' } });
  useFormDraft('test', form, ['password']);
  return (
    <>
      <input aria-label="Name" {...form.register('fullName')} />
      <input aria-label="Password" {...form.register('password')} />
    </>
  );
}

describe('useFormDraft', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });
  it('keeps values minus passwords on expiry and restores them once', async () => {
    signInAs('customer');
    const first = render(<Draft />);
    await userEvent.clear(screen.getByLabelText('Name'));
    await userEvent.type(screen.getByLabelText('Name'), 'Olivia P');
    await userEvent.type(screen.getByLabelText('Password'), 'secret12');
    act(() => {
      authStore.signOut('expired');
    });
    expect(JSON.parse(sessionStorage.getItem('fixit.draft.test') ?? '{}')).toEqual({ fullName: 'Olivia P' });
    first.unmount();
    render(<Draft />);
    expect(screen.getByLabelText<HTMLInputElement>('Name').value).toBe('Olivia P');
    expect(screen.getByLabelText<HTMLInputElement>('Password').value).toBe('');
    expect(sessionStorage.getItem('fixit.draft.test')).toBeNull();
  });
  it('does nothing on a normal logout', () => {
    signInAs('customer');
    render(<Draft />);
    act(() => {
      authStore.signOut('logout');
    });
    expect(sessionStorage.getItem('fixit.draft.test')).toBeNull();
  });
});
