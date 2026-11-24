const names = ['Amelia Tan','Daniel Lim','Priya Menon','Marcus Lee','Sofia Ng','Adrian Koh','Nadia Rahman','Julian Ong','Clara Goh','Victor Teo','Mei Lin Chua','Arun Nair','Sarah Yeo','Darren Ho','Aisha Malik','Ethan Sim','Isabelle Tay','Raj Mehta','Rachel Chan','Nicholas Low','Fiona Wong','Zahir Khan','Grace Ang','Benjamin Toh','Lina Yusuf','Caleb Foo','Joanne Seah','Kiran Shah','Natalie Pang','David Lau'];
// Demo data. Client IDs come from each name's position, so removed people leave gaps (CLI-005 etc.).
export function createSeed() {
 // The 12 applicants, plus CLI-011: an existing client who shares a beneficial owner with two applicants.
 const kept = new Set([...applicants.map(a => a.clientId), 'CLI-011']);
 const allClients = names.map((name, i) => ({id:`CLI-${String(i+1).padStart(3,'0')}`, name, expectedMonthlyMin:5000000, expectedMonthlyMax:10000000, declaredWealth: i%4===1 ? 800000000 : 450000000, profile: i<12 && i%4===1 ? 'Private banking client; Singapore resident. Client declares SGD 8 million in wealth from a company sale.' : 'Private banking client; Singapore resident.'}));
 const clients = allClients.filter(c => kept.has(c.id));
 const documents = allClients.slice(0,12).map((c,i)=>({id:`DOC-${String(i+1).padStart(3,'0')}`,clientId:c.id,kind:i%4===1?'company_sale':i%4===3?'property_sale':'profile',title:i%4===1?'Company sale extract':i%4===3?'Property sale agreement':'Client profile declaration',summary:i%4===1?'Sale extract corroborates SGD 3m against SGD 8m declared.':i%4===3?`Signed agreement summary for property PROP-${String(i+1).padStart(3,'0')}: seller ${c.name}; buyer Harbour Property Buyer; completion 2026-05-10; proceeds SGD 2,500,000. Settlement trail not supplied.`:'Profile information; additional corroboration may be required.',corroboratedAmount:i%4===1?300000000:i%4===3?250000000:0})).filter(d => kept.has(d.clientId));
 const relationships = [{id:'REL-001',clientId:'CLI-003',owner:'Morgan Vale',entity:'Cedar Harbour Holdings',description:'Beneficial owner of holding entity.'},{id:'REL-002',clientId:'CLI-007',owner:'Morgan Vale',entity:'Cedar Harbour Holdings',description:'Beneficial owner of holding entity.'},{id:'REL-003',clientId:'CLI-011',owner:'Morgan Vale',entity:'Cedar Harbour Holdings',description:'Beneficial owner of holding entity.'}];
 const supplementalDocuments = createSupplementalDocuments();
 return {clients,documents:[...documents,...supplementalDocuments],relationships,onboardingCases:createOnboardingCases(),identityDocuments:createIdentityDocuments(),screeningResults:createScreeningResults(),supplementalDocuments};
}

// KYC onboarding data. Amounts are in cents, like the rest of the seed.

type Applicant = {
  caseId: string;
  clientId: string;
  applicationDate: string;
  purpose: string;
  passport: 'Verified' | 'Expired';
  proofOfAddress: 'Verified' | 'Missing';
};

const applicants: Applicant[] = [
  {caseId:'ONB-001',clientId:'CLI-001',applicationDate:'2025-12-15',purpose:'Day-to-day private banking and treasury management',passport:'Verified',proofOfAddress:'Verified'},
  {caseId:'ONB-002',clientId:'CLI-002',applicationDate:'2025-12-16',purpose:'Wealth management of company sale proceeds',passport:'Verified',proofOfAddress:'Verified'},
  {caseId:'ONB-003',clientId:'CLI-003',applicationDate:'2025-12-17',purpose:'Investment management for a family holding structure',passport:'Verified',proofOfAddress:'Verified'},
  {caseId:'ONB-004',clientId:'CLI-004',applicationDate:'2025-12-18',purpose:'Wealth management following a property sale',passport:'Verified',proofOfAddress:'Verified'},
  {caseId:'ONB-005',clientId:'CLI-007',applicationDate:'2025-12-19',purpose:'Investment management for a family holding structure',passport:'Verified',proofOfAddress:'Verified'},
  {caseId:'ONB-006',clientId:'CLI-013',applicationDate:'2025-12-22',purpose:'Wealth management of employment income and savings',passport:'Verified',proofOfAddress:'Verified'},
  {caseId:'ONB-007',clientId:'CLI-014',applicationDate:'2025-12-23',purpose:'Wealth management of an inheritance',passport:'Expired',proofOfAddress:'Verified'},
  {caseId:'ONB-008',clientId:'CLI-015',applicationDate:'2025-12-24',purpose:'Private banking and long-term investment',passport:'Verified',proofOfAddress:'Verified'},
  {caseId:'ONB-009',clientId:'CLI-016',applicationDate:'2025-12-26',purpose:'Private banking and long-term investment',passport:'Verified',proofOfAddress:'Verified'},
  {caseId:'ONB-010',clientId:'CLI-017',applicationDate:'2025-12-29',purpose:'Private banking and long-term investment',passport:'Verified',proofOfAddress:'Verified'},
  {caseId:'ONB-011',clientId:'CLI-018',applicationDate:'2025-12-30',purpose:'Wealth management of investment portfolio proceeds',passport:'Verified',proofOfAddress:'Missing'},
  {caseId:'ONB-012',clientId:'CLI-019',applicationDate:'2025-12-31',purpose:'Wealth management of employment income and savings',passport:'Verified',proofOfAddress:'Verified'}
];

function createOnboardingCases() {
  return applicants.map(a => ({
    id: a.caseId,
    clientId: a.clientId,
    applicationDate: a.applicationDate,
    purpose: a.purpose,
    status: 'In progress',
    riskRating: null as string | null,
    riskRationale: '',
    notes: '',
    version: 0
  }));
}

const expiredPassportDate = '2025-09-14';

function createIdentityDocuments() {
  return applicants.flatMap((a, index) => {
    const first = index * 2 + 1;
    const expired = a.passport === 'Expired';
    const missing = a.proofOfAddress === 'Missing';
    const validUntil = `${2029 + (index % 3)}-${String((index % 12) + 1).padStart(2, '0')}-15`;
    return [
      {
        id: `IDV-${String(first).padStart(3, '0')}`,
        clientId: a.clientId,
        kind: 'passport',
        title: 'Passport (Republic of Singapore)',
        status: a.passport as string,
        expiresOn: expired ? expiredPassportDate : validUntil,
        summary: expired
          ? `Passport expired on ${expiredPassportDate}; a valid replacement has not been supplied.`
          : 'Passport check passed: name and photograph are consistent with the application.'
      },
      {
        id: `IDV-${String(first + 1).padStart(3, '0')}`,
        clientId: a.clientId,
        kind: 'proof_of_address',
        title: 'Proof of address (utility bill)',
        status: a.proofOfAddress as string,
        expiresOn: null as string | null,
        summary: missing
          ? 'No proof of address has been supplied with the application.'
          : 'Utility bill dated November 2025 confirms the declared Singapore residential address.'
      }
    ];
  });
}

function createScreeningResults() {
  return [
    {
      id: 'SCR-001',
      clientId: 'CLI-015',
      list: 'PEP',
      matchedName: 'Aisha Malik',
      matchStrength: 'Strong',
      summary: 'Watch-list entry: Aisha Malik, former deputy minister in a government ministry (left office in 2022). Name, date of birth and nationality are consistent with the applicant.',
      disposition: 'Potential match',
      dispositionReason: ''
    },
    {
      id: 'SCR-002',
      clientId: 'CLI-016',
      list: 'Sanctions',
      matchedName: 'Ethan Sim',
      matchStrength: 'Partial',
      summary: 'Watch-list entry: Ethan Sim, born 1961, national of another country. The applicant was born in 1988 and holds Singapore nationality, so the entry appears to describe a different person.',
      disposition: 'Potential match',
      dispositionReason: ''
    },
    {
      id: 'SCR-003',
      clientId: 'CLI-017',
      list: 'Adverse media',
      matchedName: 'Isabelle Tay',
      matchStrength: 'Partial',
      summary: 'News article reporting a fraud investigation of an Isabelle Tay, a director of an unrelated company in another country. Nothing links the article to the applicant beyond the name.',
      disposition: 'Potential match',
      dispositionReason: ''
    }
  ];
}

// Extra source-of-wealth evidence for the applicants.
function createSupplementalDocuments() {
  const rows: {id: string; clientId: string; kind: string; title: string; summary: string; corroboratedAmount: number}[] = [
    {id:'DOC-101',clientId:'CLI-001',kind:'employment_income',title:'Employment income statements',summary:'Payslips and tax assessments corroborate SGD 4.5m of the SGD 4.5m declared.',corroboratedAmount:450000000},
    {id:'DOC-102',clientId:'CLI-003',kind:'investment_portfolio',title:'Investment portfolio statement',summary:'Custodian statement corroborates SGD 4.5m of the SGD 4.5m declared.',corroboratedAmount:450000000},
    {id:'DOC-103',clientId:'CLI-004',kind:'employment_income',title:'Employment income statements',summary:'Payslips and tax assessments corroborate SGD 2m of the SGD 4.5m declared; the remaining SGD 2.5m is covered by the property sale agreement DOC-004.',corroboratedAmount:200000000},
    {id:'DOC-104',clientId:'CLI-007',kind:'investment_portfolio',title:'Investment portfolio statement',summary:'Custodian statement corroborates SGD 4.5m of the SGD 4.5m declared.',corroboratedAmount:450000000},
    {id:'DOC-105',clientId:'CLI-013',kind:'employment_income',title:'Employment income statements',summary:'Payslips and tax assessments corroborate SGD 4.5m of the SGD 4.5m declared.',corroboratedAmount:450000000},
    {id:'DOC-106',clientId:'CLI-014',kind:'inheritance',title:'Estate distribution letter',summary:'Estate distribution letter corroborates SGD 8m of the SGD 8m declared.',corroboratedAmount:800000000},
    {id:'DOC-107',clientId:'CLI-015',kind:'investment_portfolio',title:'Investment portfolio statement',summary:'Custodian statement corroborates SGD 4.5m of the SGD 4.5m declared.',corroboratedAmount:450000000},
    {id:'DOC-108',clientId:'CLI-016',kind:'employment_income',title:'Employment income statements',summary:'Payslips and tax assessments corroborate SGD 4.5m of the SGD 4.5m declared.',corroboratedAmount:450000000},
    {id:'DOC-109',clientId:'CLI-017',kind:'investment_portfolio',title:'Investment portfolio statement',summary:'Custodian statement corroborates SGD 4.5m of the SGD 4.5m declared.',corroboratedAmount:450000000},
    {id:'DOC-110',clientId:'CLI-018',kind:'investment_portfolio',title:'Investment portfolio statement',summary:'Custodian statement corroborates SGD 8m of the SGD 8m declared.',corroboratedAmount:800000000},
    {id:'DOC-111',clientId:'CLI-019',kind:'employment_income',title:'Employment income statements',summary:'Payslips and tax assessments corroborate SGD 4.5m of the SGD 4.5m declared.',corroboratedAmount:450000000}
  ];
  return rows;
}
