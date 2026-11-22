import { z } from 'zod';
import { isRapidMovement } from './rules';
export const FIXTURE_VERSION='v5';
const finding = z.object({description:z.string(),evidence_ids:z.array(z.string()).min(1)});
export const analysisSchema = z.object({case_summary:z.string(),observed_facts:z.array(finding),risk_indicators:z.array(finding),mitigating_factors:z.array(finding),missing_information:z.array(z.string()),relevant_controls:z.array(z.object({control_id:z.string(),explanation:z.string()})),suggested_action:z.enum(['review','request_information','escalate']),draft_case_note:z.string(),limitations:z.array(z.string())});
export type Analysis = z.infer<typeof analysisSchema>;
export function validateAnalysis(value:unknown, evidenceIds:string[], controlIds:string[]) {
 const parsed = analysisSchema.safeParse(value);
 if (!parsed.success) return {success:false as const,error:'Invalid analysis structure'};
 const findings = [...parsed.data.observed_facts,...parsed.data.risk_indicators,...parsed.data.mitigating_factors];
 const textFields=[parsed.data.case_summary,parsed.data.draft_case_note,...findings.flatMap(f=>[f.description,...f.evidence_ids]),...parsed.data.missing_information,...parsed.data.limitations,...parsed.data.relevant_controls.flatMap(c=>[c.control_id,c.explanation])];
 if(textFields.some(value=>!value.trim())) return {success:false as const,error:'Analysis contains an empty field'};
 const narrative=textFields.join('\n');
 const prohibited=[/\b(?:client|customer|account holder)\s+is\s+guilty\b/i,/\b(?:alert|case)\s+(?:has been|is|was)\s+(?:automatically\s+)?closed\b/i,/\b(?:funds|account)\s+(?:has been|have been|is|are|was|were)\s+frozen\b/i,/\b(?:suspicious transaction report|STR)\s+(?:has been|was|is)\s+filed\b/i];
 if(prohibited.some(pattern=>pattern.test(narrative))) return {success:false as const,error:'Analysis contains a prohibited final determination'};
 if(findings.some(f=>f.evidence_ids.some(id=>!evidenceIds.includes(id))) || parsed.data.relevant_controls.some(c=>!controlIds.includes(c.control_id))) return {success:false as const,error:'Analysis cites an unavailable record'};
 return {success:true as const,data:parsed.data};
}
type FixtureContext = {
 scenario:string;
 trigger?:{id:string;amount:number;currency:string;date?:string};
 transactions?:{id:string;amount:number;currency:string;date:string}[];
 client:{id:string;declaredWealth:number;expectedMonthlyMax:number};
 documents:{id:string;kind:string;corroboratedAmount:number}[];
 relationships:{id:string;owner:string;entity:string}[];
 relatedRelationships:{id:string;owner:string;entity:string}[];
};
export function fixtureAnalysis({scenario,trigger,transactions=[],client,documents,relationships,relatedRelationships}:FixtureContext):Analysis {
 const text:Record<string,string>={rapid_movement:'Review activity relative to the expected monthly range and request the purpose of funds.',wealth_gap:'Compare declared wealth against supporting documents and investigate any uncorroborated amount.',linked_ownership:'Review ownership records to determine whether a shared beneficial owner links related clients.',documented_sale:'Review any property-sale evidence and payment trail before a human decision.'};
 const observed_facts=trigger?[{description:'The triggering transaction is included in the case evidence.',evidence_ids:[trigger.id]}]:[];
 const risk_indicators:Analysis['risk_indicators']=[];
 const mitigating_factors:Analysis['mitigating_factors']=[];
 const missing_information=['Review the supporting source-of-funds documentation.'];
 if(!trigger) missing_information.push('The triggering transaction is unavailable; retrieve it before assessing the alert.');
 if(scenario==='rapid_movement'&&trigger?.currency==='SGD'&&trigger.amount>client.expectedMonthlyMax) risk_indicators.push({description:'The incoming payment exceeds the expected activity range.',evidence_ids:[trigger.id,client.id]});
 if(scenario==='rapid_movement') {
  if(trigger&&trigger.currency!=='SGD') missing_information.push('The triggering transaction is not in SGD; obtain a comparable SGD amount and verify the currency conversion before assessing the activity threshold.');
  else {
   const outgoing=trigger?.date&&transactions.find(t=>t.id!==trigger.id&&t.currency===trigger.currency&&isRapidMovement(trigger.amount,trigger.date!,t.amount,t.date,client.expectedMonthlyMax));
   if(trigger&&outgoing) observed_facts.push({description:'An outgoing payment was recorded within two calendar days of the incoming payment.',evidence_ids:[trigger.id,outgoing.id]});
   else missing_information.push('No qualifying subsequent outgoing payment is available in the retrieved transaction records.');
  }
 }
 if(scenario==='wealth_gap') {
  const sales=documents.filter(d=>d.kind==='company_sale');
  const sale=sales[0];
  if(!sale) missing_information.push('A company-sale record is unavailable; the declared wealth cannot be compared.');
  else if(sales.some(d=>d.corroboratedAmount!==sale.corroboratedAmount)) {
   observed_facts.push({description:'Company-sale records report different amounts.',evidence_ids:sales.map(d=>d.id)});
   missing_information.push('Reconcile the conflicting company-sale records before calculating an uncorroborated amount.');
  }
  else if(sale.corroboratedAmount<client.declaredWealth) {
   const gap=(client.declaredWealth-sale.corroboratedAmount)/100;
   risk_indicators.push({description:`The declared wealth exceeds the amount in the company-sale record by SGD ${gap.toLocaleString('en-SG')}.`,evidence_ids:[sale.id,client.id]});
  }
 }
 if(scenario==='linked_ownership') {
  const pair=relationships.flatMap(own=>relatedRelationships.filter(other=>own.owner===other.owner&&own.entity===other.entity).map(other=>({own,other})))[0];
  if(pair) risk_indicators.push({description:'The ownership records identify the same beneficial owner and holding entity across two clients.',evidence_ids:[pair.own.id,pair.other.id]});
  else missing_information.push('A matching ownership record for another client is unavailable.');
 }
 if(scenario==='documented_sale') {
  const sales=documents.filter(d=>d.kind==='property_sale');
  if(sales.length>1&&sales.some(d=>d.corroboratedAmount!==sales[0].corroboratedAmount)) {
   observed_facts.push({description:'Property-sale records report different amounts.',evidence_ids:sales.map(d=>d.id)});
   missing_information.push('Reconcile the property-sale records and verify which agreement relates to the triggering payment.');
  } else {
   const sale=sales.find(d=>trigger?.currency==='SGD'&&d.corroboratedAmount===trigger.amount);
   if(sale&&trigger) mitigating_factors.push({description:'The property-sale agreement records proceeds matching the incoming payment.',evidence_ids:[sale.id,trigger.id]});
   else missing_information.push('A property-sale record matching the triggering payment is unavailable; verify the agreement and payment trail.');
  }
 }
 return {case_summary:text[scenario]??'Review the case evidence.',observed_facts,risk_indicators,mitigating_factors,missing_information,relevant_controls:[],suggested_action:'review',draft_case_note:text[scenario]??'Review the evidence.',limitations:['Fixture demonstration; this is not a live AI response.','Additional supporting documents may be required.']};
}
