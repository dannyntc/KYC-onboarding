# KYC-onboarding

Local-only, synthetic-data AML investigation prototype. This is incomplete and is not a compliance control. All records are fictional. Analysts remain responsible for review and action.

## Start

Requires Node.js 24 and npm. From this folder:

```sh
npm install
cp .env.example .env
npm run db:migrate
npm run db:seed
npm run dev
```

Open http://127.0.0.1:3000. The server binds to loopback. `npm run db:seed` refuses to overwrite an existing database. To delete all demo reviews and restore the seed intentionally, run `npm run db:reset`.

## Current capabilities

The dashboard and case workbench use SQLite. Cases contain synthetic transactions, KYC extracts, and selected ownership records. Analysts can generate explicitly labeled fixture drafts, save notes, request information, and escalate; events are stored in SQLite. Requests are local records and are not sent. The fixture is prewritten and is not an AI model output. No alert can be automatically closed.

## Known gaps

Verified internal regulatory mappings, full audit metadata, richer evidence coverage, deterministic monitoring rules, and browser/end-to-end tests are not implemented. Do not use real customer data. The demo role selector is not authentication, and production identity and audit security are absent; SQLite is not tamper-proof. Fixture text must be checked against evidence. npm audit currently reports four high-severity findings in Prisma tooling dependencies.

## Checks

```sh
npm test
npm run typecheck
npm run lint
npm run build
```

## Optional live analysis

Set `OPENAI_API_KEY` and `OPENAI_MODEL` in `.env`, then restart the server. Live mode sends the selected fictional case context to OpenAI, validates the structured output and rejects unknown citations. Failures do not silently switch to fixtures. Live calls have not yet been verified with an API key. Never enter real client data.
