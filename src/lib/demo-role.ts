import { cookies } from 'next/headers';
import type { DemoRole } from './onboarding-rules';

// Reads the demo role cookie. This is a demo switch, not authentication.
export async function currentRole(): Promise<DemoRole> {
  const value = (await cookies()).get('demo-role')?.value;
  return value === 'read-only' || value === 'senior-approver' ? value : 'analyst';
}

export function actorName(role: DemoRole): string {
  if (role === 'senior-approver') return 'Demo senior approver';
  if (role === 'read-only') return 'Demo read-only user';
  return 'Demo analyst';
}
