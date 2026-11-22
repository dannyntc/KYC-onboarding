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

Open http://127.0.0.1:3000. The server binds to loopback. After updating the application, run `npm run db:migrate` to apply additive schema migrations before starting it. `npm run db:seed` refuses to overwrite an existing database. To delete all demo reviews and restore the seed intentionally, run `npm run db:reset`.

## Current capabilities

The dashboard and case workbench use SQLite. Cases contain synthetic transactions, KYC extracts, and selected ownership records. Analysts can generate explicitly labeled fixture drafts, save notes, request information, and escalate; events are stored in SQLite. Requests are local records and are not sent. The fixture is prewritten and is not an AI model output. No alert can be automatically closed.

## Known gaps

Verified internal regulatory mappings, complete model-response capture, and broader evidence coverage are not implemented. Monitoring rules are simplified demonstrations rather than bank controls. Do not use real customer data. The demo role selector is not authentication, and production identity and audit security are absent; SQLite is not tamper-proof. Fixture text must be checked against evidence. Rejected structured output is stored for audit, but responses that fail before structured parsing are not preserved.

## Checks

```sh
npm test
npm run typecheck
npm run lint
npm run build
npx playwright install chromium  # once, for browser tests
npm run test:e2e
```

The end-to-end suite creates and removes its own temporary SQLite database; it does not reset the demo database. The `effect` override patches a Prisma CLI dependency that Prisma pins to an affected version. Recheck the override on Prisma upgrades.

## Optional live analysis

Set `OPENAI_API_KEY` and `OPENAI_MODEL` in `.env`, then restart the server. Live mode sends the selected fictional case context to OpenAI, validates the structured output and rejects unknown citations. Failures do not silently switch to fixtures. A case can have only one analysis request in progress; an abandoned lease expires after two minutes. Validation rejects unknown citations and a small set of explicit autonomous conclusions, but cannot establish factual accuracy or catch every unsupported claim. Live calls have not yet been verified with an API key. Never enter real client data.
