import { z } from 'zod';
import { checkGrounding } from './analysis';
import {
  approvalBlockers,
  SCREENING_DISPOSITION,
  SOURCE_OF_WEALTH_KINDS,
  suggestRiskRating,
  type OnboardingFile
} from './onboarding-rules';

export const ONBOARDING_FIXTURE_VERSION = 'kyc-v1';

const finding = z.object({ description: z.string(), evidence_ids: z.array(z.string()).min(1) });

// The draft can suggest a rating and a next step, but it has no way to approve or reject:
// those values do not exist in the schema.
export const onboardingAnalysisSchema = z.object({
  applicant_summary: z.string(),
  verified_facts: z.array(finding),
  risk_factors: z.array(finding),
  mitigating_factors: z.array(finding),
  outstanding_items: z.array(z.string()),
  suggested_risk_rating: z.enum(['low', 'medium', 'high']),
  suggested_next_step: z.enum(['request_information', 'refer_for_senior_review', 'ready_for_human_decision']),
  relevant_controls: z.array(z.object({ control_id: z.string(), explanation: z.string() })),
  draft_note: z.string(),
  limitations: z.array(z.string())
});
export type OnboardingAnalysis = z.infer<typeof onboardingAnalysisSchema>;

// Wording that would present a human decision, or an unconfirmed screening hit, as settled.
// "Potential PEP match" and "potential sanctions match" are deliberately not caught.
const onboardingProhibited = [
  /\b(?:client|applicant)\s+(?:is|has been)\s+(?:approved|rejected|onboarded|accepted|declined)\b/i,
  /\baccount\s+(?:has been|was|is)\s+opened\b/i,
  /\b(?:onboarding|application)\s+(?:is|has been|was)\s+(?:approved|rejected)\b/i,
  /\b(?:is|are)\s+(?:a\s+)?(?:confirmed\s+)?(?:PEP|sanctioned)\b(?!\s+(?:match|hit|result|screening|list|entry))/i
];

export function validateOnboardingAnalysis(value: unknown, evidenceIds: string[], controlIds: string[]) {
  const parsed = onboardingAnalysisSchema.safeParse(value);
  if (!parsed.success) return { success: false as const, error: 'Invalid analysis structure' };
  const draft = parsed.data;
  const findings = [...draft.verified_facts, ...draft.risk_factors, ...draft.mitigating_factors];
  const textFields = [
    draft.applicant_summary,
    draft.draft_note,
    ...findings.flatMap(f => [f.description, ...f.evidence_ids]),
    ...draft.outstanding_items,
    ...draft.limitations,
    ...draft.relevant_controls.flatMap(c => [c.control_id, c.explanation])
  ];
  const grounded = checkGrounding(
    { findings, textFields, controls: draft.relevant_controls },
    evidenceIds,
    controlIds,
    onboardingProhibited
  );
  if (!grounded.success) return grounded;
  return { success: true as const, data: draft };
}

const identityLabels: Record<string, string> = {
  passport: 'Passport',
  national_id: 'National ID',
  proof_of_address: 'Proof of address'
};

function sgd(cents: number): string {
  return `SGD ${(cents / 100).toLocaleString('en-SG')}`;
}

type Finding = { description: string; evidence_ids: string[] };

// Template draft built only from the rules' own output, with no AI involved.
export function onboardingFixture(file: OnboardingFile): OnboardingAnalysis {
  const suggestion = suggestRiskRating(file);
  const blockers = approvalBlockers(file, 'analyst');
  const rating = suggestion.rating.toLowerCase() as OnboardingAnalysis['suggested_risk_rating'];

  const verified_facts: Finding[] = [];
  for (const doc of file.identityDocuments) {
    if (doc.status === 'Verified') {
      verified_facts.push({
        description: `${identityLabels[doc.kind] ?? doc.kind} ${doc.id} has status Verified.`,
        evidence_ids: [doc.id]
      });
    }
  }
  for (const doc of file.documents) {
    if (SOURCE_OF_WEALTH_KINDS.includes(doc.kind) && doc.corroboratedAmount > 0) {
      verified_facts.push({
        description: `Document ${doc.id} (${doc.kind.replaceAll('_', ' ')}) corroborates ${sgd(doc.corroboratedAmount)}.`,
        evidence_ids: [doc.id, file.client.id]
      });
    }
  }
  for (const result of file.screeningResults) {
    if (result.disposition === SCREENING_DISPOSITION.cleared) {
      verified_facts.push({
        description: `Screening ${result.id} (${result.list}) was cleared as a false positive by an analyst.`,
        evidence_ids: [result.id]
      });
    }
  }

  const risk_factors: Finding[] = suggestion.factors.map(f => ({
    description: f.description,
    evidence_ids: f.evidenceIds
  }));
  for (const result of file.screeningResults) {
    if (result.disposition === SCREENING_DISPOSITION.potential) {
      risk_factors.push({
        description: `Screening ${result.id} is a potential ${result.list} match that needs an analyst decision.`,
        evidence_ids: [result.id]
      });
    }
  }

  const mitigating_factors: Finding[] = [];
  const wealthDocuments = file.documents.filter(d => SOURCE_OF_WEALTH_KINDS.includes(d.kind));
  const corroborated = wealthDocuments.reduce((sum, d) => sum + d.corroboratedAmount, 0);
  if (corroborated >= file.client.declaredWealth) {
    mitigating_factors.push({
      description: `Declared wealth of ${sgd(file.client.declaredWealth)} is fully corroborated by the supplied documents.`,
      evidence_ids: [file.client.id, ...wealthDocuments.filter(d => d.corroboratedAmount > 0).map(d => d.id)]
    });
  }
  for (const alert of file.alerts) {
    if (alert.status !== 'Open' && alert.status !== 'Escalated') {
      mitigating_factors.push({
        description: `Funding alert ${alert.id} has been reviewed by an analyst.`,
        evidence_ids: [alert.id]
      });
    }
  }

  const needsDocuments = blockers.some(b => /^(Passport|National ID|Proof of address|Identity document)/.test(b));
  const hasWealthGap = suggestion.factors.some(f => f.description.endsWith('of declared wealth not corroborated'));
  const suggested_next_step: OnboardingAnalysis['suggested_next_step'] =
    needsDocuments || hasWealthGap
      ? 'request_information'
      : suggestion.rating === 'High'
        ? 'refer_for_senior_review'
        : 'ready_for_human_decision';

  const limitations = [
    'Fixture demonstration; this is not a live AI response.',
    'Documents, screening results and ownership records are fictional.'
  ];
  if (file.screeningResults.some(r => r.disposition === SCREENING_DISPOSITION.potential)) {
    limitations.push('Potential screening matches do not change the suggested rating until an analyst decides them.');
  }

  const factorText = suggestion.factors.length
    ? suggestion.factors.map(f => f.description).join('; ')
    : 'none identified from the current records';
  const outstandingText = blockers.length ? blockers.join('; ') : 'none';
  const draft_note = [
    `KYC draft for ${file.client.name} (${file.client.id}), file ${file.onboarding.id}.`,
    `Suggested risk rating: ${suggestion.rating}. This is a suggestion; the analyst records the final rating.`,
    `Risk factors: ${factorText}.`,
    `Outstanding before a decision: ${outstandingText}.`
  ].join('\n');

  return {
    applicant_summary: `${file.client.name} (${file.client.id}) has an onboarding file with a suggested risk rating of ${suggestion.rating}. ${blockers.length} item${blockers.length === 1 ? '' : 's'} remain before a human decision.`,
    verified_facts,
    risk_factors,
    mitigating_factors,
    outstanding_items: blockers,
    suggested_risk_rating: rating,
    suggested_next_step,
    relevant_controls: [],
    draft_note,
    limitations
  };
}
