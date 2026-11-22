import { describe, it, expect } from 'vitest';
import { createSeed } from '../src/lib/seed-data';

describe('synthetic seed', () => {
  it('is repeatable and contains 30 clients, 420 transactions and 12 alerts', () => {
    const first = createSeed();
    expect(first).toEqual(createSeed());
    expect(first.clients).toHaveLength(30);
    expect(first.transactions).toHaveLength(420);
    expect(first.alerts).toHaveLength(12);
    expect(new Set(first.alerts.map(a => a.scenario)).size).toBe(4);
    expect(new Set(first.transactions.map(t => t.id)).size).toBe(420);
  });
});
it('provides stable source documents and shared ownership evidence for scenario cases', () => {
 const data=createSeed();
 expect(data.documents.find(d=>d.clientId==='CLI-002')?.corroboratedAmount).toBe(300000000);
 expect(data.relationships.filter(r=>r.owner==='Morgan Vale').length).toBeGreaterThanOrEqual(2);
 expect(data.documents.find(d=>d.clientId==='CLI-004')?.kind).toBe('property_sale');
});
it('flags a rapid movement only when a large inflow is followed by an outflow within 48 hours',async()=>{
 const {isRapidMovement}=await import('../src/lib/rules');
 expect(isRapidMovement(120000000,'2026-05-10',-85000000,'2026-05-11',10000000)).toBe(true);
 expect(isRapidMovement(120000000,'2026-05-10',-85000000,'2026-05-13',10000000)).toBe(false);
 expect(isRapidMovement(9000000,'2026-05-10',-85000000,'2026-05-11',10000000)).toBe(false);
});
it('derives scenario alerts from the evidence rather than the client position',async()=>{
 const {detectScenarios}=await import('../src/lib/rules');
 const client={expectedMonthlyMax:100,declaredWealth:800};
 const inflow={amount:1200,date:'2026-05-10',currency:'SGD'};
 const outflow={amount:-850,date:'2026-05-11',currency:'SGD'};
 expect(detectScenarios(client,[inflow,outflow],[],[])).toEqual(['rapid_movement']);
 expect(detectScenarios(client,[{...inflow,amount:50}],[],[])).toEqual([]);
 expect(detectScenarios(client,[inflow],[{kind:'company_sale',corroboratedAmount:300}],[])).toEqual(['wealth_gap']);
 expect(detectScenarios(client,[inflow],[],[{owner:'Owner',entity:'Holding',clientId:'A'},{owner:'Owner',entity:'Holding',clientId:'B'}])).toEqual(['linked_ownership']);
 expect(detectScenarios(client,[inflow],[{kind:'property_sale',corroboratedAmount:1200}],[])).toEqual(['documented_sale']);
});
it('assigns every fictional transaction to an account owned by the same client',()=>{
 const {clients,accounts,transactions}=createSeed();
 expect(accounts).toHaveLength(clients.length);
 expect(new Set(accounts.map(a=>a.id)).size).toBe(accounts.length);
 for(const transaction of transactions) expect(accounts.find(a=>a.id===transaction.accountId)?.clientId).toBe(transaction.clientId);
});
it('records that the wealth-gap client declares the company sale as the source of SGD 8 million',()=>{
 const data=createSeed();
 const client=data.clients.find(c=>c.id==='CLI-002')!;
 expect(client.declaredWealth).toBe(800000000);
 expect(client.profile).toMatch(/declares.*SGD 8 million.*company sale/i);
 expect(data.documents.find(d=>d.clientId===client.id)?.corroboratedAmount).toBe(300000000);
});
it('provides property-sale details consistent with the documented-sale transaction',()=>{
 const data=createSeed();
 const client=data.clients.find(c=>c.id==='CLI-004')!;
 const doc=data.documents.find(d=>d.id==='DOC-004')!;
 const txn=data.transactions.find(t=>t.id==='TXN-055')!;
 expect(doc.summary).toContain(client.name);
 expect(doc.summary).toContain(txn.counterparty);
 expect(doc.summary).toContain(txn.date);
 expect(doc.corroboratedAmount).toBe(txn.amount);
 expect(doc.summary).toMatch(/settlement trail.*not supplied/i);
});
