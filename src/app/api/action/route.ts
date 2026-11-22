import { db } from '@/lib/db';
import { FIXTURE_VERSION, fixtureAnalysis, validateAnalysis } from '@/lib/analysis';
import { NextResponse } from 'next/server';
import { isLocalOrigin } from '@/lib/origin';
import { cookies } from 'next/headers';
import { AnalysisValidationError, LIVE_PROMPT_VERSION, modelInput, runLiveAnalysis } from '@/lib/live-analysis';
import { reviewChange } from '@/lib/review';
import { acquireAnalysisLock,releaseAnalysisLock } from '@/lib/analysis-lock';
import { relatedRelationships } from '@/lib/related-relationships';
import {loadControlReviews,reviewedControlsForScenario} from '@/lib/control-review';
export async function POST(request:Request){
 const origin=request.headers.get('origin');
 if(!isLocalOrigin(origin,request.headers.get('host'))) return new Response('Invalid origin',{status:403});
 if((await cookies()).get('demo-role')?.value==='read-only') return new Response('Read-only demo role cannot change cases.',{status:403});
 const form=await request.formData(); const id=String(form.get('id')??''); const action=String(form.get('action')??'');
 const alert=await db.alert.findUnique({where:{id},include:{client:{include:{transactions:true,accounts:true,documents:true,relationships:true}}}});
 if(!alert) return new Response('Case not found',{status:404});
 if(action==='analyze'){
  const lease=await acquireAnalysisLock(id);
  if(!lease) return new Response('An analysis is already running for this case. Wait and try again.',{status:409});
  try {
  const live=Boolean(process.env.OPENAI_API_KEY); const model=process.env.OPENAI_MODEL;
  if(live&&!model) return new Response('Set OPENAI_MODEL to use live analysis.',{status:503});
  const related=await relatedRelationships(alert.client.id,alert.client.relationships);
  const evidenceIds=[...related.flatMap(r=>[r.id,...r.client.accounts.map(account=>account.id)]),alert.client.id,...alert.client.accounts.map(account=>account.id),...alert.client.transactions.map(t=>t.id),...alert.client.documents.map(d=>d.id),...alert.client.relationships.map(r=>r.id)];
  const context={alert:{id:alert.id,title:alert.title,triggerTransactionId:alert.triggerTransactionId},client:alert.client,relatedRelationships:related};
  const {reviews}=await loadControlReviews();
  const controls=live?reviewedControlsForScenario(reviews,alert.scenario,new Date().toISOString().slice(0,10)):[];
  const savedInput=modelInput(context,evidenceIds,controls);
  const attestedReviews=reviews.filter(review=>controls.some(control=>control.id===review.id));
  const inputSnapshot=JSON.stringify(live?{...savedInput,recorded_control_reviews:attestedReviews}:{...savedInput,fixture_scenario:alert.scenario});
  let draft; let rawResponse:string|null=null;
  try {
   if(live){const result=await runLiveAnalysis({caseId:id,model:model!,evidenceIds,context,controls});draft=result.draft;rawResponse=result.rawResponse;}
   else draft=fixtureAnalysis({scenario:alert.scenario,trigger:alert.client.transactions.find(t=>t.id===alert.triggerTransactionId),transactions:alert.client.transactions,client:alert.client,documents:alert.client.documents,relationships:alert.client.relationships,relatedRelationships:related});
  } catch(error) {
   const validation=error instanceof AnalysisValidationError?'rejected':live?'provider_error':'fixture_error';
   const raw=error instanceof AnalysisValidationError?(JSON.stringify(error.output) ?? ''):'';
   const failedResponse=error instanceof AnalysisValidationError?error.rawResponse:null;
   await db.$transaction(async tx=>{
    const attempt=await tx.analysis.create({data:{alertId:id,mode:live?'live':'fixture',model:live?model!:'fixture',promptVersion:live?LIVE_PROMPT_VERSION:FIXTURE_VERSION,validation,output:raw,rawResponse:failedResponse,inputSnapshot}});
    await tx.auditEvent.create({data:{alertId:id,actor:'Demo analyst',action:live?'Live analysis failed':'Fixture analysis failed',detail:`Attempt ID: ${attempt.id}; Model: ${live?model:'fixture'}; prompt: ${live?LIVE_PROMPT_VERSION:FIXTURE_VERSION}; validation: ${validation}`}});
   });
   return new Response('Analysis failed or contained invalid citations. Previous drafts are preserved; try again.',{status:502});
  }
  const checked=validateAnalysis(draft,evidenceIds,controls.map(control=>control.id));
  if(!checked.success) {
   await db.$transaction(async tx=>{
    const attempt=await tx.analysis.create({data:{alertId:id,mode:live?'live':'fixture',model:live?model!:'fixture',promptVersion:live?LIVE_PROMPT_VERSION:FIXTURE_VERSION,validation:'rejected',output:JSON.stringify(draft) ?? '',rawResponse,inputSnapshot}});
    await tx.auditEvent.create({data:{alertId:id,actor:'Demo analyst',action:live?'Live analysis failed':'Fixture analysis failed',detail:`Attempt ID: ${attempt.id}; Model: ${live?model:'fixture'}; prompt: ${live?LIVE_PROMPT_VERSION:FIXTURE_VERSION}; validation: rejected; ${checked.error}`}});
   });
   return new Response(checked.error,{status:422});
  }
  const mode=live?'live':'fixture';
  await db.$transaction(async tx=>{
   const attempt=await tx.analysis.create({data:{alertId:id,mode,model:live?model!:'fixture',promptVersion:live?LIVE_PROMPT_VERSION:FIXTURE_VERSION,validation:'passed',output:JSON.stringify(checked.data),rawResponse,inputSnapshot}});
   await tx.auditEvent.create({data:{alertId:id,actor:'Demo analyst',action:live?'Live analysis generated':'Fixture analysis generated',detail:live?`Attempt ID: ${attempt.id}; Model: ${model}; prompt: ${LIVE_PROMPT_VERSION}; validation: passed`:`Attempt ID: ${attempt.id}; Synthetic fixture; no model was called. Version: ${FIXTURE_VERSION}; validation: passed.`}});
  });
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
