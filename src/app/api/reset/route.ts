import { db, databaseEngine } from '@/lib/db';
import { currentRole } from '@/lib/demo-role';
import { resetDemoData } from '@/lib/demo-reset';
import { isSameOrigin } from '@/lib/origin';
import { isLookOnly } from '@/lib/public-demo';

// "Reset demo data" button: erases every saved review, memo and audit entry and restores the
// 12 starting applicants, in one all-or-nothing transaction.
export async function POST(request: Request) {
  if (!isSameOrigin(request.headers.get('origin'), request.headers.get('host'))) return new Response('Invalid origin', { status: 403 });
  if (isLookOnly()) return new Response('Saving is turned off in look-only mode.', { status: 403 });
  if ((await currentRole()) === 'read-only') return new Response('The read-only role cannot reset the demo.', { status: 403 });
  try {
    await resetDemoData(db, databaseEngine);
  } catch {
    return new Response('Could not reset the demo data. Nothing was changed; please try again.', { status: 500 });
  }
  return new Response(null, { status: 204 });
}
