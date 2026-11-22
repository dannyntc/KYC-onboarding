# Stakeholder demonstration

This script takes approximately 8–10 minutes. It follows new applicants through KYC onboarding, with the AML funding check as one section of each file. All names, relationships, records and amounts are fictional. The prototype supports an analyst; it does not make compliance decisions, verify real identities, screen against real lists or file reports.

## Before the session

1. From the project folder, run `npm run db:migrate` and `npm run dev`, then open <http://127.0.0.1:3000>. If the database has never been seeded, run `npm run db:seed` first. If it was seeded before onboarding existed, run `npm run db:seed:onboarding` once after the migration. Do not reset an existing database just to run the demo: `npm run db:reset` deliberately deletes all demo analyses, reviews and audit events.
2. The script changes the files it uses (it approves ONB-006, for example), and those decisions are stored. To repeat the demo, start from a fresh seeded database, for example `DATABASE_URL=file:demo-two.db npm run db:migrate && DATABASE_URL=file:demo-two.db npm run db:seed && DATABASE_URL=file:demo-two.db npm run dev`. A relative file name is created inside the `prisma` folder.
3. Check the mode shown in the **KYC assistant** panel. **Fixture mode** uses prewritten text built from the checks on the page and does not call a model. **Live mode** requires a configured key and model and sends the selected synthetic file to OpenAI. Live mode has not been verified here with a real key. Do not describe a fixture as model-generated.
4. Confirm the demo role at the bottom of the sidebar is Analyst. The role selector is not authentication. Counts, statuses and suggested ratings come from the current database and differ from a fresh seed once files have been decided.
5. Use only the synthetic data supplied with the project. If external network access is unavailable, the app works in fixture mode; official MAS links may not open.

## 0–1 minute: the onboarding queue

- On **Onboarding queue**, explain that each row is a new applicant. **Suggested risk** comes from simple deterministic rules, and **Outstanding items** counts what still blocks approval. Search for `Aisha` to show the search, then clear it.
- Explain the idea: before a bank accepts a client it checks identity and documents, who really owns the client, screening lists, where the wealth came from, and whether the first money in looks normal. The AML alerts from before are now one section inside each file.

## 1–3 minutes: a clean approval (ONB-006, Sarah Yeo)

- Open `ONB-006`. The passport and proof of address are verified, there are no screening hits, and `DOC-105` corroborates all of the declared SGD 4,500,000. The suggested rating is Low.
- Under **Decision**, the outstanding item is "Record a final risk rating and reasons", and **Approve** is greyed out.
- In **Risk assessment**, choose Low, write a reason of at least 20 characters, and select **Save risk rating**. The panel now says "Ready for decision". Add a decision note and select **Approve**. The status becomes Approved.
- Open **Audit history** and expand the two events. Each shows the actor, time, and before and after values.

## 3–4 minutes: a screening false positive (ONB-009, Ethan Sim)

- Open `ONB-009`. The unresolved sanctions hit `SCR-002` makes the suggested rating High. Read the hit: the list entry gives a different birth year and nationality.
- Select **Clear as false positive** with the reason box empty. The server refuses and asks for a reason of at least 10 characters. Enter a reason such as "Different birth year and nationality" and select it again.
- The hit now reads "Cleared – false positive" and the suggested rating falls to Low. Say plainly that a person made that call, and that the reason is in the audit history.

## 4–6 minutes: a politically exposed person and senior approval (ONB-008, Aisha Malik)

- Open `ONB-008`. `SCR-001` is a strong potential PEP match (a fictional former deputy minister). Until an analyst decides it, it is listed as outstanding and does not change the suggested rating.
- Enter a reason and select **Confirm match**. The suggested rating becomes High. Choose High in **Risk assessment**, give reasons, and select **Save risk rating**.
- The only outstanding item is "High-risk applicants need senior approval". Select **Approve** as the analyst: the status becomes Pending senior approval, and **Approve** is greyed out.
- Switch the demo role to **Senior approver** in the sidebar, reopen `ONB-008`, and select **Give senior approval**. The status becomes Approved and the audit history shows "Demo senior approver". The role switch is a demonstration, not a login.

## 6–8 minutes: a wealth gap and the KYC draft (ONB-002, Daniel Lim)

- Open `ONB-002`. He declares SGD 8,000,000 from a company sale; `DOC-002` corroborates SGD 3,000,000, so SGD 5,000,000 is not corroborated and the suggested rating is High. The gap is a prompt for more evidence, not proof of wrongdoing.
- In **KYC assistant**, select **Generate fixture KYC draft** (or **Generate live KYC draft** only if live mode has been configured and verified). Identify the mode label. Follow the `DOC-002` citation back to the document.
- Note the **Suggestions for the analyst**: a rating and a next step. The draft cannot approve or reject, and it cannot call a screening hit confirmed. Citation checking confirms that an ID was supplied, not that every statement is true.
- Select **Add draft to note**, edit the note, and select **Request information**. The status becomes Information requested. This saves a local record; it does not send a request.
- If a live call fails, the error appears and earlier drafts remain. The application does not substitute a fixture for a failed live call. Each attempt appears under **Draft history**.

## 8–9 minutes: the funding alert inside a file (ONB-001, Amelia Tan)

- Open `ONB-001`. In **Initial funding & activity since application (AML)**, `ALT-001` is open: `TXN-013` is an incoming SGD 1,200,000 and `TXN-014` an outgoing SGD 850,000 the next day, against expected activity of SGD 50,000–100,000 per month. These are indicators for review, not findings.
- **Approve** is greyed out and the outstanding item reads "Alert ALT-001 has not been reviewed". Select `ALT-001` to open the existing investigation page, add a note and select **Save review**.
- Use the link **Back to KYC file ONB-001**. The alert no longer blocks approval and the suggested rating falls from Medium to Low.

## 9–10 minutes: audit and boundaries

- Show **Audit history** on any decided file, and mention that the database triggers deter ordinary edits but do not make the file tamper-proof.
- Show [the evaluation protocol](evaluation.md). If no completed study exists, say that no time saving, accuracy improvement or detection improvement has been measured. Fixture mode is useful for a workflow demonstration but is not an AI performance test.
- Summarize the remaining work: compliance review of the candidate MAS Notice 626 references and their applicability, real-model evaluation if a key is provided, real identity verification and screening providers, and production-grade identity, security and audit controls.

## Applicant quick reference

| File | Applicant | Story | Evidence to inspect | What the analyst does |
| --- | --- | --- | --- | --- |
| ONB-001 | Amelia Tan | Rapid initial funding | `ALT-001`, `TXN-013`, `TXN-014`, `DOC-101` | Review the alert first; approval is blocked while it is open |
| ONB-002 | Daniel Lim | Source-of-wealth gap | `DOC-002`, `CLI-002` | Request information on the SGD 5,000,000 not corroborated |
| ONB-003 | Priya Menon | Shared hidden owner | `REL-001`, `REL-002`, `REL-003`, `ALT-003` | Medium; consider the linked clients together |
| ONB-004 | Marcus Lee | Funds explained by a property sale | `DOC-004`, `DOC-103`, `TXN-055`, `ALT-004` | Review `ALT-004`, then approve as Low |
| ONB-005 | Nadia Rahman | Other side of the shared-owner link | `REL-002`, `ALT-007`, `DOC-104` | Medium, linked to ONB-003 |
| ONB-006 | Sarah Yeo | Clean | `DOC-105` | Set Low with reasons, then approve |
| ONB-007 | Darren Ho | Expired passport | `IDV-013`, `DOC-106` | Blocked until a valid ID; request information |
| ONB-008 | Aisha Malik | Potential PEP match | `SCR-001`, `DOC-107` | Confirm, rate High, senior approval |
| ONB-009 | Ethan Sim | Sanctions false positive | `SCR-002`, `DOC-108` | Clear with a reason, rate Low, approve |
| ONB-010 | Isabelle Tay | Adverse media on a namesake | `SCR-003`, `DOC-109` | Analyst decides; confirming gives Medium |
| ONB-011 | Raj Mehta | Missing proof of address | `IDV-022`, `DOC-110` | Blocked; request information |
| ONB-012 | Rachel Chan | Clean, second example | `DOC-111` | Set Low with reasons, then approve |
