import { describe, expect, it } from 'vitest';
import { isLookOnly } from '../src/lib/public-demo';

describe('isLookOnly', () => {
  it('is off by default, so the hosted site can save like a local copy', () => {
    expect(isLookOnly(undefined)).toBe(false);
    expect(isLookOnly('')).toBe(false);
    expect(isLookOnly('0')).toBe(false);
  });

  it('is on only when KYC_ONBOARDING_PUBLIC_DEMO is exactly "1"', () => {
    expect(isLookOnly('1')).toBe(true);
    expect(isLookOnly('yes')).toBe(false);
  });
});
