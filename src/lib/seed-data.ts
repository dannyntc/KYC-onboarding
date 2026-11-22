import { detectScenarios } from './rules';
const names = ['Amelia Tan','Daniel Lim','Priya Menon','Marcus Lee','Sofia Ng','Adrian Koh','Nadia Rahman','Julian Ong','Clara Goh','Victor Teo','Mei Lin Chua','Arun Nair','Sarah Yeo','Darren Ho','Aisha Malik','Ethan Sim','Isabelle Tay','Raj Mehta','Rachel Chan','Nicholas Low','Fiona Wong','Zahir Khan','Grace Ang','Benjamin Toh','Lina Yusuf','Caleb Foo','Joanne Seah','Kiran Shah','Natalie Pang','David Lau'];
const scenarios = ['rapid_movement','wealth_gap','linked_ownership','documented_sale'] as const;
const descriptions = ['Large third-party transfer followed by rapid outward payments','Declared sale proceeds exceed supporting documentation','Shared beneficial owner across client relationships','Large incoming transfer supported by a property sale'];
export function createSeed() {
 const clients = names.map((name, i) => ({id:`CLI-${String(i+1).padStart(3,'0')}`, name, expectedMonthlyMin:5000000, expectedMonthlyMax:10000000, declaredWealth: i%4===1 ? 800000000 : 450000000, profile: 'Fictional private banking client; Singapore resident.'}));
 const transactions = clients.flatMap((c,i) => Array.from({length:14},(_,j)=>({id:`TXN-${String(i*14+j+1).padStart(3,'0')}`,clientId:c.id,date:j===12?'2026-05-10':j===13?'2026-05-11':`2026-${String(1+Math.floor(j/3)).padStart(2,'0')}-${String(2+(j*3)%25).padStart(2,'0')}`,amount: j===12 && i<12 ? (i%4===0?120000000:i%4===3?250000000:21000000) : (j===13 && i%4===0 && i<12 ? -85000000 : (j%3===0?-1:1)*(200000+j*20000+i*1000)),currency:'SGD',counterparty:j===12&&i%4===3?'Harbour Property Buyer':j===12&&i%4===0?'New third party':'Fictional counterparty'})));
 const documents = clients.slice(0,12).map((c,i)=>({id:`DOC-${String(i+1).padStart(3,'0')}`,clientId:c.id,kind:i%4===1?'company_sale':i%4===3?'property_sale':'profile',title:i%4===1?'Company sale extract':i%4===3?'Property sale agreement':'Client profile declaration',summary:i%4===1?'Synthetic sale extract corroborates SGD 3m against SGD 8m declared.':i%4===3?'Synthetic signed agreement records sale proceeds of SGD 2.5m.':'Synthetic profile information; additional corroboration may be required.',corroboratedAmount:i%4===1?300000000:i%4===3?250000000:0}));
 const relationships = [{id:'REL-001',clientId:'CLI-003',owner:'Morgan Vale',entity:'Cedar Harbour Holdings',description:'Fictional beneficial owner of holding entity.'},{id:'REL-002',clientId:'CLI-007',owner:'Morgan Vale',entity:'Cedar Harbour Holdings',description:'Fictional beneficial owner of holding entity.'},{id:'REL-003',clientId:'CLI-011',owner:'Morgan Vale',entity:'Cedar Harbour Holdings',description:'Fictional beneficial owner of holding entity.'}];
 const alerts = clients.flatMap(c=>{
  const ownTransactions=transactions.filter(t=>t.clientId===c.id);
  const ownDocuments=documents.filter(d=>d.clientId===c.id);
  const ownRelationships=relationships.filter(r=>r.clientId===c.id);
  const linked=relationships.filter(r=>ownRelationships.some(own=>own.owner===r.owner&&own.entity===r.entity));
  return detectScenarios(c,ownTransactions,ownDocuments,linked).map(scenario=>{
   const index=scenarios.indexOf(scenario as typeof scenarios[number]);
   const trigger=ownTransactions.find(t=>t.currency==='SGD'&&t.amount>c.expectedMonthlyMax)!;
   return {id:`ALT-${c.id.slice(4)}`,clientId:c.id,scenario,title:descriptions[index],priority:index<2?'High':index===2?'Medium':'Low',status:'Open',triggerTransactionId:trigger.id};
  });
 });
 return {clients,transactions,alerts,documents,relationships};
}
