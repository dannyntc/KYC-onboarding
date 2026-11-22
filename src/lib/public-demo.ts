import { headers } from 'next/headers';
import { isLocalOrigin } from './origin';

// Decides whether the screen should behave as the online, look-only demo.
// It uses the same localhost rule as the save routes (src/lib/origin.ts): anything that is
// not served from 127.0.0.1 or localhost is treated as online. The KYC_ONBOARDING_PUBLIC_DEMO
// setting forces the answer: "1" means online, "0" means local, anything else means "work it out".
// This only changes what the screen shows. The save routes enforce their own origin check.
export function isPublicHost(host: string | null | undefined, override?: string): boolean {
  if (override === '1') return true;
  if (override === '0') return false;
  if (!host) return true;
  return !isLocalOrigin(`http://${host}`, host);
}

export async function isPublicDemo(): Promise<boolean> {
  return isPublicHost((await headers()).get('host'), process.env.KYC_ONBOARDING_PUBLIC_DEMO);
}
