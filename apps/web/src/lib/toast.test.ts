import { beforeEach, describe, expect, it, vi } from 'vitest';

const toastFn = vi.hoisted(() => Object.assign(vi.fn(), { dismiss: vi.fn() }));
vi.mock('sonner', () => ({ toast: toastFn }));

import { notify, notifyError, toastDuration } from './toast';

describe('toast helpers (SPEC §6.5)', () => {
  beforeEach(() => {
    toastFn.mockClear();
    toastFn.dismiss.mockClear();
  });
  it('lasts 4 s, or 8 s with an action', () => {
    expect(toastDuration()).toBe(4000);
    expect(toastDuration({ label: 'Undo', onClick: () => undefined })).toBe(8000);
  });
  it('notify replaces the current toast and passes the duration', () => {
    notify('Saved Bell & Sons Plumbing.');
    expect(toastFn.dismiss).toHaveBeenCalledOnce();
    expect(toastFn).toHaveBeenCalledWith('Saved Bell & Sons Plumbing.', { duration: 4000 });
    const action = { label: 'Undo', onClick: vi.fn() };
    notify('Removed Bell & Sons Plumbing from saved.', action);
    expect(toastFn).toHaveBeenLastCalledWith('Removed Bell & Sons Plumbing from saved.', {
      duration: 8000,
      action,
    });
  });
  it('notifyError adds Try again when a retry is given', () => {
    const retry = vi.fn();
    notifyError("Couldn't save. Try again.", retry);
    const opts = toastFn.mock.lastCall?.[1] as {
      duration: number;
      action: { label: string; onClick: () => void };
    };
    expect(opts.duration).toBe(8000);
    expect(opts.action.label).toBe('Try again');
    opts.action.onClick();
    expect(retry).toHaveBeenCalledOnce();
  });
});
