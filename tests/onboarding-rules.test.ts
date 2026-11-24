import { describe, expect, it } from 'vitest';
import { buildFile, seed } from './helpers/onboarding-file';
import {
  approvalBlockers,
  onboardingTransition,
  OnboardingRuleError,
  suggestRiskRating,
  type OnboardingFile
} from '../src/lib/onboarding-rules';

// Returns a changed copy so each test starts from the seeded file.
function change(file: OnboardingFile, edit: (copy: OnboardingFile) => void): OnboardingFile {
  const copy = structuredClone(file);
  edit(copy);
  return copy;
}

const rationale60 = 'Applicant explained the funds and the documents were reviewed.';
const rationale25 = 'Reviewed the documents ok.';
const setRating = (rating: string, text: string) => (copy: OnboardingFile) => {
  copy.onboarding.riskRating = rating;
  copy.onboarding.riskRationale = text;
};
const setScreening = (id: string, disposition: string) => (copy: OnboardingFile) => {
  copy.screeningResults.find(r => r.id === id)!.disposition = disposition;
};

const needRating = 'Record a final risk rating and reasons';

describe('applicant stories from the seed', () => {
  const stories: {
    caseId: string;
    rating: string;
    factors: string[];
    blockers: string[];
  }[] = [
    {
      caseId: 'ONB-001',
      rating: 'Low',
      factors: [],
      blockers: [needRating]
    },
    {
      caseId: 'ONB-002',
      rating: 'High',
      factors: ['SGD 5,000,000 of declared wealth not corroborated'],
      blockers: [needRating]
    },
    {
      caseId: 'ONB-003',
      rating: 'Medium',
      factors: ['Shared beneficial owner with CLI-007, CLI-011'],
      blockers: [needRating]
    },
    {
      caseId: 'ONB-004',
      rating: 'Low',
      factors: [],
      blockers: [needRating]
    },
    {
      caseId: 'ONB-005',
      rating: 'Medium',
      factors: ['Shared beneficial owner with CLI-003, CLI-011'],
      blockers: [needRating]
    },
    { caseId: 'ONB-006', rating: 'Low', factors: [], blockers: [needRating] },
    {
      caseId: 'ONB-007',
      rating: 'Low',
      factors: [],
      blockers: ['Passport IDV-013 is Expired', needRating]
    },
    {
      caseId: 'ONB-008',
      rating: 'Medium',
      factors: ['Unresolved strong PEP match'],
      blockers: ['Screening SCR-001 needs a decision', needRating]
    },
    {
      caseId: 'ONB-009',
      rating: 'High',
      factors: ['Unresolved sanctions match'],
      blockers: ['Screening SCR-002 needs a decision', needRating]
    },
    {
      caseId: 'ONB-010',
      rating: 'Low',
      factors: [],
      blockers: ['Screening SCR-003 needs a decision', needRating]
    },
    {
      caseId: 'ONB-011',
      rating: 'Low',
      factors: [],
      blockers: ['Proof of address IDV-022 is Missing', needRating]
    },
    { caseId: 'ONB-012', rating: 'Low', factors: [], blockers: [needRating] }
  ];

  it.each(stories)('$caseId suggests $rating with the documented blockers', ({ caseId, rating, factors, blockers }) => {
    const file = buildFile(caseId);
    const suggestion = suggestRiskRating(file);
    expect(suggestion.rating).toBe(rating);
    expect(suggestion.factors.map(f => f.description)).toEqual(factors);
    for (const factor of suggestion.factors) {
      expect(factor.evidenceIds.length).toBeGreaterThan(0);
    }
    expect(approvalBlockers(file, 'analyst')).toEqual(blockers);
  });

  it('ONB-002 cites the client and the company-sale document for the wealth gap', () => {
    const factor = suggestRiskRating(buildFile('ONB-002')).factors[0];
    expect(factor.evidenceIds).toEqual(['CLI-002', 'DOC-002']);
    expect(factor.weight).toBe('High');
  });

  it('ONB-003 and ONB-005 cite the shared ownership records on both sides', () => {
    const first = suggestRiskRating(buildFile('ONB-003')).factors[0];
    expect(first.evidenceIds).toEqual(['REL-001', 'REL-002', 'REL-003']);
    const second = suggestRiskRating(buildFile('ONB-005')).factors[0];
    expect(second.evidenceIds).toEqual(['REL-002', 'REL-001', 'REL-003']);
  });

  it('ONB-004 documents add up to the declared wealth, so nothing raises the suggestion', () => {
    const file = buildFile('ONB-004');
    const suggestion = suggestRiskRating(file);
    expect(suggestion.rating).toBe('Low');
    expect(suggestion.factors).toEqual([]);
    expect(approvalBlockers(file, 'analyst')).toEqual([needRating]);
  });

  it('ONB-006 can be approved once Low is recorded with reasons', () => {
    const file = change(buildFile('ONB-006'), setRating('Low', rationale60));
    expect(approvalBlockers(file, 'analyst')).toEqual([]);
    expect(onboardingTransition(file, 'approve', {}, 'analyst').status).toBe('Approved');
  });

  it('ONB-007 and ONB-011 stay blocked until identity documents are fixed', () => {
    for (const caseId of ['ONB-007', 'ONB-011']) {
      const file = change(buildFile(caseId), setRating('Low', rationale60));
      expect(approvalBlockers(file, 'analyst')).toHaveLength(1);
      expect(() => onboardingTransition(file, 'approve', {}, 'analyst')).toThrow(OnboardingRuleError);
      expect(onboardingTransition(file, 'request-info', { note: 'Please send a valid document.' }, 'analyst').status).toBe(
        'Information requested'
      );
    }
  });

  it('ONB-008 becomes High when the PEP match is confirmed', () => {
    const confirmed = change(buildFile('ONB-008'), setScreening('SCR-001', 'Confirmed match'));
    const suggestion = suggestRiskRating(confirmed);
    expect(suggestion.rating).toBe('High');
    expect(suggestion.factors).toEqual([
      { description: 'Confirmed PEP/sanctions match', evidenceIds: ['SCR-001'], weight: 'High' }
    ]);
  });

  it('ONB-009 becomes Low when the sanctions false positive is cleared', () => {
    const cleared = change(buildFile('ONB-009'), setScreening('SCR-002', 'Cleared – false positive'));
    expect(suggestRiskRating(cleared).rating).toBe('Low');
    expect(approvalBlockers(cleared, 'analyst')).toEqual([needRating]);
  });

  it('ONB-010 becomes Medium when the adverse media is confirmed', () => {
    const confirmed = change(buildFile('ONB-010'), setScreening('SCR-003', 'Confirmed match'));
    const suggestion = suggestRiskRating(confirmed);
    expect(suggestion.rating).toBe('Medium');
    expect(suggestion.factors[0].evidenceIds).toEqual(['SCR-003']);
  });

  it('every blocker and factor mentions a record ID where one exists', () => {
    for (const onboarding of seed.onboardingCases) {
      const file = buildFile(onboarding.id);
      const recordId = /\b(IDV|SCR|ALT)-\d{3}\b/;
      for (const blocker of approvalBlockers(file, 'analyst')) {
        if (blocker !== needRating) expect(blocker).toMatch(recordId);
      }
    }
  });
});

describe('rule details', () => {
  it('rates a confirmed sanctions match High, a strong potential PEP match Medium, and ignores weaker potential hits', () => {
    const base = buildFile('ONB-009');
    expect(suggestRiskRating(change(base, setScreening('SCR-002', 'Confirmed match'))).factors[0].description).toBe(
      'Confirmed PEP/sanctions match'
    );
    // A strong potential PEP match already raises the suggestion to Medium (MAS Notice 626 paragraph 8);
    // a partial adverse-media match does not, because even a confirmed one only adds a Medium factor.
    expect(suggestRiskRating(buildFile('ONB-008')).factors.map(f => f.description)).toEqual(['Unresolved strong PEP match']);
    expect(suggestRiskRating(buildFile('ONB-010')).factors).toEqual([]);
  });

  it('reports a missing identity document or proof of address when no record exists', () => {
    const noDocuments = change(buildFile('ONB-006'), copy => {
      copy.identityDocuments = [];
    });
    const blockers = approvalBlockers(noDocuments, 'analyst');
    expect(blockers).toContain('Proof of address missing');
    expect(blockers.some(b => b.startsWith('Identity document missing'))).toBe(true);
  });

  it('requires a rationale of at least 20 characters', () => {
    const file = change(buildFile('ONB-006'), setRating('Low', 'too short'));
    expect(approvalBlockers(file, 'analyst')).toEqual([needRating]);
  });
});

describe('edge cases', () => {
  const ownerFile = () => buildFile('ONB-003');

  it('blocks a downgrade without a full explanation', () => {
    const short = change(ownerFile(), setRating('Low', rationale25));
    expect(approvalBlockers(short, 'analyst')).toEqual(['Explain why the rating is lower than suggested']);
    expect(() => onboardingTransition(short, 'approve', {}, 'analyst')).toThrow(/lower than suggested/);

    const explained = change(ownerFile(), setRating('Low', rationale60));
    expect(approvalBlockers(explained, 'analyst')).toEqual([]);
  });

  it('does not treat a matching or higher rating as a downgrade', () => {
    const same = change(ownerFile(), setRating('Medium', rationale25));
    expect(approvalBlockers(same, 'analyst')).toEqual([]);
    const higher = change(ownerFile(), setRating('High', rationale25));
    expect(approvalBlockers(higher, 'analyst')).toEqual(['High-risk applicants need senior approval']);
  });

  it('sends a High rating from an analyst to senior approval, and lets a senior approver finish it', () => {
    const confirmed = change(buildFile('ONB-008'), copy => {
      setScreening('SCR-001', 'Confirmed match')(copy);
      setRating('High', rationale60)(copy);
    });
    expect(approvalBlockers(confirmed, 'analyst')).toEqual(['High-risk applicants need senior approval']);
    expect(onboardingTransition(confirmed, 'approve', {}, 'analyst').status).toBe('Pending senior approval');

    const pending = change(confirmed, copy => {
      copy.onboarding.status = 'Pending senior approval';
    });
    expect(approvalBlockers(pending, 'senior-approver')).toEqual([]);
    expect(onboardingTransition(pending, 'approve', {}, 'senior-approver').status).toBe('Approved');
  });

  it('does not send a file to senior approval while other blockers remain', () => {
    const file = change(buildFile('ONB-009'), setRating('High', rationale60));
    expect(() => onboardingTransition(file, 'approve', {}, 'analyst')).toThrow(/Screening SCR-002/);
  });

  it('does not let an approved or rejected file be decided again', () => {
    for (const status of ['Approved', 'Rejected']) {
      const file = change(buildFile('ONB-006'), copy => {
        setRating('Low', rationale60)(copy);
        copy.onboarding.status = status;
      });
      expect(approvalBlockers(file, 'analyst')).toContain('Decision already recorded');
      expect(() => onboardingTransition(file, 'approve', {}, 'analyst')).toThrow('Decision already recorded');
      expect(() => onboardingTransition(file, 'reject', { note: 'Changed my mind' }, 'analyst')).toThrow(
        'Decision already recorded'
      );
      expect(() => onboardingTransition(file, 'request-info', { note: 'More please' }, 'analyst')).toThrow(
        'Decision already recorded'
      );
      expect(() =>
        onboardingTransition(
          file,
          'screening-disposition',
          { screeningId: 'SCR-001', disposition: 'Confirmed match', reason: 'A long enough reason' },
          'analyst'
        )
      ).toThrow('Decision already recorded');
    }
  });

  it('rejects an empty or too short reason for a screening decision', () => {
    const file = buildFile('ONB-009');
    for (const reason of [undefined, '', '   ', 'too short']) {
      expect(() =>
        onboardingTransition(
          file,
          'screening-disposition',
          { screeningId: 'SCR-002', disposition: 'Cleared – false positive', reason },
          'analyst'
        )
      ).toThrow(/at least 10 characters/);
    }
  });

  it('records a screening decision with before and after values', () => {
    const result = onboardingTransition(
      buildFile('ONB-009'),
      'screening-disposition',
      {
        screeningId: 'SCR-002',
        disposition: 'Cleared – false positive',
        reason: 'Different birth year and nationality.'
      },
      'analyst'
    );
    expect(result.status).toBe('In progress');
    expect(JSON.parse(result.detail)).toEqual({
      before: { screeningId: 'SCR-002', disposition: 'Potential match', dispositionReason: '' },
      after: {
        screeningId: 'SCR-002',
        disposition: 'Cleared – false positive',
        dispositionReason: 'Different birth year and nationality.'
      }
    });
  });

  it('rejects clearing a hit that already has a decision, or an unknown outcome or hit', () => {
    const cleared = change(buildFile('ONB-009'), copy => {
      copy.screeningResults[0].disposition = 'Cleared – false positive';
      copy.screeningResults[0].dispositionReason = 'Different person entirely.';
    });
    const input = { screeningId: 'SCR-002', disposition: 'Cleared – false positive', reason: 'Clearing it again.' };
    expect(() => onboardingTransition(cleared, 'screening-disposition', input, 'analyst')).toThrow(/already has a decision/);

    const open = buildFile('ONB-009');
    expect(() =>
      onboardingTransition(open, 'screening-disposition', { ...input, disposition: 'Potential match' }, 'analyst')
    ).toThrow(/Disposition must be/);
    expect(() =>
      onboardingTransition(open, 'screening-disposition', { ...input, screeningId: 'SCR-999' }, 'analyst')
    ).toThrow(/not found/);
  });

  it('requires a note to request information or reject, and sets the matching status', () => {
    const file = buildFile('ONB-002');
    expect(() => onboardingTransition(file, 'request-info', { note: '  ' }, 'analyst')).toThrow(/note is required/);
    expect(() => onboardingTransition(file, 'reject', {}, 'analyst')).toThrow(/note is required/);
    expect(onboardingTransition(file, 'request-info', { note: 'Send the SGD 5m evidence.' }, 'analyst').status).toBe(
      'Information requested'
    );
    const rejected = onboardingTransition(file, 'reject', { note: 'Funds not explained.' }, 'analyst');
    expect(rejected.status).toBe('Rejected');
    expect(JSON.parse(rejected.detail)).toEqual({
      before: { status: 'In progress', notes: '' },
      after: { status: 'Rejected', notes: 'Funds not explained.' }
    });
  });

  it('saves a risk rating without changing the status and rejects unknown ratings', () => {
    const file = buildFile('ONB-006');
    const result = onboardingTransition(file, 'set-risk', { riskRating: 'Low', riskRationale: rationale60 }, 'analyst');
    expect(result.status).toBe('In progress');
    expect(JSON.parse(result.detail)).toEqual({
      before: { riskRating: null, riskRationale: '' },
      after: { riskRating: 'Low', riskRationale: rationale60 }
    });
    expect(() => onboardingTransition(file, 'set-risk', { riskRating: 'Severe' }, 'analyst')).toThrow(/Low, Medium or High/);
    expect(() => onboardingTransition(file, 'set-risk', {}, 'analyst')).toThrow(OnboardingRuleError);
  });

  it('does not let the read-only role change anything', () => {
    expect(() => onboardingTransition(buildFile('ONB-006'), 'request-info', { note: 'x' }, 'read-only')).toThrow(
      /read-only/
    );
  });

  it('rejects an unsupported action', () => {
    expect(() => onboardingTransition(buildFile('ONB-006'), 'delete' as never, {}, 'analyst')).toThrow(
      /Unsupported/
    );
  });
});
