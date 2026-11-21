import { describe, expect, it } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('keeps a token text colour and a token text size together', () => {
    expect(cn('text-text', 'text-label')).toBe('text-text text-label');
  });
  it('later size wins over earlier size', () => {
    expect(cn('text-body', 'text-label')).toBe('text-label');
  });
  it('later colour wins over earlier colour', () => {
    expect(cn('text-text', 'text-text-muted')).toBe('text-text-muted');
  });
  it('token shadows conflict with each other', () => {
    expect(cn('shadow-xs', 'shadow-hover')).toBe('shadow-hover');
  });
});
