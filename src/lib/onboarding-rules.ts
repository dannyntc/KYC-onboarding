// Pure KYC onboarding rules. Nothing in this file reads or writes the database:
// a loader builds an OnboardingFile and these functions decide what it means.

export type DemoRole = 'analyst' | 'read-only' | 'senior-approver';
export type RiskRating = 'Low' | 'Medium' | 'High';

export const ONBOARDING_STATUS = {
  inProgress: 'In progress',
  informationRequested: 'Information requested',
  pendingSenior: 'Pending senior approval',
  approved: 'Approved',
  rejected: 'Rejected'
} as const;

export const SCREENING_DISPOSITION = {
  potential: 'Potential match',
  cleared: 'Cleared – false positive',
  confirmed: 'Confirmed match'
} as const;

const RATINGS: RiskRating[] = ['Low', 'Medium', 'High'];

// Document kinds that count towards explaining declared wealth.
export const SOURCE_OF_WEALTH_KINDS = [
  'company_sale',
  'property_sale',
  'employment_income',
  'investment_portfolio',
  'inheritance'
];

export type OnboardingFile = {
  client: { id: string; name: string; declaredWealth: number };
  onboarding: {
    id: string;
    status: string;
    riskRating: string | null;
    riskRationale: string;
    notes: string;
  };
  identityDocuments: { id: string; kind: string; status: string }[];
  screeningResults: {
    id: string;
    list: string;
    disposition: string;
    dispositionReason: string;
  }[];
  // All KYC documents of the client. Only the source-of-wealth kinds are used for the wealth gap.
  documents: { id: string; kind: string; corroboratedAmount: number }[];
  // The applicant's own ownership records.
  relationships: { id: string; clientId: string; owner: string; entity: string }[];
  // Ownership records of other clients that share an owner and entity with the applicant.
  relatedRelationships: { id: string; clientId: string; owner: string; entity: string }[];
  alerts: { id: string; status: string }[];
};

export type RiskFactor = {
  description: string;
  evidenceIds: string[];
  weight: 'High' | 'Medium';
};

export type RiskSuggestion = {
  rating: RiskRating;
  factors: RiskFactor[];
};

function formatSgd(cents: number): string {
  return `SGD ${(cents / 100).toLocaleString('en-SG')}`;
}

function ids(items: { id: string }[]): string[] {
  return items.map(item => item.id);
}

export function suggestRiskRating(file: OnboardingFile): RiskSuggestion {
  const factors: RiskFactor[] = [];

  const confirmedPepOrSanctions = file.screeningResults.filter(
    r => (r.list === 'PEP' || r.list === 'Sanctions') && r.disposition === SCREENING_DISPOSITION.confirmed
  );
  if (confirmedPepOrSanctions.length > 0) {
    factors.push({
      description: 'Confirmed PEP/sanctions match',
      evidenceIds: ids(confirmedPepOrSanctions),
      weight: 'High'
    });
  }

  const unresolvedSanctions = file.screeningResults.filter(
    r => r.list === 'Sanctions' && r.disposition === SCREENING_DISPOSITION.potential
  );
  if (unresolvedSanctions.length > 0) {
    factors.push({
      description: 'Unresolved sanctions match',
      evidenceIds: ids(unresolvedSanctions),
      weight: 'High'
    });
  }

  const wealthDocuments = file.documents.filter(d => SOURCE_OF_WEALTH_KINDS.includes(d.kind));
  const corroborated = wealthDocuments.reduce((sum, d) => sum + d.corroboratedAmount, 0);
  if (corroborated < file.client.declaredWealth) {
    const supporting = wealthDocuments.filter(d => d.corroboratedAmount > 0);
    factors.push({
      description: `${formatSgd(file.client.declaredWealth - corroborated)} of declared wealth not corroborated`,
      evidenceIds: [file.client.id, ...ids(supporting)],
      weight: 'High'
    });
  }

  const confirmedAdverseMedia = file.screeningResults.filter(
    r => r.list === 'Adverse media' && r.disposition === SCREENING_DISPOSITION.confirmed
  );
  if (confirmedAdverseMedia.length > 0) {
    factors.push({
      description: 'Confirmed adverse media',
      evidenceIds: ids(confirmedAdverseMedia),
      weight: 'Medium'
    });
  }

  // Same matching idea as detectScenarios() in rules.ts: a different client with the same owner and entity.
  const sharedOwnerLinks = file.relationships.flatMap(own =>
    file.relatedRelationships.filter(
      other => other.clientId !== own.clientId && other.owner === own.owner && other.entity === own.entity
    ).map(other => ({ own, other }))
  );
  if (sharedOwnerLinks.length > 0) {
    const clientIds = [...new Set(sharedOwnerLinks.map(link => link.other.clientId))];
    const recordIds = [...new Set(sharedOwnerLinks.flatMap(link => [link.own.id, link.other.id]))];
    factors.push({
      description: `Shared beneficial owner with ${clientIds.join(', ')}`,
      evidenceIds: recordIds,
      weight: 'Medium'
    });
  }

  for (const alert of file.alerts) {
    if (alert.status === 'Open' || alert.status === 'Escalated') {
      factors.push({
        description: `Initial transaction alert ${alert.id} requires review`,
        evidenceIds: [alert.id],
        weight: 'Medium'
      });
    }
  }

  const rating: RiskRating = factors.some(f => f.weight === 'High')
    ? 'High'
    : factors.length > 0
      ? 'Medium'
      : 'Low';
  return { rating, factors };
}

const IDENTITY_KIND_LABELS: Record<string, string> = {
  passport: 'Passport',
  national_id: 'National ID',
  proof_of_address: 'Proof of address'
};

export const SENIOR_APPROVAL_BLOCKER = 'High-risk applicants need senior approval';

function isDecided(status: string): boolean {
  return status === ONBOARDING_STATUS.approved || status === ONBOARDING_STATUS.rejected;
}

function ratingRank(rating: string | null): number {
  return rating === null ? -1 : RATINGS.indexOf(rating as RiskRating);
}

// An empty list means the file can be approved. Blockers are listed in the order of the plan.
export function approvalBlockers(file: OnboardingFile, role: DemoRole): string[] {
  const blockers: string[] = [];

  for (const doc of file.identityDocuments) {
    if (doc.status !== 'Verified') {
      const label = IDENTITY_KIND_LABELS[doc.kind] ?? doc.kind;
      blockers.push(`${label} ${doc.id} is ${doc.status}`);
    }
  }

  const hasPhotoId = file.identityDocuments.some(d => d.kind === 'passport' || d.kind === 'national_id');
  if (!hasPhotoId) blockers.push('Identity document missing: no passport or national ID on file');
  if (!file.identityDocuments.some(d => d.kind === 'proof_of_address')) blockers.push('Proof of address missing');

  for (const result of file.screeningResults) {
    if (result.disposition === SCREENING_DISPOSITION.potential) {
      blockers.push(`Screening ${result.id} needs a decision`);
    }
  }

  for (const alert of file.alerts) {
    if (alert.status === 'Open') blockers.push(`Alert ${alert.id} has not been reviewed`);
  }

  const { riskRating, riskRationale } = file.onboarding;
  const rationale = riskRationale.trim();
  if (!riskRating || rationale.length < 20) blockers.push('Record a final risk rating and reasons');

  if (riskRating === 'High' && role !== 'senior-approver') blockers.push(SENIOR_APPROVAL_BLOCKER);

  const suggested = suggestRiskRating(file).rating;
  if (riskRating && ratingRank(riskRating) < ratingRank(suggested) && rationale.length < 50) {
    blockers.push('Explain why the rating is lower than suggested');
  }

  if (isDecided(file.onboarding.status)) blockers.push('Decision already recorded');

  return blockers;
}

export type OnboardingAction =
  | 'request-info'
  | 'set-risk'
  | 'approve'
  | 'reject'
  | 'screening-disposition';

export type OnboardingInput = {
  note?: string;
  riskRating?: string;
  riskRationale?: string;
  screeningId?: string;
  disposition?: string;
  reason?: string;
};

// Thrown when an action is not allowed. The message is plain text that can be shown to the analyst.
export class OnboardingRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OnboardingRuleError';
  }
}

// Decides the outcome of one analyst action. The caller stores the result and writes an audit event
// using `detail`, a JSON string with before and after values.
export function onboardingTransition(
  before: OnboardingFile,
  action: OnboardingAction,
  input: OnboardingInput,
  role: DemoRole
): { status: string; detail: string } {
  if (role === 'read-only') throw new OnboardingRuleError('The read-only role cannot change onboarding files');
  const current = before.onboarding;
  if (isDecided(current.status)) throw new OnboardingRuleError('Decision already recorded');

  switch (action) {
    case 'request-info': {
      const note = (input.note ?? '').trim();
      if (!note) throw new OnboardingRuleError('A note is required to request information');
      const status = ONBOARDING_STATUS.informationRequested;
      return {
        status,
        detail: JSON.stringify({
          before: { status: current.status, notes: current.notes },
          after: { status, notes: note }
        })
      };
    }

    case 'reject': {
      const note = (input.note ?? '').trim();
      if (!note) throw new OnboardingRuleError('A note is required to reject an application');
      const status = ONBOARDING_STATUS.rejected;
      return {
        status,
        detail: JSON.stringify({
          before: { status: current.status, notes: current.notes },
          after: { status, notes: note }
        })
      };
    }

    case 'set-risk': {
      if (!RATINGS.includes(input.riskRating as RiskRating)) {
        throw new OnboardingRuleError('Risk rating must be Low, Medium or High');
      }
      return {
        status: current.status,
        detail: JSON.stringify({
          before: { riskRating: current.riskRating, riskRationale: current.riskRationale },
          after: { riskRating: input.riskRating, riskRationale: input.riskRationale ?? '' }
        })
      };
    }

    case 'approve': {
      const blockers = approvalBlockers(before, role);
      let status: string;
      if (blockers.length === 0) {
        status = ONBOARDING_STATUS.approved;
      } else if (blockers.length === 1 && blockers[0] === SENIOR_APPROVAL_BLOCKER) {
        status = ONBOARDING_STATUS.pendingSenior;
      } else {
        throw new OnboardingRuleError(`Cannot approve yet: ${blockers.join('; ')}`);
      }
      return {
        status,
        detail: JSON.stringify({
          before: { status: current.status, notes: current.notes },
          after: { status, notes: input.note?.trim() ? input.note.trim() : current.notes }
        })
      };
    }

    case 'screening-disposition': {
      const result = before.screeningResults.find(r => r.id === input.screeningId);
      if (!result) throw new OnboardingRuleError('Screening result not found on this file');
      const outcomes: string[] = [SCREENING_DISPOSITION.cleared, SCREENING_DISPOSITION.confirmed];
      if (!input.disposition || !outcomes.includes(input.disposition)) {
        throw new OnboardingRuleError('Disposition must be a cleared false positive or a confirmed match');
      }
      if (result.disposition !== SCREENING_DISPOSITION.potential) {
        throw new OnboardingRuleError(`Screening ${result.id} already has a decision`);
      }
      const reason = (input.reason ?? '').trim();
      if (reason.length < 10) {
        throw new OnboardingRuleError('A reason of at least 10 characters is required');
      }
      return {
        status: current.status,
        detail: JSON.stringify({
          before: {
            screeningId: result.id,
            disposition: result.disposition,
            dispositionReason: result.dispositionReason
          },
          after: { screeningId: result.id, disposition: input.disposition, dispositionReason: reason }
        })
      };
    }

    default:
      throw new OnboardingRuleError('Unsupported onboarding action');
  }
}

// The check keys that apply to a file. Regulatory references are tagged with these keys.
export function onboardingCheckKeys(file: OnboardingFile): string[] {
  const keys = ['identity_verification', 'screening', 'risk_assessment'];
  if (file.relationships.length > 0) keys.push('beneficial_ownership');
  if (file.screeningResults.some(r => r.list === 'PEP')) keys.push('pep', 'source_of_wealth');
  return keys;
}
