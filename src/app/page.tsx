import Link from 'next/link';
import { db } from '@/lib/db';
import { loadOnboardingFile } from '@/lib/onboarding-file';
import { approvalBlockers, suggestRiskRating } from '@/lib/onboarding-rules';

export const dynamic = 'force-dynamic';

// The onboarding gaps this workspace addresses, shown at the top of the queue (and pointed at by the tour).
const GAPS: [gap: string, help: string][] = [
  ['Evidence scattered across systems and emails', 'One KYC file per applicant, with every finding linked to its record'],
  ['Risk judged differently by each analyst', 'The same rules suggest a rating for everyone, with the reasons shown; a person decides'],
  ['Checks missed until late', 'Approval stays locked until every check is done; high-risk files need a second approver'],
  ['Hidden relationships between clients', 'Shared owners are flagged and linked'],
  ['Hours spent writing up each file', 'The KYC memo builder drafts the summary, and every statement links to the record it came from, so the analyst checks rather than writes'],
  ['No clear record of who decided what, and why', 'Every rating, screening decision and approval is logged with the person, time and reason, and the log cannot be edited']
];

const STATUSES = ['In progress', 'Information requested', 'Pending senior approval', 'Approved', 'Rejected'];

export default async function OnboardingQueue({
  searchParams
}: {
  searchParams: Promise<{ q?: string; risk?: string; status?: string }>;
}) {
  const { q = '', risk = '', status = '' } = await searchParams;

  const cases = await db.onboardingCase.findMany({ select: { id: true }, orderBy: { id: 'asc' } });
  const loaded = await Promise.all(cases.map(c => loadOnboardingFile(c.id)));
  const rows = loaded.flatMap(item => {
    if (!item) return [];
    return [
      {
        id: item.row.id,
        clientId: item.row.client.id,
        clientName: item.row.client.name,
        applicationDate: item.row.applicationDate,
        status: item.row.status,
        suggestedRisk: suggestRiskRating(item.file).rating,
        outstanding: approvalBlockers(item.file, 'analyst').length
      }
    ];
  });

  const search = q.toLowerCase();
  const filtered = rows.filter(
    row =>
      (!search || `${row.id} ${row.clientName} ${row.clientId}`.toLowerCase().includes(search)) &&
      (!risk || row.suggestedRisk === risk) &&
      (!status || row.status === status)
  );
  const count = (...wanted: string[]) => rows.filter(row => wanted.includes(row.status)).length;

  return (
    <>
      <div className="heading">
        <div>
          <p className="eyebrow">CLIENT ONBOARDING</p>
          <h1>Onboarding queue</h1>
          <p>Check each new applicant before the bank accepts them, then record a human decision.</p>
        </div>
        <div className="asof">
          DEMO DATASET
          <br />
          <strong>{rows.length} fictitious applicants</strong>
        </div>
      </div>

      <section className="panel problem" data-tour="problem">
        <p className="eyebrow">THE PROBLEM THIS SOLVES</p>
        <p>
          Onboarding a new client by hand is slow and error-prone. This workspace closes six gaps. The checks follow MAS Notice 626.
        </p>
        <ul>
          {GAPS.map(([gap, help]) => (
            <li key={gap}>
              <strong>{gap}</strong>
              <span>{help}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="metrics" data-tour="queue-metrics">
        <div>
          <span>APPLICATIONS IN PROGRESS</span>
          <strong>{count('In progress')}</strong>
          <small>Checks still being completed</small>
        </div>
        <div>
          <span>PENDING SENIOR APPROVAL</span>
          <strong>{count('Pending senior approval')}</strong>
          <small>High-risk, waiting for a second approver</small>
        </div>
        <div>
          <span>INFORMATION REQUESTED</span>
          <strong>{count('Information requested')}</strong>
          <small>Waiting for the applicant</small>
        </div>
        <div>
          <span>DECIDED</span>
          <strong>{count('Approved', 'Rejected')}</strong>
          <small>Approved or rejected by a person</small>
        </div>
      </div>

      <section className="panel">
        <div className="panelhead">
          <div>
            <h2>Applications</h2>
            <p>
              {filtered.length} of {rows.length} files shown
            </p>
          </div>
        </div>
        <form className="filters" data-tour="queue-filters">
          <input name="q" defaultValue={q} placeholder="Search applicant, file, or client ID" aria-label="Search applications" />
          <select name="risk" defaultValue={risk} aria-label="Suggested risk">
            <option value="">All suggested risk</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
          <select name="status" defaultValue={status} aria-label="Status">
            <option value="">All statuses</option>
            {STATUSES.map(name => (
              <option key={name}>{name}</option>
            ))}
          </select>
          <button>Apply filters</button>
        </form>
        <div className="tablewrap" data-tour="queue-table">
          <table className="cards">
            <thead>
              <tr>
                <th>FILE</th>
                <th>APPLICANT</th>
                <th>APPLICATION DATE</th>
                <th>SUGGESTED RISK</th>
                <th data-tour="outstanding-column">OUTSTANDING ITEMS</th>
                <th>STATUS</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, index) => (
                <tr key={row.id}>
                  <td data-label="File">
                    <Link className="caseid" href={`/onboarding/${row.id}`}>
                      {row.id}
                    </Link>
                  </td>
                  <td data-label="Applicant">
                    <strong>{row.clientName}</strong>
                    <small>{row.clientId}</small>
                  </td>
                  <td data-label="Application date">{row.applicationDate}</td>
                  <td data-label="Suggested risk">
                    <span className={`badge ${row.suggestedRisk.toLowerCase()}`}>{row.suggestedRisk}</span>
                  </td>
                  {/* The header cell is hidden in card layout, so the first card's value is the tour's target on phones. */}
                  <td data-label="Outstanding items" data-tour={index === 0 ? 'outstanding-cell' : undefined}>
                    {row.outstanding === 0 ? 'None' : row.outstanding}
                  </td>
                  <td data-label="Status">{row.status}</td>
                  <td>
                    <Link className="open" href={`/onboarding/${row.id}`}>
                      Open file
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && <p className="empty">No files match these filters. Try broadening your search.</p>}
        </div>
      </section>
    </>
  );
}
