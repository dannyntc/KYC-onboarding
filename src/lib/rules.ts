export function isRapidMovement(inflow:number,inflowDate:string,outflow:number,outflowDate:string,expectedMaximum:number):boolean {
 const elapsed=Date.parse(outflowDate)-Date.parse(inflowDate);
 return inflow>expectedMaximum && outflow<0 && Number.isFinite(elapsed) && elapsed>=0 && elapsed<=48*60*60*1000;
}
type RuleClient={expectedMonthlyMax:number;declaredWealth:number};
type RuleTransaction={amount:number;date:string;currency:string};
type RuleDocument={kind:string;corroboratedAmount:number};
type RuleRelationship={owner:string;entity:string;clientId:string};
export function detectScenarios(client:RuleClient, transactions:RuleTransaction[], documents:RuleDocument[], relationships:RuleRelationship[]):string[] {
 const large=transactions.filter(t=>t.currency==='SGD' && t.amount>client.expectedMonthlyMax);
 if(!large.length) return [];
 if(large.some(inflow=>transactions.some(outflow=>outflow.currency===inflow.currency && isRapidMovement(inflow.amount,inflow.date,outflow.amount,outflow.date,client.expectedMonthlyMax)))) return ['rapid_movement'];
 if(documents.some(d=>d.kind==='company_sale'&&d.corroboratedAmount<client.declaredWealth)) return ['wealth_gap'];
 if(relationships.some(r=>relationships.some(other=>other.clientId!==r.clientId&&other.owner===r.owner&&other.entity===r.entity))) return ['linked_ownership'];
 if(documents.some(d=>d.kind==='property_sale'&&large.some(t=>t.amount===d.corroboratedAmount))) return ['documented_sale'];
 return [];
}
