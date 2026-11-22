import { db } from '@/lib/db';
import { fixtureAnalysis, validateAnalysis } from '@/lib/analysis';
import { NextResponse } from 'next/server';
import { isLocalOrigin } from '@/lib/origin';
import { cookies } from 'next/headers';
import { AnalysisValidationError, runLiveAnalysis } from '@/lib/live-analysis';
import { reviewChange } from '@/lib/review';
import { acquireAnalysisLock,releaseAnalysisLock } from '@/lib/analysis-lock';
export async function POST(request:Request){
 const origin=request.headers.get('origin');
 if(!isLocalOrigin(origin,request.headers.get('host'))) return new Response('Invalid origin',{status:403});
 if((await cookies()).get('demo-role')?.value==='read-only') return new Response('Read-only demo role cannot change cases.',{status:403});
 const form=await request.formData(); const id=String(form.get('id')??''); const action=String(form.get('action')??'');
 const alert=await db.alert.findUnique({where:{id},include:{client:{include:{transactions:true,documents:true,relationships:true}}}});
 if(!alert) return new Response('Case not found',{status:404});
 if(action==='analyze'){
  const lease=await acquireAnalysisLock(id);
  if(!lease) return new Response('An analysis is already running for this case. Wait and try again.',{status:409});
  try {
  const live=Boolean(process.env.OPENAI_API_KEY); const model=process.env.OPENAI_MODEL;
  if(live&&!model) return new Response('Set OPENAI_MODEL to use live analysis.',{status:503});
  const evidenceIds=[alert.client.id,...alert.client.transactions.map(t=>t.id),...alert.client.documents.map(d=>d.id),...alert.client.relationships.map(r=>r.id)];
  let draft;
  try {
   draft=live?await runLiveAnalysis({caseId:id,model:model!,evidenceIds,context:{alert:{id:alert.id,title:alert.title,triggerTransactionId:alert.triggerTransactionId},client:alert.client}}):fixtureAnalysis(alert.scenario,alert.triggerTransactionId,alert.client.documents[0]?.id,alert.client.id,alert.client.relationships[0]?.id);
  } catch(error) {
   const validation=error instanceof AnalysisValidationError?'rejected':'provider_error';
   const raw=error instanceof AnalysisValidationError?(JSON.stringify(error.output) ?? '').slice(0,100000):'';
   await db.$transaction([db.analysis.create({data:{alertId:id,mode:'live',model:model ?? 'unconfigured',promptVersion:'v1',validation,output:raw}}),db.auditEvent.create({data:{alertId:id,actor:'Demo analyst',action:'Live analysis failed',detail:`Model: ${model}; prompt: v1; validation: ${validation}`}})]);
   return new Response('Analysis failed or contained invalid citations. Previous drafts are preserved; try again.',{status:502});
  }
  const checked=validateAnalysis(draft,evidenceIds,[]);
  if(!checked.success) return new Response(checked.error,{status:422});
  const mode=live?'live':'fixture';
  await db.$transaction([db.analysis.create({data:{alertId:id,mode,model:live?model!:'fixture',promptVersion:'v1',validation:'passed',output:JSON.stringify(checked.data)}}),db.auditEvent.create({data:{alertId:id,actor:'Demo analyst',action:live?'Live analysis generated':'Fixture analysis generated',detail:live?`Model: ${model}; prompt: v1; validation: passed`:'Synthetic fixture; no model was called. Validation: passed.'}})]);
  } finally {await releaseAnalysisLock(id,lease);}
 }else if(['save','request','escalate'].includes(action)){
  const notes=String(form.get('notes')??'').trim(); const version=Number(form.get('version'));
  if(!notes||notes.length>10000||!Number.isInteger(version)) return new Response('A note and valid case version are required.',{status:400});
  try {await db.$transaction(async tx=>{
   const current=await tx.alert.findUnique({where:{id},select:{notes:true,status:true,version:true}});
   if(!current||current.version!==version) throw new Error('stale');
   const change=reviewChange({notes:current.notes,status:current.status},action,notes);
   const changed=await tx.alert.updateMany({where:{id,version},data:{notes,status:change.status,version:{increment:1}}});
   if(changed.count!==1) throw new Error('stale');
   await tx.auditEvent.create({data:{alertId:id,actor:'Demo analyst',action:change.status,detail:change.detail}});
  });}catch(error){if(error instanceof Error&&error.message==='stale') return new Response('This case changed. Reload and try again.',{status:409}); return new Response('Could not save the review. Please retry.',{status:500});}
 }else return new Response('Unknown action',{status:400});
 return NextResponse.redirect(new URL(`/cases/${id}`,origin!),303);
}
