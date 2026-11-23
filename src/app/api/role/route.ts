import { NextResponse } from 'next/server';
import { isSameOrigin } from '@/lib/origin';

// Returns the page the visitor came from (path and query only), or '/' if there is no usable Referer.
// Only a Referer on the same host is trusted, and only its path is kept, so this can never send
// the visitor to another site.
function returnPath(referer: string | null, host: string | null): string {
  if (!referer || !host) return '/';
  try {
    const parsed = new URL(referer);
    if (parsed.host !== host) return '/';
    const path = parsed.pathname + parsed.search;
    return path.startsWith('/') && !path.startsWith('//') ? path : '/';
  } catch {
    return '/';
  }
}

export async function POST(request:Request){
 const origin=request.headers.get('origin'); const host=request.headers.get('host'); if(!isSameOrigin(origin,host)) return new Response('Invalid origin',{status:403});
 const form=await request.formData(); const role=String(form.get('role')); if(!['analyst','read-only','senior-approver'].includes(role)) return new Response('Invalid role',{status:400});
 const response=NextResponse.redirect(new URL(returnPath(request.headers.get('referer'),host),origin!),303); response.cookies.set('demo-role',role,{httpOnly:true,sameSite:'strict',secure:origin!.startsWith('https:'),path:'/'}); return response;
}
