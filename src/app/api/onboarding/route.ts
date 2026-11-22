import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isLocalOrigin } from '@/lib/origin';
import { actorName, currentRole } from '@/lib/demo-role';
import { acquireAnalysisLock, releaseAnalysisLock } from '@/lib/analysis-lock';
import { loadControlReviews, reviewedControlsForChecks } from '@/lib/control-review';
import {
  AnalysisValidationError,
  modelInput,
  ONBOARDING_ANALYSIS,
  ONBOARDING_PROMPT_VERSION,
  runLiveAnalysis
} from '@/lib/live-analysis';
import { evidenceIdsFor, loadOnboardingFile, type LoadedOnboardingFile } from '@/lib/onboarding-file';
import {
  ONBOARDING_FIXTURE_VERSION,
  onboardingFixture,
  validateOnboardingAnalysis,
  type OnboardingAnalysis
} from '@/lib/onboarding-analysis';
import {
  onboardingCheckKeys,
  onboardingTransition,
  OnboardingRuleError,
  type DemoRole,
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

// Generates a KYC draft: a template by default, or a live model answer when OPENAI_API_KEY is set.
// A failed live attempt is recorded and reported; it is never replaced by the template.
async function generateDraft(loaded: LoadedOnboardingFile, role: DemoRole, origin: string) {
  const id = loaded.row.id;
  const lease = await acquireAnalysisLock(id);
  if (!lease) return new Response('A KYC draft is already being generated for this file. Wait and try again.', { status: 409 });
  try {
    const live = Boolean(process.env.OPENAI_API_KEY);
    const model = process.env.OPENAI_MODEL;
    if (live && !model) return new Response('Set OPENAI_MODEL to use live analysis.', { status: 503 });

    const { file, row, related } = loaded;
    const evidenceIds = evidenceIdsFor(loaded);
    const context = {
      onboarding: {
        id: row.id,
        applicationDate: row.applicationDate,
        purpose: row.purpose,
        status: row.status,
        riskRating: row.riskRating,
        riskRationale: row.riskRationale
      },
      client: row.client,
      relatedRelationships: related
    };
    // Only references with a current recorded review, for the checks that apply to this file, go to a live model.
    const { reviews } = await loadControlReviews();
    const controls = live
      ? reviewedControlsForChecks(reviews, onboardingCheckKeys(file), new Date().toISOString().slice(0, 10))
      : [];
    const attestedReviews = reviews.filter(review => controls.some(control => control.id === review.id));
    const savedInput = modelInput(context, evidenceIds, controls);
    const inputSnapshot = JSON.stringify(
      live
        ? { ...savedInput, recorded_control_reviews: attestedReviews }
        : { ...savedInput, fixture: ONBOARDING_FIXTURE_VERSION }
    );

    const mode = live ? 'live' : 'fixture';
    const modelName = live ? model! : 'fixture';
    const promptVersion = live ? ONBOARDING_PROMPT_VERSION : ONBOARDING_FIXTURE_VERSION;
    const label = live ? 'Live' : 'Fixture';
    const actor = actorName(role);

    async function saveAttempt(validation: string, output: string, rawResponse: string | null, extra = '') {
      await db.$transaction(async tx => {
        const attempt = await tx.onboardingAnalysis.create({
          data: { onboardingCaseId: id, mode, model: modelName, promptVersion, validation, output, rawResponse, inputSnapshot }
        });
        const passed = validation === 'passed';
        const detail = passed && !live
          ? `Attempt ID: ${attempt.id}; Synthetic fixture; no model was called. Version: ${ONBOARDING_FIXTURE_VERSION}; validation: passed.`
          : `Attempt ID: ${attempt.id}; Model: ${modelName}; prompt: ${promptVersion}; validation: ${validation}${extra}`;
        await tx.onboardingEvent.create({
          data: {
            onboardingCaseId: id,
            actor,
            action: passed ? `${label} KYC draft generated` : `${label} KYC draft failed`,
            detail
          }
        });
      });
    }

    let draft: OnboardingAnalysis;
    let rawResponse: string | null = null;
    try {
      if (live) {
        const result = await runLiveAnalysis(
          { caseId: id, model: model!, evidenceIds, context, controls },
          undefined,
          ONBOARDING_ANALYSIS
        );
        draft = result.draft;
        rawResponse = result.rawResponse;
      } else {
        draft = onboardingFixture(file);
      }
    } catch (error) {
      const rejected = error instanceof AnalysisValidationError;
      const validation = rejected ? 'rejected' : live ? 'provider_error' : 'fixture_error';
      await saveAttempt(validation, rejected ? (JSON.stringify(error.output) ?? '') : '', rejected ? error.rawResponse : null);
      return new Response('KYC draft failed or contained invalid citations. Previous drafts are preserved; try again.', { status: 502 });
    }

    const checked = validateOnboardingAnalysis(draft, evidenceIds, controls.map(control => control.id));
    if (!checked.success) {
      await saveAttempt('rejected', JSON.stringify(draft) ?? '', rawResponse, `; ${checked.error}`);
      return new Response(checked.error, { status: 422 });
    }
    await saveAttempt('passed', JSON.stringify(checked.data), rawResponse);
    return NextResponse.redirect(new URL(`/onboarding/${id}`, origin), 303);
  } finally {
    await releaseAnalysisLock(id, lease);
  }
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

  if (action === 'analyze') return generateDraft(loaded, role, origin!);
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
