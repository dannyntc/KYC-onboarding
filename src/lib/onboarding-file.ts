import { db } from './db';
import { relatedRelationships } from './related-relationships';
import type { OnboardingFile } from './onboarding-rules';

// Loads one onboarding file: the plain input for the rules (`file`) plus everything the page shows.
export async function loadOnboardingFile(id: string) {
  const row = await db.onboardingCase.findUnique({
    where: { id },
    include: {
      client: {
        include: {
          accounts: { orderBy: { id: 'asc' } },
          transactions: { orderBy: [{ date: 'desc' }, { id: 'asc' }] },
          documents: { orderBy: { id: 'asc' } },
          relationships: { orderBy: { id: 'asc' } },
          identityDocuments: { orderBy: { id: 'asc' } },
          screeningResults: { orderBy: { id: 'asc' } },
          alerts: { orderBy: { id: 'asc' } }
        }
      },
      events: { orderBy: { id: 'desc' } },
      analyses: {
        select: { id: true, createdAt: true, mode: true, model: true, promptVersion: true, validation: true },
        orderBy: { id: 'desc' }
      }
    }
  });
  if (!row) return null;

  const client = row.client;
  const related = await relatedRelationships(client.id, client.relationships);
  const relatedClientIds = [...new Set(related.map(r => r.client.id))];
  const relatedCases = relatedClientIds.length
    ? await db.onboardingCase.findMany({
        where: { clientId: { in: relatedClientIds } },
        select: { id: true, clientId: true }
      })
    : [];
  const relatedWithFile = related.map(r => ({
    ...r,
    onboardingId: relatedCases.find(c => c.clientId === r.client.id)?.id ?? null
  }));

  const file: OnboardingFile = {
    client: { id: client.id, name: client.name, declaredWealth: client.declaredWealth },
    onboarding: {
      id: row.id,
      status: row.status,
      riskRating: row.riskRating,
      riskRationale: row.riskRationale,
      notes: row.notes
    },
    identityDocuments: client.identityDocuments.map(d => ({ id: d.id, kind: d.kind, status: d.status })),
    screeningResults: client.screeningResults.map(s => ({
      id: s.id,
      list: s.list,
      disposition: s.disposition,
      dispositionReason: s.dispositionReason
    })),
    documents: client.documents.map(d => ({ id: d.id, kind: d.kind, corroboratedAmount: d.corroboratedAmount })),
    relationships: client.relationships.map(r => ({
      id: r.id,
      clientId: r.clientId,
      owner: r.owner,
      entity: r.entity
    })),
    relatedRelationships: related.map(r => ({
      id: r.id,
      clientId: r.clientId,
      owner: r.owner,
      entity: r.entity
    })),
    alerts: client.alerts.map(a => ({ id: a.id, status: a.status }))
  };

  return { file, row, related: relatedWithFile };
}

export type LoadedOnboardingFile = NonNullable<Awaited<ReturnType<typeof loadOnboardingFile>>>;

// Every record ID on the page that a citation may point to.
export function evidenceIdsFor(loaded: LoadedOnboardingFile): string[] {
  const { row, related } = loaded;
  const client = row.client;
  return [
    client.id,
    ...client.accounts.map(a => a.id),
    ...client.identityDocuments.map(d => d.id),
    ...client.screeningResults.map(s => s.id),
    ...client.documents.map(d => d.id),
    ...client.relationships.map(r => r.id),
    ...related.flatMap(r => [r.id, ...r.client.accounts.map(a => a.id)]),
    ...client.alerts.map(a => a.id),
    ...client.transactions.map(t => t.id)
  ];
}
