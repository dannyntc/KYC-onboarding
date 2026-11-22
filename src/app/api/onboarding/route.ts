import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isLocalOrigin } from '@/lib/origin';
import { actorName, currentRole } from '@/lib/demo-role';
import { loadOnboardingFile } from '@/lib/onboarding-file';
import {
  onboardingTransition,
  OnboardingRuleError,
  type OnboardingAction,
  type OnboardingFile
} from '@/lib/onboarding-rules';

const MAX_TEXT_LENGTH = 10000;
const CHANGE_ACTIONS: OnboardingAction[] = ['request-info', 'set-risk', 'approve', 'reject', 'screening-disposition'];

// Short audit-log titles. Decisions are titled with the resulting status.
const EVENT_TITLES: Record<string, string> = {
  'set-risk': 'Risk rating saved',
  'screening-disposition': 'Screening decision recorded'
};

function text(form: FormData, name: string): string {
  return String(form.get(name) ?? '').trim();
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (!isLocalOrigin(origin, request.headers.get('host'))) return new Response('Invalid origin', { status: 403 });

  const role = await currentRole();
  if (role === 'read-only') return new Response('Read-only demo role cannot change onboarding files.', { status: 403 });

  const form = await request.formData();
  const id = text(form, 'id');
  const action = text(form, 'action');

  const loaded = await loadOnboardingFile(id);
  if (!loaded) return new Response('Onboarding file not found', { status: 404 });

  if (action === 'analyze') return new Response('KYC drafts arrive in a later stage', { status: 501 });
  if (!CHANGE_ACTIONS.includes(action as OnboardingAction)) return new Response('Unknown action', { status: 400 });

  const version = Number(form.get('version'));
  if (!Number.isInteger(version)) return new Response('A valid file version is required.', { status: 400 });

  const input = {
    note: text(form, 'note'),
    riskRating: text(form, 'riskRating'),
    riskRationale: text(form, 'riskRationale'),
    screeningId: text(form, 'screeningId'),
    disposition: text(form, 'disposition'),
    reason: text(form, 'reason')
  };
  for (const value of [input.note, input.riskRationale, input.reason]) {
    if (value.length > MAX_TEXT_LENGTH) {
      return new Response('Notes, reasons and rationale must be 10,000 characters or fewer.', { status: 400 });
    }
  }

  try {
    await db.$transaction(async tx => {
      const current = await tx.onboardingCase.findUnique({ where: { id } });
      if (!current || current.version !== version) throw new Error('stale');

      // Re-read everything an action or a parallel alert review can change, so the rules see current data.
      // Documents, identity records and ownership cannot be changed from the screens, so the earlier load is used.
      const [screeningResults, alerts] = await Promise.all([
        tx.screeningResult.findMany({ where: { clientId: current.clientId }, orderBy: { id: 'asc' } }),
        tx.alert.findMany({ where: { clientId: current.clientId }, orderBy: { id: 'asc' } })
      ]);
      const file: OnboardingFile = {
        ...loaded.file,
        onboarding: {
          id: current.id,
          status: current.status,
          riskRating: current.riskRating,
          riskRationale: current.riskRationale,
          notes: current.notes
        },
        screeningResults: screeningResults.map(s => ({
          id: s.id,
          list: s.list,
          disposition: s.disposition,
          dispositionReason: s.dispositionReason
        })),
        alerts: alerts.map(a => ({ id: a.id, status: a.status }))
      };

      const change = onboardingTransition(file, action as OnboardingAction, input, role);

      const caseData: { status: string; notes?: string; riskRating?: string; riskRationale?: string } = {
        status: change.status
      };
      if (action === 'request-info' || action === 'reject') caseData.notes = input.note;
      if (action === 'approve' && input.note) caseData.notes = input.note;
      if (action === 'set-risk') {
        caseData.riskRating = input.riskRating;
        caseData.riskRationale = input.riskRationale;
      }
      const changed = await tx.onboardingCase.updateMany({
        where: { id, version },
        data: { ...caseData, version: { increment: 1 } }
      });
      if (changed.count !== 1) throw new Error('stale');

      if (action === 'screening-disposition') {
        const screening = await tx.screeningResult.updateMany({
          where: { id: input.screeningId, clientId: current.clientId, disposition: 'Potential match' },
          data: { disposition: input.disposition, dispositionReason: input.reason }
        });
        if (screening.count !== 1) throw new Error('stale');
      }

      await tx.onboardingEvent.create({
        data: {
          onboardingCaseId: id,
          actor: actorName(role),
          action: EVENT_TITLES[action] ?? change.status,
          detail: change.detail
        }
      });
    });
  } catch (error) {
    if (error instanceof OnboardingRuleError) return new Response(error.message, { status: 422 });
    if (error instanceof Error && error.message === 'stale') {
      return new Response('This file changed. Reload and try again.', { status: 409 });
    }
    return new Response('Could not save the change. Please retry.', { status: 500 });
  }

  return NextResponse.redirect(new URL(`/onboarding/${id}`, origin!), 303);
}
