# Stakeholder demonstration

This script takes approximately 7–10 minutes. All names, relationships, records and amounts are fictional. The prototype supports an analyst; it does not make compliance decisions or file reports.

## Before the session

1. From the project folder, run `npm run db:migrate` and `npm run dev`, then open <http://127.0.0.1:3000>. If the database has never been seeded, run `npm run db:seed` before starting the server. Do not reset an existing database just to run the demo: `npm run db:reset` deliberately deletes all demo analyses, reviews and audit events.
2. Check the mode shown in an investigation. **Fixture mode** uses prewritten scenario text and does not call a model. **Live mode** requires a configured key and model and sends the selected synthetic case to OpenAI. Live mode has not been verified here with a real key. Do not describe a fixture as model-generated.
3. Confirm the demo role is Analyst. This role selector is not authentication. The displayed dashboard counts and case statuses come from the current database and may differ from a fresh seed if cases have already been reviewed.
4. Use only the synthetic data supplied with the project. If external network access is unavailable, the app works in fixture mode; official MAS links may not open.

## 0–2 minutes: alert queue and baseline

- On **Alert dashboard**, explain that simplified deterministic rules create the 12 seeded alerts before any model is called. Filter or search for `ALT-001` and open it.
- Point out expected activity of SGD 50,000–100,000 per month and the SGD 1.2 million incoming transaction `TXN-013`. The next transaction, `TXN-014`, is an outgoing SGD 850,000 payment the following day. These are indicators for review, not findings of wrongdoing.

## 2–4 minutes: investigation draft

- Select **Generate fixture draft** (or **Generate live draft** only if live mode has been configured and verified). Identify the mode label.
- Read the observed facts, risk indicators, missing information, limitations and suggested action. Follow the `TXN-013`, `TXN-014` and `CLI-001` citations back to their records. Explain that citation validation checks whether an ID was supplied, not whether every statement is true or complete.
- If the live call fails, show the error and previous draft, if any. The application does not substitute a fixture for a failed live call.

## 4–6 minutes: compare evidence and references

- Open `ALT-002`. Its client declares SGD 8 million; `DOC-002` corroborates SGD 3 million, leaving SGD 5 million uncorroborated. Generate a draft and follow the document citation. The gap is a prompt for further evidence, not proof of wrongdoing.
- Under **Candidate regulatory references**, follow `MAS-626-6.24` to the library and then the linked official paragraph. Explain that the association is illustrative. By default no reviews are recorded, so it is not supplied to the model; only a current review for the scenario can enable it.
- If time permits, show `ALT-003` for two matching ownership records (`REL-001` and `REL-002`) and `ALT-004` for a property-sale agreement that matches the SGD 2.5 million incoming payment. The latter is a mitigating fact for human assessment, not an automatic closure.

## 6–8 minutes: analyst decision and audit

- Return to a case and use **Add draft to analyst note** to append the draft to any existing note, then edit it. The generated draft remains separate.
- Select **Request information** or **Escalate case**. These actions save a local review state; they do not send a request or file a report. Open **Audit history** and expand the event details to see the actor, time and before/after review values. A generated analysis event records its mode and provenance.
- Explain that the prototype cannot close an alert automatically. A local read-only role rejects application mutations, but the role selector is a demonstration, not an identity or access-control system.

## 8–10 minutes: evaluation and boundaries

- Show [the evaluation protocol](evaluation.md). If no completed study exists, say that no time saving, accuracy improvement or detection improvement has been measured. Fixture mode is useful for a workflow demonstration but is not an AI performance test.
- Summarize the remaining work: compliance review of candidate references and applicability, real-model evaluation if a key is provided, broader evidence coverage, and production-grade identity, security and audit controls. The local SQLite audit triggers deter ordinary edits but do not make the file tamper-proof.

## Scenario quick reference

| Case | Scenario | Evidence to inspect | Human review question |
| --- | --- | --- | --- |
| ALT-001 | Rapid movement | TXN-013, TXN-014, CLI-001 | What explains the third-party inflow and subsequent outflow? |
| ALT-002 | Source-of-wealth discrepancy | DOC-002, CLI-002 | What evidence supports the uncorroborated SGD 5 million? |
| ALT-003 | Shared beneficial ownership | REL-001, REL-002 | Do the records establish a relationship worth consolidated scrutiny? |
| ALT-004 | Documented property sale | DOC-004, TXN-055 | Does the agreement and payment trail adequately explain the funds? |
