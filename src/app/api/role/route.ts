import { NextResponse } from 'next/server';
import { isLocalOrigin } from '@/lib/origin';
export async function POST(request:Request){
 const origin=request.headers.get('origin'); if(!isLocalOrigin(origin,request.headers.get('host'))) return new Response('Invalid origin',{status:403});
 const form=await request.formData(); const role=String(form.get('role')); if(!['analyst','read-only'].includes(role)) return new Response('Invalid role',{status:400});
 const response=NextResponse.redirect(new URL('/',origin!),303); response.cookies.set('demo-role',role,{httpOnly:true,sameSite:'strict',path:'/'}); return response;
}
