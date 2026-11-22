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
