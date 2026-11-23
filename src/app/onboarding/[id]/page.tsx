import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CaseForm } from '@/components/case-form';
import { EvidenceLink } from '@/components/evidence-link';
import { LookOnlyCaption } from '@/components/look-only-banner';
import { OnboardingNote } from '@/components/onboarding-note';
import { SwipeTable } from '@/components/swipe-table';
import { currentRole } from '@/lib/demo-role';
import { db } from '@/lib/db';
import { loadOnboardingFile } from '@/lib/onboarding-file';
import { onboardingAnalysisSchema, onboardingFixture } from '@/lib/onboarding-analysis';
import { isPublicDemo } from '@/lib/public-demo';
import { referencesForScenario } from '@/lib/regulatory-references';
import {
  approvalBlockers,
  SENIOR_APPROVAL_BLOCKER,
  SOURCE_OF_WEALTH_KINDS,
  suggestRiskRating
} from '@/lib/onboarding-rules';

export const dynamic = 'force-dynamic';

const money = (cents: number) =>
  new Intl.NumberFormat('en-SG', { style: 'currency', currency: 'SGD', maximumFractionDigits: 2 }).format(cents / 100);
const transactionAmount = (cents: number, currency: string) =>
  `${currency.trim() || 'Currency unavailable'} ${new Intl.NumberFormat('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cents / 100)}`;

const riskClass = (rating: string) => rating.toLowerCase();
const identityClass = (status: string) => (status === 'Verified' ? 'low' : 'high');
const screeningClass = (disposition: string) =>
  disposition === 'Confirmed match' ? 'high' : disposition === 'Potential match' ? 'medium' : 'low';
const attemptLabel = (validation: string) =>
  validation === 'passed'
    ? 'Passed'
    : validation === 'rejected'
      ? 'Rejected'
      : validation === 'provider_error'
        ? 'Provider error'
        : validation;
const statusClass = (status: string) => (status === 'Approved' ? 'low' : status === 'Rejected' ? 'high' : 'medium');

export default async function OnboardingFilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const loaded = await loadOnboardingFile(id);
  if (!loaded) notFound();
  const { file, row, related } = loaded;
  const client = row.client;
  const role = await currentRole();
  const lookOnly = await isPublicDemo();

  const live = Boolean(process.env.OPENAI_API_KEY);
  const latest = await db.onboardingAnalysis.findFirst({
    where: { onboardingCaseId: id, validation: 'passed' },
    orderBy: { id: 'desc' }
  });
  let draft = null;
  if (latest) {
    try {
      const parsed = onboardingAnalysisSchema.safeParse(JSON.parse(latest.output));
      if (parsed.success) draft = parsed.data;
    } catch {
      draft = null;
    }
  }

  // Online (look-only) there is no Generate button, so show the template draft computed on the fly.
  // It is never saved: onboardingFixture only reads the file it is given.
  const preview = lookOnly && !draft ? onboardingFixture(file) : null;
  const shown = draft ?? preview;

  const suggestion = suggestRiskRating(file);
  const blockers = approvalBlockers(file, role);
  const decided = row.status === 'Approved' || row.status === 'Rejected';
  const canEdit = role !== 'read-only' && !decided;
  const onlySeniorBlocker = blockers.length === 1 && blockers[0] === SENIOR_APPROVAL_BLOCKER;
  const pendingSenior = row.status === 'Pending senior approval';
  const approveDisabled = (blockers.length > 0 && !onlySeniorBlocker) || (pendingSenior && role !== 'senior-approver');
  const approveLabel = pendingSenior && role === 'senior-approver' ? 'Give senior approval' : 'Approve';

  const wealthDocuments = client.documents.filter(d => SOURCE_OF_WEALTH_KINDS.includes(d.kind));
  const corroborated = wealthDocuments.reduce((sum, d) => sum + d.corroboratedAmount, 0);
  const wealthGap = client.declaredWealth - corroborated;

  return (
    <>
      <Link href="/" className="back">
        ‹ &nbsp; Onboarding queue
      </Link>
      <div className="heading">
        <div>
          <p className="eyebrow">KYC FILE · {row.id}</p>
          <h1>{client.name}</h1>
          <p>{row.purpose}</p>
        </div>
        <div>
          <span className={`badge ${statusClass(row.status)}`} data-testid="onboarding-status">
            {row.status}
          </span>
        </div>
      </div>

      <div className="casegrid">
        <div className="stack">
          <section className="panel section">
            <h2>Applicant overview</h2>
            <div className="meta">
              <div id={client.id}>
                <span>CLIENT ID</span>
                <strong>{client.id}</strong>
              </div>
              <div>
                <span>ACCOUNT</span>
                <strong>
                  {client.accounts.length
                    ? client.accounts.map(account => (
                        <span id={account.id} key={account.id}>
                          {account.id}
                        </span>
                      ))
                    : 'Unavailable'}
                </strong>
              </div>
              <div>
                <span>APPLICATION DATE</span>
                <strong>{row.applicationDate}</strong>
              </div>
              <div>
                <span>DECLARED WEALTH</span>
                <strong>{money(client.declaredWealth)}</strong>
              </div>
              <div>
                <span>EXPECTED MONTHLY ACTIVITY</span>
                <strong>
                  {money(client.expectedMonthlyMin)} – {money(client.expectedMonthlyMax)}
                </strong>
              </div>
              <div>
                <span>FILE STATUS</span>
                <strong>{row.status}</strong>
              </div>
            </div>
            <p className="muted">{client.profile}</p>
          </section>

          <section className="panel section" data-tour="identity">
            <h2>Identity &amp; documents</h2>
            {client.identityDocuments.length === 0 && <p className="muted">No identity documents recorded.</p>}
            {client.identityDocuments.map(d => (
              <div id={d.id} key={d.id}>
                <strong>
                  {d.title} · {d.id}
                </strong>{' '}
                <span className={`badge ${identityClass(d.status)}`}>{d.status}</span>
                {d.expiresOn && <span className="muted"> · expires {d.expiresOn}</span>}
                <p className="muted">{d.summary}</p>
              </div>
            ))}
            <ReferenceList keys={['identity_verification']} />
          </section>

          <section className="panel section">
            <h2>Beneficial ownership</h2>
            {client.relationships.length === 0 && <p className="muted">No ownership relationships recorded.</p>}
            {client.relationships.map(r => (
              <p id={r.id} key={r.id}>
                <strong>{r.id}</strong> · {r.owner} · {r.entity}
                <br />
                <span className="muted">{r.description}</span>
              </p>
            ))}
            {related.map(r => (
              <p id={r.id} key={r.id}>
                <strong>{r.id}</strong> · {r.owner} · {r.entity}
                <br />
                <span className="muted">Related client: </span>
                {r.onboardingId ? (
                  <Link className="caseid" href={`/onboarding/${r.onboardingId}`}>
                    {r.client.name} ({r.onboardingId})
                  </Link>
                ) : (
                  r.client.name
                )}
                <br />
                <span className="muted">
                  Account:{' '}
                  {r.client.accounts.length
                    ? r.client.accounts.map(account => (
                        <span id={account.id} key={account.id}>
                          {account.id}
                        </span>
                      ))
                    : 'Unavailable'}
                </span>
                <br />
                <span className="muted">{r.description}</span>
              </p>
            ))}
            <ReferenceList keys={['beneficial_ownership']} />
          </section>

          <section className="panel section" data-tour="screening">
            <h2>Screening</h2>
            {client.screeningResults.length === 0 && <p className="muted">No screening hits recorded.</p>}
            {client.screeningResults.map(result => (
              <div id={result.id} key={result.id}>
                <strong>
                  {result.list} · {result.matchedName} · {result.id}
                </strong>{' '}
                <span className="badge medium">{result.matchStrength} match</span>{' '}
                <span className={`badge ${screeningClass(result.disposition)}`}>{result.disposition}</span>
                <p className="muted">{result.summary}</p>
                {result.dispositionReason && <p>Analyst reason: {result.dispositionReason}</p>}
                {canEdit && result.disposition === 'Potential match' && (
                  <CaseForm action="/api/onboarding" className="formstack">
                    <input type="hidden" name="id" value={row.id} />
                    <input type="hidden" name="version" value={row.version} />
                    <input type="hidden" name="action" value="screening-disposition" />
                    <input type="hidden" name="screeningId" value={result.id} />
                    <label htmlFor={`reason-${result.id}`} className="label">
                      REASON FOR DECISION
                    </label>
                    <textarea className="field" id={`reason-${result.id}`} name="reason" />
                    <button className="button secondary" name="disposition" value="Cleared – false positive" disabled={lookOnly}>
                      Clear as false positive
                    </button>
                    <button className="button secondary" name="disposition" value="Confirmed match" disabled={lookOnly}>
                      Confirm match
                    </button>
                    {lookOnly && <LookOnlyCaption />}
                  </CaseForm>
                )}
              </div>
            ))}
            <ReferenceList keys={['screening', 'pep']} />
          </section>

          <section className="panel section" data-tour="source-of-wealth">
            <h2>Source of wealth &amp; funds</h2>
            <p>
              Declared wealth: <strong>{money(client.declaredWealth)}</strong>.
            </p>
            {client.documents.map(d => (
              <div id={d.id} key={d.id}>
                <strong>
                  {d.title} · {d.id}
                </strong>
                <p className="muted">
                  {d.summary} Corroborated amount: {money(d.corroboratedAmount)}
                  {SOURCE_OF_WEALTH_KINDS.includes(d.kind) ? '.' : ' (not counted towards source of wealth).'}
                </p>
              </div>
            ))}
            <p>
              Corroborated total: <strong>{money(corroborated)}</strong>
              {wealthGap > 0 ? (
                <>
                  {' '}
                  · Not corroborated: <strong>{money(wealthGap)}</strong>
                </>
              ) : (
                ' · Declared wealth is fully corroborated.'
              )}
            </p>
            <ReferenceList keys={['source_of_wealth']} />
          </section>

          <section className="panel section" data-tour="aml-funding">
            <h2>Initial funding &amp; activity since application (AML)</h2>
            <p className="muted">Funding alerts raised on this applicant&apos;s first activity. Each opens the alert investigation page.</p>
            {client.alerts.length === 0 ? (
              <p className="muted">No funding alerts raised</p>
            ) : (
              <SwipeTable>
                <table>
                  <thead>
                    <tr>
                      <th>ALERT</th>
                      <th>TITLE</th>
                      <th>PRIORITY</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {client.alerts.map(alert => (
                      <tr key={alert.id} id={alert.id}>
                        <td>
                          <Link className="caseid" href={`/cases/${alert.id}`}>
                            {alert.id}
                          </Link>
                        </td>
                        <td>{alert.title}</td>
                        <td>
                          <span className={`badge ${alert.priority.toLowerCase()}`}>{alert.priority}</span>
                        </td>
                        <td>{alert.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </SwipeTable>
            )}
            <h3>Account activity</h3>
            <p className="muted">Amounts use the recorded currency · negative values are outgoing</p>
            <SwipeTable>
              <table>
                <thead>
                  <tr>
                    <th>REFERENCE</th>
                    <th>DATE</th>
                    <th>COUNTERPARTY</th>
                    <th>AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  {client.transactions.map(t => (
                    <tr key={t.id} id={t.id}>
                      <td>
                        <strong>{t.id}</strong>
                        {client.alerts.some(alert => alert.triggerTransactionId === t.id) && <small>Alert trigger</small>}
                      </td>
                      <td>{t.date}</td>
                      <td>{t.counterparty}</td>
                      <td>{transactionAmount(t.amount, t.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </SwipeTable>
            <p className="notice">All documents, screening results and relationships are fictional.</p>
          </section>
        </div>

        <div className="stack">
          <section className="panel section">
            <h2>Risk assessment</h2>
            <p>
              Suggested rating:{' '}
              <span className={`badge ${riskClass(suggestion.rating)}`} data-testid="suggested-risk">
                {suggestion.rating}
              </span>
            </p>
            {suggestion.factors.length === 0 ? (
              <p className="muted">No risk factors identified from the current records.</p>
            ) : (
              <ul>
                {suggestion.factors.map(factor => (
                  <li key={factor.description}>
                    {factor.description} ({factor.weight}){' '}
                    {factor.evidenceIds.map(evidenceId => (
                      <span key={evidenceId}>
                        <EvidenceLink id={evidenceId} />{' '}
                      </span>
                    ))}
                  </li>
                ))}
              </ul>
            )}
            <p>
              Final rating recorded by the analyst:{' '}
              <strong data-testid="final-risk">{row.riskRating ?? 'Not set'}</strong>
            </p>
            {canEdit && (
              <CaseForm action="/api/onboarding" className="formstack">
                <input type="hidden" name="id" value={row.id} />
                <input type="hidden" name="version" value={row.version} />
                <input type="hidden" name="action" value="set-risk" />
                <label htmlFor="risk-rating" className="label">
                  FINAL RISK RATING
                </label>
                <select className="field" id="risk-rating" name="riskRating" defaultValue={row.riskRating ?? ''}>
                  <option value="">Select a rating</option>
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
                <label htmlFor="risk-rationale" className="label">
                  REASONS FOR RATING
                </label>
                <textarea className="field" id="risk-rationale" name="riskRationale" defaultValue={row.riskRationale} />
                <button className="button" disabled={lookOnly}>
                  Save risk rating
                </button>
                {lookOnly && <LookOnlyCaption />}
              </CaseForm>
            )}
            <ReferenceList keys={['risk_assessment']} />
          </section>

          <section className="panel section" data-tour="assistant">
            <div className="panelhead" style={{ padding: 0, marginBottom: 16 }}>
              <div>
                <h2>KYC assistant</h2>
                <p>Evidence-grounded draft for analyst review</p>
              </div>
              <span className="badge low">{live ? 'LIVE MODE' : 'FIXTURE MODE'}</span>
            </div>
            <p className="notice">
              {live
                ? 'Live mode sends this fictional file to OpenAI for analysis. Review every finding.'
                : 'Fixture mode uses prewritten demonstration text built from the checks on this page. No live AI analysis is represented here.'}
            </p>
            {role !== 'read-only' && (
              <CaseForm action="/api/onboarding">
                <input type="hidden" name="id" value={row.id} />
                <button className="button" name="action" value="analyze" disabled={lookOnly}>
                  {live ? 'Generate live KYC draft' : 'Generate fixture KYC draft'}
                </button>
                {lookOnly && <LookOnlyCaption />}
              </CaseForm>
            )}
            {shown && (
              <div className="draft">
                <p className="notice">
                  {!latest
                    ? 'Preview of the template draft (not saved). Nothing is stored; it is built from the checks on this page.'
                    : latest.mode === 'fixture'
                      ? 'Displayed draft: fixture (no model called)'
                      : latest.mode === 'live'
                        ? 'Displayed draft: live model response'
                        : 'Displayed draft: origin unknown'}
                </p>
                <h3>Applicant summary</h3>
                <p>{shown.applicant_summary}</p>
                <FindingList title="Verified facts" findings={shown.verified_facts} />
                <FindingList title="Risk factors" findings={shown.risk_factors} />
                <FindingList title="Mitigating factors" findings={shown.mitigating_factors} />
                {shown.outstanding_items.length > 0 && (
                  <>
                    <h3>Outstanding items</h3>
                    <ul>
                      {shown.outstanding_items.map(item => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </>
                )}
                <h3>Suggestions for the analyst</h3>
                <p>
                  Suggested risk rating: <strong>{shown.suggested_risk_rating}</strong>
                  <br />
                  Suggested next step: <strong>{shown.suggested_next_step.replaceAll('_', ' ')}</strong>
                </p>
                <p className="muted">
                  These are suggestions only. The analyst records the final rating and makes every decision.
                </p>
                <h3>Draft note</h3>
                <p id="draft-note" style={{ whiteSpace: 'pre-line' }}>
                  {shown.draft_note}
                </p>
                <h3>Limitations</h3>
                <ul>
                  {shown.limitations.map(item => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                {latest && (
                  <>
                    <details>
                      <summary>View evidence used for this draft</summary>
                      {latest.inputSnapshot ? (
                        <>
                          <p className="muted">Saved at generation time. Amounts are in cents; current records may have changed.</p>
                          <pre className="audit-detail">{JSON.stringify(JSON.parse(latest.inputSnapshot), null, 2)}</pre>
                        </>
                      ) : (
                        <p className="muted">Evidence snapshots were not recorded for this draft.</p>
                      )}
                    </details>
                    <p className="muted">
                      Generated {latest.createdAt.toISOString()} · {latest.mode} · {latest.model} · prompt {latest.promptVersion}
                    </p>
                  </>
                )}
              </div>
            )}
          </section>

          <section className="panel section" data-tour="decision-panel">
            <h2>Decision</h2>
            {decided ? (
              <p className="notice">Decision recorded: {row.status}. This file can no longer be changed.</p>
            ) : blockers.length === 0 ? (
              <p className="notice">Ready for decision</p>
            ) : (
              <div className="form-error">
                <strong>Outstanding before approval</strong>
                <ul data-testid="blockers">
                  {blockers.map(blocker => (
                    <li key={blocker}>{blocker}</li>
                  ))}
                </ul>
                {onlySeniorBlocker && role !== 'senior-approver' && (
                  <p>Approving will send this file to a senior approver.</p>
                )}
              </div>
            )}
            {role === 'read-only' && <p className="muted">The read-only role cannot change onboarding files.</p>}
            {canEdit && (
              <CaseForm action="/api/onboarding" className="formstack">
                <input type="hidden" name="id" value={row.id} />
                <OnboardingNote initialNote={row.notes} initialVersion={row.version} draft={shown?.draft_note} disabled={lookOnly} />
                <button className="button" name="action" value="approve" disabled={approveDisabled || lookOnly}>
                  {approveLabel}
                </button>
                <button className="button secondary" name="action" value="reject" disabled={lookOnly}>
                  Reject
                </button>
                <button className="button secondary" name="action" value="request-info" disabled={lookOnly}>
                  Request information
                </button>
                {lookOnly && <LookOnlyCaption />}
              </CaseForm>
            )}
          </section>

          <section className="panel section">
            <h2>Draft history</h2>
            {row.analyses.length === 0 ? (
              <p className="muted">No KYC drafts yet.</p>
            ) : (
              <ul className="events">
                {row.analyses.map(item => (
                  <li key={item.id}>
                    <strong>{attemptLabel(item.validation)}</strong> · {item.mode} · {item.model} · prompt {item.promptVersion}
                    <time>{item.createdAt.toISOString()}</time>
                    <Link className="caseid" href={`/onboarding/${row.id}/analyses/${item.id}`}>
                      View attempt {item.id}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="panel section">
            <h2>Audit history</h2>
            {row.events.length === 0 ? (
              <p className="muted">No review activity recorded yet.</p>
            ) : (
              <ul className="events">
                {row.events.map(e => (
                  <li key={e.id}>
                    <strong>{e.action}</strong> · {e.actor}
                    <time>{e.createdAt.toISOString()}</time>
                    <details>
                      <summary>View recorded details</summary>
                      <pre className="audit-detail">{e.detail}</pre>
                    </details>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

function FindingList({ title, findings }: { title: string; findings: { description: string; evidence_ids: string[] }[] }) {
  if (findings.length === 0) return null;
  return (
    <>
      <h3>{title}</h3>
      {findings.map((finding, index) => (
        <p key={index}>
          {finding.description}{' '}
          {finding.evidence_ids.map(evidenceId => (
            <span key={evidenceId}>
              <EvidenceLink id={evidenceId} />{' '}
            </span>
          ))}
        </p>
      ))}
    </>
  );
}

// Candidate MAS Notice 626 references for a check. They are suggestions for a human, not conclusions.
function ReferenceList({ keys }: { keys: string[] }) {
  const references = [...new Map(keys.flatMap(key => referencesForScenario(key)).map(r => [r.id, r])).values()];
  if (references.length === 0) return null;
  return (
    <div>
      <p className="label">CANDIDATE REGULATORY REFERENCES</p>
      {references.map(reference => (
        <p key={reference.id}>
          <Link className="caseid" href={`/controls#${reference.id}`}>
            {reference.id}
          </Link>{' '}
          · {reference.title}
        </p>
      ))}
    </div>
  );
}
