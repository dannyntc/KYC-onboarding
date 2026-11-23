'use client';
import {useState,type FormEvent,type ReactNode} from 'react';
import {useRouter} from 'next/navigation';
export function CaseForm({children,className,action='/api/action'}:{children:ReactNode;className?:string;action?:string}) {
 const router=useRouter();
 const [pending,setPending]=useState(false);
 const [error,setError]=useState('');
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(pending) return;
  const form=event.currentTarget;
  const submitter=(event.nativeEvent as SubmitEvent).submitter;
  const data=new FormData(form,submitter instanceof HTMLElement?submitter:undefined);
  setPending(true);setError('');
  try {
   const response=await fetch(form.getAttribute('action') ?? action,{method:'POST',body:data});
   if(!response.ok){const message=(await response.text()).slice(0,300);setError(message || 'Unable to save. Please try again.');return;}
   if(data.get('action')==='analyze'){router.refresh();return;}
   if(response.redirected){window.location.assign(response.url);return;}
   window.location.reload();
  } catch {setError('Could not reach the server. Your note is still here; check the connection and try again.');}
  finally {setPending(false);}
 }
 return <form action={action} method="post" className={className} onSubmit={submit}><fieldset disabled={pending} className="case-form-fields">{children}</fieldset>{pending&&<p role="status" className="muted">Working…</p>}{error&&<p role="alert" className="form-error">{error}{(error.includes('This case changed')||error.includes('This file changed'))&&' Copy your unsaved note before reloading the case.'}</p>}</form>;
}
