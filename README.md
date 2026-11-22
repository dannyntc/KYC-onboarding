# KYC-onboarding

Local-only, synthetic-data AML investigation prototype. This is incomplete and is not a compliance control. All records are fictional. Analysts remain responsible for review and action.

## Start

Requires Node.js 24 and npm. From this folder:

```sh
npm install
cp -n .env.example .env
npm run db:migrate
npm run db:seed
npm run dev
```

Open http://127.0.0.1:3000. The server binds to loopback. After updating the application, run `npm run db:migrate` to apply additive schema migrations before starting it. `npm run db:seed` refuses to overwrite an existing database. To delete all demo reviews and restore the seed intentionally, run `npm run db:reset`.

For a guided walkthrough and a blank measurement protocol, see [the demonstration script](docs/demo.md) and [evaluation protocol](docs/evaluation.md).

## Current capabilities

The dashboard and case workbench use SQLite locally and Prisma Postgres on Vercel (`DATABASE_ENGINE=postgres`). Cases contain synthetic accounts, transactions, KYC extracts, and ownership records. Matching owner-and-entity records from related clients are included as separately traceable evidence. Analysts can generate explicitly labeled fixture drafts, save notes, request information, and escalate; events are stored with database triggers preventing ordinary updates or deletion. Requests are local records and are not sent. New analysis audit events include the attempt ID; older events are preserved without backfilling. The fixture is prewritten and is not an AI model output. No alert can be automatically closed.

The hosted dashboard is deployed from the lowercase Vercel project `kyc-onboarding-dannyntc`. Once Vercel environment variables are available, use `npm run db:migrate:postgres` and `npm run db:seed:postgres` for the hosted schema and synthetic fixtures.

## Known gaps

The regulatory library links candidate references to specific paragraphs of MAS Notice 626. Case associations are illustrative, not approved internal policy mappings. The review register starts empty, so no references are supplied to AI analysis until an eligible review is recorded. Compliance review and broader evidence coverage remain outstanding. See [control review instructions](docs/control-review.md). Monitoring rules are simplified demonstrations rather than bank controls. Do not use real customer data. The demo role selector is not authentication, and production identity and audit security are absent; SQLite is not tamper-proof: a person with database-file access can remove the triggers or alter the file. Explicit demo reset removes all audit events. Fixture text must be checked against evidence. Live API responses received by the application are stored for audit, including responses rejected during parsing or validation. Provider errors and timeouts with no returned response cannot be captured. New analysis attempts also retain the supplied case context and evidence IDs; open “View evidence used for this draft” to inspect the latest successful draft’s snapshot, or use Analysis history to inspect earlier drafts and failed attempts. Older drafts do not have snapshots. These records may contain synthetic case information and are stored locally without tamper protection.

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

Set `OPENAI_API_KEY` and `OPENAI_MODEL` in `.env`, then restart the server. Live mode sends the selected fictional case context, its permitted evidence IDs, eligible reviewed references and the units for monetary values to OpenAI, validates the structured output and rejects unknown citations. Reviewer names are kept locally; the saved input snapshot also contains the review attestations used for that attempt. Failures do not silently switch to fixtures. A case can have only one analysis request in progress; an abandoned lease expires after two minutes. Validation rejects unknown citations and a small set of explicit autonomous conclusions, but cannot establish factual accuracy or catch every unsupported claim. The SDK request path is tested with a simulated provider; live calls have not yet been verified with an API key. Never enter real client data.
