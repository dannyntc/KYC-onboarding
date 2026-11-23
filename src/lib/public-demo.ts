// Look-only mode: the screen disables every saving button and the save routes refuse changes.
// It is off by default, so the hosted site can be edited like a local copy. Set
// KYC_ONBOARDING_PUBLIC_DEMO=1 to force it on (used by the look-only test suite, and as a quick
// way to make the hosted site read-only again without a code change).
export function isLookOnly(override: string | undefined = process.env.KYC_ONBOARDING_PUBLIC_DEMO): boolean {
  return override === '1';
}

export async function isPublicDemo(): Promise<boolean> {
  return isLookOnly();
}
