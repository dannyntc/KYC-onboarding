import { createHash } from 'node:crypto';
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

function fingerprint(value: unknown) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

describe('KYC onboarding seed', () => {
  it('keeps the original alert seed byte-for-byte identical and only appends', () => {
    const data = createSeed();
    // Fingerprints taken from the seed before the onboarding data was added.
    expect(fingerprint(data.clients)).toBe('409d558b3cfca10a65008bd9bffb798643c595f8eb3fa2762c0869f980e06d59');
    expect(fingerprint(data.accounts)).toBe('1ef64955462c84be8b7e21e7a9ee2e7acf08d908103f1972ae9f5abef70bedd4');
    expect(fingerprint(data.transactions)).toBe('d9ef1f531950bbc05faf4e011cbfa6b7e042791bc68c83aee68a35fa2794efff');
    expect(fingerprint(data.alerts)).toBe('6bdfa9af64519fb1e14e98693dfa87a28cb4f24f9c704573037f88e9f7e41fbd');
    expect(fingerprint(data.relationships)).toBe('56448318e5174f7d9911680018c1271a748cb9046e1ee26fb73b83386f816bff');
    expect(fingerprint(data.documents.slice(0, 12))).toBe('9b25640c96df264701f92587d8bfa6f4fc39bd9643820f8f871f503cbd4d4d0f');
    expect(data.documents.slice(12)).toEqual(data.supplementalDocuments);
  });

  it('has 12 onboarding cases for existing clients, with unique IDs everywhere', () => {
    const data = createSeed();
    const clientIds = new Set(data.clients.map(c => c.id));
    expect(data.onboardingCases.map(c => c.id)).toEqual(
      Array.from({ length: 12 }, (_, i) => `ONB-${String(i + 1).padStart(3, '0')}`)
    );
    expect(new Set(data.onboardingCases.map(c => c.clientId)).size).toBe(12);
    const records = [
      ...data.onboardingCases,
      ...data.identityDocuments,
      ...data.screeningResults,
      ...data.documents
    ];
    for (const record of records) {
      expect(clientIds.has(record.clientId)).toBe(true);
    }
    for (const list of [data.onboardingCases, data.identityDocuments, data.screeningResults, data.documents]) {
      expect(new Set(list.map(r => r.id)).size).toBe(list.length);
    }
    expect(data.onboardingCases.every(c => c.status === 'In progress' && c.riskRating === null && c.version === 0)).toBe(true);
  });

  it('seeds the documented identity and screening stories', () => {
    const data = createSeed();
    const identity = (clientId: string, kind: string) =>
      data.identityDocuments.find(d => d.clientId === clientId && d.kind === kind);
    expect(data.identityDocuments).toHaveLength(24);
    expect(identity('CLI-014', 'passport')?.status).toBe('Expired');
    expect(identity('CLI-018', 'proof_of_address')?.status).toBe('Missing');
    const problems = data.identityDocuments.filter(d => d.status !== 'Verified').map(d => d.clientId);
    expect(problems.sort()).toEqual(['CLI-014', 'CLI-018']);
    expect(data.screeningResults.map(s => [s.clientId, s.list, s.matchStrength])).toEqual([
      ['CLI-015', 'PEP', 'Strong'],
      ['CLI-016', 'Sanctions', 'Partial'],
      ['CLI-017', 'Adverse media', 'Partial']
    ]);
    expect(data.screeningResults.every(s => s.disposition === 'Potential match' && s.dispositionReason === '')).toBe(true);
    expect(data.screeningResults.find(s => s.clientId === 'CLI-016')?.summary).toMatch(/1988.*Singapore/);
  });

  it('uses real calendar dates, with valid passports expiring after the application and the expired one before it', () => {
    const data = createSeed();
    const isRealDate = (value: string) => new Date(value).toISOString().slice(0, 10) === value;
    for (const onboarding of data.onboardingCases) {
      expect(isRealDate(onboarding.applicationDate)).toBe(true);
    }
    for (const doc of data.identityDocuments) {
      if (doc.expiresOn === null) continue;
      expect(isRealDate(doc.expiresOn)).toBe(true);
      const applicationDate = data.onboardingCases.find(c => c.clientId === doc.clientId)!.applicationDate;
      if (doc.status === 'Verified') expect(doc.expiresOn > applicationDate).toBe(true);
      if (doc.status === 'Expired') expect(doc.expiresOn < applicationDate).toBe(true);
    }
    expect(data.identityDocuments.filter(d => d.kind === 'passport').every(d => d.expiresOn !== null)).toBe(true);
  });

  it('applies before any activity on the account, so money never moves before the application', () => {
    const data = createSeed();
    for (const onboarding of data.onboardingCases) {
      const dates = data.transactions.filter(t => t.clientId === onboarding.clientId).map(t => t.date);
      expect(dates.every(date => date > onboarding.applicationDate), onboarding.id).toBe(true);
    }
  });

  it('uses only new document kinds for supplemental documents and matches declared wealth', () => {
    const data = createSeed();
    expect(data.supplementalDocuments.map(d => d.id)).toEqual(
      Array.from({ length: 11 }, (_, i) => `DOC-${101 + i}`)
    );
    for (const doc of data.supplementalDocuments) {
      expect(['employment_income', 'investment_portfolio', 'inheritance']).toContain(doc.kind);
    }
    const wealthKinds = ['company_sale', 'property_sale', 'employment_income', 'investment_portfolio', 'inheritance'];
    for (const onboarding of data.onboardingCases) {
      const client = data.clients.find(c => c.id === onboarding.clientId)!;
      const corroborated = data.documents
        .filter(d => d.clientId === client.id && wealthKinds.includes(d.kind))
        .reduce((sum, d) => sum + d.corroboratedAmount, 0);
      // CLI-002 is the source-of-wealth gap story: SGD 3m documented against SGD 8m declared.
      expect(corroborated).toBe(client.id === 'CLI-002' ? 300000000 : client.declaredWealth);
    }
    expect(data.alerts).toHaveLength(12);
  });
});
