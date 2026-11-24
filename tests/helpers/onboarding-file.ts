import { createSeed } from '../../src/lib/seed-data';
import type { OnboardingFile } from '../../src/lib/onboarding-rules';

export const seed = createSeed();

// Builds the plain rules input for one onboarding case the way the Stage 3 loader will.
export function buildFile(caseId: string): OnboardingFile {
  const onboarding = seed.onboardingCases.find(c => c.id === caseId)!;
  const client = seed.clients.find(c => c.id === onboarding.clientId)!;
  const relationships = seed.relationships.filter(r => r.clientId === client.id);
  const relatedRelationships = seed.relationships.filter(
    other =>
      other.clientId !== client.id &&
      relationships.some(own => own.owner === other.owner && own.entity === other.entity)
  );
  return {
    client: { id: client.id, name: client.name, declaredWealth: client.declaredWealth },
    onboarding: {
      id: onboarding.id,
      status: onboarding.status,
      riskRating: onboarding.riskRating,
      riskRationale: onboarding.riskRationale,
      notes: onboarding.notes
    },
    identityDocuments: seed.identityDocuments
      .filter(d => d.clientId === client.id)
      .map(d => ({ id: d.id, kind: d.kind, status: d.status })),
    screeningResults: seed.screeningResults
      .filter(s => s.clientId === client.id)
      .map(s => ({ id: s.id, list: s.list, matchStrength: s.matchStrength, disposition: s.disposition, dispositionReason: s.dispositionReason })),
    documents: seed.documents
      .filter(d => d.clientId === client.id)
      .map(d => ({ id: d.id, kind: d.kind, corroboratedAmount: d.corroboratedAmount })),
    relationships,
    relatedRelationships
  };
}

