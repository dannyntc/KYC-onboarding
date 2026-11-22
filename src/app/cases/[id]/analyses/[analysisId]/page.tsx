import Link from 'next/link';
import {notFound} from 'next/navigation';
import {db} from '@/lib/db';

export const dynamic='force-dynamic';
function readable(value:string):string {
 try {return JSON.stringify(JSON.parse(value),null,2);} catch {return value;}
}
export default async function AnalysisAttempt({params}:{params:Promise<{id:string;analysisId:string}>}){
 const {id,analysisId}=await params;
 if(!/^[1-9]\d*$/.test(analysisId)||!Number.isSafeInteger(Number(analysisId))) notFound();
 const attempt=await db.analysis.findFirst({where:{id:Number(analysisId),alertId:id}});
 if(!attempt) notFound();
 const status=attempt.validation==='passed'?'Passed':attempt.validation==='rejected'?'Rejected':attempt.validation==='provider_error'?'Provider error':attempt.validation;
 return <><Link href={`/cases/${id}`} className="back">Back to case</Link><div className="heading"><div><p className="eyebrow">ANALYSIS HISTORY · {id}</p><h1>Analysis attempt {attempt.id}</h1><p>{attempt.createdAt.toISOString()} · {attempt.mode} · {attempt.model} · prompt {attempt.promptVersion}</p></div><span className="badge medium">{status}</span></div><section className="panel section"><p className="notice">{attempt.validation==='passed'?'This is a saved draft for human review.':'This attempt did not produce an accepted draft. Its contents are preserved for review and must not be treated as findings.'}</p><h2>Saved input and evidence</h2>{attempt.inputSnapshot?<pre className="audit-detail">{readable(attempt.inputSnapshot)}</pre>:<p className="muted">No input snapshot was saved for this attempt.</p>}<h2>Recorded output</h2>{attempt.output?<pre className="audit-detail">{readable(attempt.output)}</pre>:<p className="muted">No parsed output was saved for this attempt.</p>}<h2>Raw provider response</h2>{attempt.rawResponse?<pre className="audit-detail">{readable(attempt.rawResponse)}</pre>:<p className="muted">No provider response was saved for this attempt.</p>}</section></>;
}
