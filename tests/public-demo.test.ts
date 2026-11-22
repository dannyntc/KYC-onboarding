import { describe, expect, it } from 'vitest';
import { isPublicHost } from '../src/lib/public-demo';

describe('isPublicHost', () => {
  it('treats localhost and 127.0.0.1 as local, with or without a port', () => {
    expect(isPublicHost('127.0.0.1:3000')).toBe(false);
    expect(isPublicHost('localhost:3105')).toBe(false);
    expect(isPublicHost('localhost')).toBe(false);
  });

  it('treats any other host as the online demo', () => {
    expect(isPublicHost('kyc-onboarding-dannyntc.vercel.app')).toBe(true);
    expect(isPublicHost('192.168.1.20:3000')).toBe(true);
    expect(isPublicHost('localhost.evil.example')).toBe(true);
  });

  it('treats a missing host as online, because saving would be refused', () => {
    expect(isPublicHost(null)).toBe(true);
    expect(isPublicHost(undefined)).toBe(true);
    expect(isPublicHost('')).toBe(true);
  });

  it('lets KYC_ONBOARDING_PUBLIC_DEMO force the answer both ways', () => {
    expect(isPublicHost('127.0.0.1:3000', '1')).toBe(true);
    expect(isPublicHost('kyc-onboarding-dannyntc.vercel.app', '0')).toBe(false);
  });

  it('ignores other override values', () => {
    expect(isPublicHost('127.0.0.1:3000', '')).toBe(false);
    expect(isPublicHost('kyc-onboarding-dannyntc.vercel.app', 'yes')).toBe(true);
  });
});
