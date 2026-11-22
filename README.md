# KYC-onboarding

Local-only, synthetic-data KYC onboarding prototype with an embedded AML funding check. It follows a new applicant through identity and documents, beneficial ownership, screening (PEP, sanctions and adverse media), source of wealth, initial funding and activity checks, and a suggested risk rating, ending in a human decision. This is incomplete and is not a compliance control. All records are fictional. Analysts remain responsible for review and action.

## Start

Requires Node.js 24 and npm. From this folder:

```sh
npm install
cp -n .env.example .env
npm run db:migrate
npm run db:seed
npm run dev
```

Open http://127.0.0.1:3000. The server binds to loopback. `npm run db:seed` loads the 30 synthetic clients, their alerts and the 12 onboarding applicants into an empty database, and refuses to overwrite an existing one. To delete all demo reviews and restore the seed intentionally, run `npm run db:reset`; this also erases the audit history.

### Upgrading a database that was seeded before onboarding existed

The onboarding tables are added by additive migrations, and the onboarding data is added without touching anything that is already there:

```sh
npm run db:migrate
npm run db:seed:onboarding
```

`db:seed:onboarding` only inserts. It refuses to run if any onboarding table already has rows, or if clients `CLI-001` to `CLI-019` are missing or renamed, and it adds everything in one transaction. For the hosted Postgres database the equivalents are `npm run db:migrate:postgres` and `npm run db:seed:onboarding:postgres`. Take a copy of the database file first if the existing data matters.

For a guided walkthrough and a blank measurement protocol, see [the demonstration script](docs/demo.md) and [evaluation protocol](docs/evaluation.md).

## Current capabilities

- **Onboarding queue.** The home page lists 12 synthetic applicants with a suggested risk rating, the number of outstanding items, status, and search and filters. The earlier alert queue is at **Funding alerts** (`/alerts`).
- **KYC file.** Each applicant has a file showing identity documents, beneficial ownership (including other clients that share an owner), screening hits, source of wealth against declared wealth, and the initial funding and activity checks. Every record is traceable by its ID.
- **Suggested risk and blockers.** Deterministic rules suggest Low, Medium or High with the reasons and evidence IDs, and list what blocks approval (for example an expired passport, an undecided screening hit or an alert that has not been reviewed). The server re-checks the blockers on every save, so a direct request cannot bypass them.
- **Human decisions.** An analyst records a final rating with reasons, decides screening hits with a reason, and approves, rejects or requests information. A High rating needs a second person: the analyst's approval moves the file to *Pending senior approval* and a *Senior approver* completes it. Roles are a demo switch, not authentication.
- **KYC assistant.** A draft built from the file's own checks, clearly labelled. The default is a prewritten fixture and not an AI model output. The draft suggests a rating and next step but cannot approve, reject or declare a screening match confirmed, and wording that does so is rejected. Saved drafts, failed attempts and the evidence used for each are kept.
- **AML section.** The four seeded funding alert scenarios (rapid movement, a source-of-wealth gap, a shared beneficial owner and a documented property sale) open the existing alert investigation page from inside the file. No alert is closed automatically.
- **Audit.** Every onboarding change is stored as an append-only event with before and after values. Database triggers prevent ordinary updates or deletion.

The application uses SQLite locally and Prisma Postgres on Vercel (`DATABASE_ENGINE=postgres`). Requests such as *Request information* are local records and are not sent anywhere.

The hosted site is deployed from the lowercase Vercel project `kyc-onboarding-dannyntc`. Once Vercel environment variables are available, use `npm run db:migrate:postgres` and `npm run db:seed:postgres` for the hosted schema and synthetic fixtures.

## Known gaps

- There is no real identity verification, document upload or ID scanning. Documents, screening results (PEP, sanctions and adverse media) and ownership records are fictional text.
- The demo roles, including *Senior approver*, are a selector and are not authentication. Production identity, access control and audit security are absent. SQLite is not tamper-proof: a person with database-file access can remove the triggers or alter the file. Explicit demo reset removes all audit events.
- The risk rating rules and blockers are simplified demonstrations, not a bank's policy. A potential PEP or adverse-media match does not change the suggested rating until an analyst decides it.
- The regulatory library links candidate references to specific paragraphs of MAS Notice 626. They were checked against the official PDF when added, but the associations with checks are illustrative, not approved internal policy mappings. The review register starts empty, so no references are supplied to live AI analysis until an eligible review is recorded. Compliance review remains outstanding. See [control review instructions](docs/control-review.md).
- Fixture text must be checked against evidence. Live API responses received by the application are stored for audit, including responses rejected during parsing or validation. Provider errors and timeouts with no returned response cannot be captured. New drafts also retain the supplied context and evidence IDs; open "View evidence used for this draft" on a KYC file, or use the draft history to inspect earlier drafts and failed attempts. These records may contain synthetic information and are stored locally without tamper protection.
- The hosted Vercel deployment blocks saving, because the local-origin check accepts only loopback addresses, so it is view-only. Do not use real customer data.

## Checks

```sh
npm test
npm run typecheck
npm run lint
npm run build
npx playwright install chromium  # once, for browser tests
npm run test:e2e
npm run test:e2e:live
```

Both end-to-end suites use temporary SQLite databases and do not reset the demo database. The live-path suite uses a local simulated OpenAI-compatible server and a test-only key; it makes no live model call. The `effect` override patches a Prisma CLI dependency that Prisma pins to an affected version. Recheck the override on Prisma upgrades.

## Optional live analysis

Set `OPENAI_API_KEY` and `OPENAI_MODEL` in `.env`, then restart the server. Live mode sends the selected fictional case or KYC file context, its permitted evidence IDs, eligible reviewed references and the units for monetary values to OpenAI, validates the structured output and rejects unknown citations. Reviewer names are kept locally; the saved input snapshot also contains the review attestations used for that attempt. Failures do not silently switch to fixtures. A file or case can have only one draft request in progress; an abandoned lease expires after two minutes. Validation rejects unknown citations and a small set of explicit autonomous conclusions, but cannot establish factual accuracy or catch every unsupported claim. The SDK request path is tested with a simulated provider; live calls have not yet been verified with an API key. Never enter real client data.
