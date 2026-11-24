// Test-only OpenAI-compatible HTTP endpoint; never forwards requests. POST /mode picks the next answer.
import {createServer} from 'node:http';
let mode='onboarding';
// Cites a screening record of whichever file is asked about (or its first record), so any file can be used.
const draftFor=evidenceId=>({applicant_summary:'Simulated live KYC draft',verified_facts:[{description:'A screening result is recorded for this applicant.',evidence_ids:[evidenceId]}],risk_factors:[],mitigating_factors:[],outstanding_items:['Analyst decision on the screening result'],suggested_risk_rating:'medium',suggested_next_step:'ready_for_human_decision',relevant_controls:[],draft_note:'Analyst should decide the screening result.',limitations:['Simulated provider response.']});
const answers={
 onboarding:draft=>JSON.stringify(draft),
 onboarding_approve:draft=>JSON.stringify({...draft,applicant_summary:'The applicant is approved and the account has been opened.'}),
 invalid_citation:draft=>JSON.stringify({...draft,verified_facts:[{description:'Unknown evidence',evidence_ids:['SCR-UNKNOWN']}]}),
 blank:draft=>JSON.stringify({...draft,applicant_summary:' '}),
 malformed:()=>'{invalid json',
 control:draft=>JSON.stringify({...draft,applicant_summary:'Simulated KYC draft citing a regulation',relevant_controls:[{control_id:'MAS-626-6.39-6.42',explanation:'Consider this source during human review.'}]})
};
createServer(async(req,res)=>{
 let body=''; for await(const chunk of req) body+=chunk;
 res.setHeader('content-type','application/json');
 if(req.method==='GET'&&req.url==='/health'){res.end('{}');return;}
 if(req.method==='POST'&&req.url==='/mode'){mode=JSON.parse(body).mode;res.end('{}');return;}
 if(req.method!=='POST'||req.url!=='/v1/responses'){res.writeHead(404).end('{}');return;}
 if(mode==='timeout') return;
 if(mode==='provider_error'){res.writeHead(503).end(JSON.stringify({error:{message:'Simulated provider outage',type:'server_error'}}));return;}
 const ids=JSON.parse(JSON.parse(body).input).permitted_evidence_ids;
 const text=(answers[mode]??answers.onboarding)(draftFor(ids.find(id=>id.startsWith('SCR-'))??ids[0]));
 res.end(JSON.stringify({id:`resp-${mode}`,object:'response',status:'completed',output:[{type:'message',id:'msg-test',role:'assistant',status:'completed',content:[{type:'output_text',text,annotations:[]}]}]}));
}).listen(3106,'127.0.0.1');
