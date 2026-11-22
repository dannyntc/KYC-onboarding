// Test-only OpenAI-compatible HTTP endpoint; never forwards requests.
import {createServer} from 'node:http';
let mode='success';
const draft={case_summary:'Simulated live draft',observed_facts:[{description:'The triggering transaction is present.',evidence_ids:['TXN-013']}],risk_indicators:[],mitigating_factors:[],missing_information:[],relevant_controls:[],suggested_action:'review',draft_case_note:'Analyst should review the transfer.',limitations:['Simulated provider response.']};
createServer(async(req,res)=>{
 let body=''; for await(const chunk of req) body+=chunk;
 res.setHeader('content-type','application/json');
 if(req.method==='GET'&&req.url==='/health'){res.end('{}');return;}
 if(req.method==='POST'&&req.url==='/mode'){mode=JSON.parse(body).mode;res.end('{}');return;}
 if(req.method!=='POST'||req.url!=='/v1/responses'){res.writeHead(404).end('{}');return;}
 if(mode==='timeout') return;
 if(mode==='provider_error'){res.writeHead(503).end(JSON.stringify({error:{message:'Simulated provider outage',type:'server_error'}}));return;}
 const selected=mode==='control'?{...draft,observed_facts:[{description:'The triggering transaction is present.',evidence_ids:['TXN-069']}],relevant_controls:[{control_id:'MAS-626-6.20',explanation:'Consider this source during human review.'}]}:draft;
 const output=mode==='malformed'?'{invalid json':JSON.stringify(mode==='invalid_citation'?{...draft,observed_facts:[{description:'Unknown evidence',evidence_ids:['TXN-UNKNOWN']}]}:mode==='blank'?{...draft,case_summary:' '}:selected);
 res.end(JSON.stringify({id:`resp-${mode}`,object:'response',status:'completed',output:[{type:'message',id:'msg-test',role:'assistant',status:'completed',content:[{type:'output_text',text:output,annotations:[]}]}]}));
}).listen(3106,'127.0.0.1');
