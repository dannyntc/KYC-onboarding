import { describe, expect, it } from 'vitest';
import {
  onboardingAnalysisSchema,
  onboardingFixture,
  validateOnboardingAnalysis,
  type OnboardingAnalysis
} from '../src/lib/onboarding-analysis';
import { suggestRiskRating, type OnboardingFile } from '../src/lib/onboarding-rules';
import { buildFile, seed } from './helpers/onboarding-file';

// Every record ID a draft for this file may cite.
function evidenceIdsOf(file: OnboardingFile): string[] {
  return [
    file.client.id,
    ...file.identityDocuments.map(d => d.id),
    ...file.screeningResults.map(s => s.id),
    ...file.documents.map(d => d.id),
    ...file.relationships.map(r => r.id),
    ...file.relatedRelationships.map(r => r.id),
    ...file.alerts.map(a => a.id)
  ];
}

const validDraft: OnboardingAnalysis = {
  applicant_summary: 'Review the file.',
  verified_facts: [{ description: 'Passport IDV-001 has status Verified.', evidence_ids: ['IDV-001'] }],
  risk_factors: [],
  mitigating_factors: [],
  outstanding_items: [],
  suggested_risk_rating: 'low',
  suggested_next_step: 'ready_for_human_decision',
  relevant_controls: [],
  draft_note: 'Analyst should review the file.',
  limitations: ['Test draft.']
};
const ids = ['IDV-001', 'SCR-001'];
const check = (draft: unknown) => validateOnboardingAnalysis(draft, ids, []);

describe('template draft', () => {
  it.each(seed.onboardingCases.map(c => c.id))('%s passes validation and cites only available records', caseId => {
    const file = buildFile(caseId);
    const draft = onboardingFixture(file);
    const result = validateOnboardingAnalysis(draft, evidenceIdsOf(file), []);
    expect(result.success, JSON.stringify(result)).toBe(true);
    expect(draft.suggested_risk_rating).toBe(suggestRiskRating(file).rating.toLowerCase());
    expect(draft.limitations.join(' ')).not.toMatch(/Fixture|fictional/);
    expect(draft.relevant_controls).toEqual([]);
  });

  it('ONB-002 shows the SGD 5,000,000 wealth gap citing the company-sale document', () => {
    const draft = onboardingFixture(buildFile('ONB-002'));
    const gap = draft.risk_factors.find(f => f.description.includes('SGD 5,000,000'));
    expect(gap?.evidence_ids).toContain('DOC-002');
    expect(draft.suggested_risk_rating).toBe('high');
    expect(draft.suggested_next_step).toBe('request_information');
  });

  it('suggests the documented next step for blocked, high-risk and clean files', () => {
    expect(onboardingFixture(buildFile('ONB-007')).suggested_next_step).toBe('request_information');
    expect(onboardingFixture(buildFile('ONB-011')).suggested_next_step).toBe('request_information');
    expect(onboardingFixture(buildFile('ONB-006')).suggested_next_step).toBe('ready_for_human_decision');
  });

  it('asks for information while any screening hit is still a potential match', () => {
    for (const caseId of ['ONB-008', 'ONB-009', 'ONB-010']) {
      expect(onboardingFixture(buildFile(caseId)).suggested_next_step, caseId).toBe('request_information');
    }
  });

  it('refers a High file for senior review, and is ready once a false positive is cleared', () => {
    const confirmed = buildFile('ONB-008');
    confirmed.screeningResults[0].disposition = 'Confirmed match';
    expect(onboardingFixture(confirmed).suggested_next_step).toBe('refer_for_senior_review');
    const cleared = buildFile('ONB-009');
    cleared.screeningResults[0].disposition = 'Cleared – false positive';
    expect(onboardingFixture(cleared).suggested_next_step).toBe('ready_for_human_decision');
  });

  it('describes an unresolved PEP hit as a potential match and cites it', () => {
    const draft = onboardingFixture(buildFile('ONB-008'));
    const hits = draft.risk_factors.filter(f => f.evidence_ids.includes('SCR-001')).map(f => f.description);
    expect(hits.some(description => /potential PEP match/.test(description))).toBe(true);
    expect(draft.outstanding_items).toContain('Screening SCR-001 needs a decision');
  });

  it('lists outstanding items from the approval blockers', () => {
    const draft = onboardingFixture(buildFile('ONB-007'));
    expect(draft.outstanding_items).toContain('Passport IDV-013 is Expired');
  });
});

describe('validation', () => {
  it('accepts a grounded draft', () => {
    expect(check(validDraft).success).toBe(true);
  });

  it.each([
    'The applicant is approved.',
    'The client has been accepted.',
    'The applicant has been onboarded.',
    'The applicant has been declined.',
    'The account has been opened.',
    'The onboarding is approved.',
    'The application has been rejected.',
    'The applicant is a PEP.',
    'The applicant is a confirmed PEP.',
    'The applicant is sanctioned.',
    'Customers are sanctioned.'
  ])('rejects the determination "%s"', sentence => {
    const result = check({ ...validDraft, draft_note: sentence });
    expect(result).toEqual({ success: false, error: 'Analysis contains a prohibited final determination' });
  });

  it('still rejects the determinations that the alert drafts already reject', () => {
    const result = check({ ...validDraft, applicant_summary: 'The case has been closed.' });
    expect(result.success).toBe(false);
  });

  it.each([
    'Screening SCR-001 is a potential PEP match.',
    'A potential sanctions match is unresolved.',
    'The applicant has a PEP match that needs an analyst decision.',
    'This is a PEP hit awaiting review.',
    'The applicant is not a PEP according to the analyst.',
    'The analyst will decide whether the match is confirmed.'
  ])('does not reject the cautious wording "%s"', sentence => {
    expect(check({ ...validDraft, draft_note: sentence }).success).toBe(true);
  });

  it('rejects an unknown evidence ID, an unknown control ID and an empty field', () => {
    const unknownEvidence = { ...validDraft, risk_factors: [{ description: 'Unknown.', evidence_ids: ['TXN-UNKNOWN'] }] };
    expect(check(unknownEvidence)).toEqual({ success: false, error: 'Analysis cites an unavailable record' });
    const unknownControl = { ...validDraft, relevant_controls: [{ control_id: 'MAS-X', explanation: 'Consider.' }] };
    expect(check(unknownControl)).toEqual({ success: false, error: 'Analysis cites an unavailable record' });
    expect(check({ ...validDraft, applicant_summary: '  ' })).toEqual({
      success: false,
      error: 'Analysis contains an empty field'
    });
  });

  it('has no way to output an approval or rejection', () => {
    for (const bad of [
      { suggested_next_step: 'approve' },
      { suggested_next_step: 'reject' },
      { suggested_risk_rating: 'approved' },
      { suggested_risk_rating: 'High' }
    ]) {
      expect(check({ ...validDraft, ...bad })).toEqual({ success: false, error: 'Invalid analysis structure' });
    }
    expect(onboardingAnalysisSchema.shape.suggested_next_step.options).toEqual([
      'request_information',
      'refer_for_senior_review',
      'ready_for_human_decision'
    ]);
  });
});
