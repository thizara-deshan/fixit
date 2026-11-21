import { describe, expect, it } from 'vitest';
import {
  ANY_ENDPOINT,
  armForcedError,
  clearForcedErrors,
  getControls,
  setLatency,
  takeForcedError,
} from './controls';

describe('mock controls', () => {
  it('latency persists', () => {
    setLatency('slow');
    expect(getControls().latency).toBe('slow');
  });
  it('a forced error is consumed once', () => {
    armForcedError('auth_me', '500');
    expect(takeForcedError('auth_me')).toBe('500');
    expect(takeForcedError('auth_me')).toBeNull();
  });
  it('the endpoint-specific error wins over "any request"', () => {
    armForcedError(ANY_ENDPOINT, 'network');
    armForcedError('auth_me', '401');
    expect(takeForcedError('auth_me')).toBe('401');
    expect(takeForcedError('auth_login')).toBe('network');
    expect(takeForcedError('auth_login')).toBeNull();
  });
  it('clearForcedErrors empties the list; garbage in storage falls back to defaults', () => {
    armForcedError('auth_me', '409');
    clearForcedErrors();
    expect(getControls().forced).toEqual({});
    localStorage.setItem('fixit.mock.controls', '{not json');
    expect(getControls()).toEqual({ latency: 'normal', forced: {} });
  });
});
