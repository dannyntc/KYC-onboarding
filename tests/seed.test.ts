import { createHash } from 'node:crypto';
import { describe, it, expect } from 'vitest';
import { createSeed } from '../src/lib/seed-data';

describe('demo seed', () => {
  it('is repeatable and holds the 12 applicants plus one related existing client', () => {
    const first = createSeed();
    expect(first).toEqual(createSeed());
    expect(first.clients.map(c => c.id)).toEqual([
      'CLI-001', 'CLI-002', 'CLI-003', 'CLI-004', 'CLI-007', 'CLI-011', 'CLI-013',
      'CLI-014', 'CLI-015', 'CLI-016', 'CLI-017', 'CLI-018', 'CLI-019'
    ]);
    expect(first.clients.find(c => c.id === 'CLI-011')?.name).toBe('Mei Lin Chua');
  });
});
it('provides stable source documents and shared ownership evidence', () => {
 const data=createSeed();
 expect(data.documents.find(d=>d.clientId==='CLI-002')?.corroboratedAmount).toBe(300000000);
 expect(data.relationships.filter(r=>r.owner==='Morgan Vale').map(r=>r.clientId)).toEqual(['CLI-003','CLI-007','CLI-011']);
 expect(data.documents.find(d=>d.clientId==='CLI-004')?.kind).toBe('property_sale');
});
it('records that the wealth-gap client declares the company sale as the source of SGD 8 million',()=>{
 const data=createSeed();
 const client=data.clients.find(c=>c.id==='CLI-002')!;
 expect(client.declaredWealth).toBe(800000000);
 expect(client.profile).toMatch(/declares.*SGD 8 million.*company sale/i);
 expect(data.documents.find(d=>d.clientId===client.id)?.corroboratedAmount).toBe(300000000);
});
it('records the property sale behind the documented wealth of CLI-004',()=>{
 const data=createSeed();
 const client=data.clients.find(c=>c.id==='CLI-004')!;
 const doc=data.documents.find(d=>d.id==='DOC-004')!;
 expect(doc.summary).toContain(client.name);
 expect(doc.summary).toContain('proceeds SGD 2,500,000');
 expect(doc.corroboratedAmount).toBe(250000000);
 expect(doc.summary).toMatch(/settlement trail.*not supplied/i);
});

function fingerprint(value: unknown) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

describe('KYC onboarding seed', () => {
  it('keeps the demo records unchanged', () => {
    const data = createSeed();
    // Updated when transaction alerts, transactions, accounts and the people who existed only for alerts
    // were removed; every remaining record was checked to be byte-for-byte identical to before.
    expect(fingerprint(data.clients)).toBe('157fa19e8478478f5892dea26ff68bcf3b13141db6fe2da599628227ed7432b3');
    expect(fingerprint(data.relationships)).toBe('a0e0d17ff21095ead7f68194a177f141e27ab0805600304707ee37ea40f1e20a');
    expect(fingerprint(data.documents.slice(0, 6))).toBe('c4bcbe5423303d833836a4f1f045ee91f28f89f3b592e35852c81e0aeba9b20b');
    expect(data.documents.slice(6)).toEqual(data.supplementalDocuments);
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
  });
});
