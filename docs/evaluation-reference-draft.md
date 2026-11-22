# Synthetic scenario reference — draft for reviewer preparation

**Status: unreviewed draft, not an approved answer key and not an evaluation result.** A qualified, independent reviewer should check the file records, correct or extend this sheet, agree which facts and uncertainties are material, and approve a version before trials begin. Keep the approved key away from investigators until their trials are complete.

This draft is based on `createSeed()` in `src/lib/seed-data.ts`. Amounts below are SGD; source data stores cents. It describes the fresh seed, not necessarily the current contents of an existing demo database. Before using it, compare the actual trial evidence and saved draft snapshot with the reference, and record any differences and the application revision. Do not reset an existing demo database to prepare a trial. These examples are fictional and do not establish whether a real applicant or transaction is suspicious. Application dates fall in December 2025 and the account activity is dated January to May 2026, so all activity follows the application.

"Suggested rating" below is what the application's simple rules produce from the seeded records, not a view on the right answer. The reviewer decides what a competent analyst should conclude.

## ONB-001 — rapid initial funding (CLI-001, Amelia Tan)

**Recorded facts to check**

- Applied 2025-12-15 with declared wealth of SGD 4,500,000 and expected monthly activity of SGD 50,000–100,000.
- `IDV-001` (passport) and `IDV-002` (proof of address) are verified. There are no screening hits. `DOC-101` records employment income corroborating SGD 4,500,000; `DOC-001` is a profile declaration with no corroborated amount.
- `TXN-013` records an incoming SGD 1,200,000 from "New third party" on 2026-05-10. `TXN-014` records an outgoing SGD 850,000 to "Fictional counterparty" on 2026-05-11. Both use `ACC-CLI-001`. `ALT-001` is raised on these.

**Questions and limits**

- Suggested rating is Medium while `ALT-001` is open, and approval is blocked until it is reviewed. The amounts and timing do not establish a connection between the two payments, their purpose, or wrongdoing.
- The source and purpose of the incoming funds, and the recipient and purpose of the outgoing payment, need human review.

## ONB-002 — source-of-wealth gap (CLI-002, Daniel Lim)

**Recorded facts to check**

- Applied 2025-12-16. Declares SGD 8,000,000 from a company sale. `IDV-003` and `IDV-004` are verified; there are no screening hits.
- `DOC-002` is a fictional company-sale extract that records SGD 3,000,000, so SGD 5,000,000 of declared wealth is not corroborated. `TXN-027` records an incoming SGD 210,000 on 2026-05-10. `ALT-002` is raised.

**Questions and limits**

- Suggested rating is High because of the SGD 5,000,000 not corroborated. The difference is not proof that the amount is illicit or that no other supporting records exist. Request further evidence of the sale proceeds and the funds trail.
- The extract supports the SGD 3,000,000 figure; it does not by itself establish the source or purpose of `TXN-027`, the buyer, the sale date or the payment trail.

## ONB-003 and ONB-005 — shared beneficial owner (CLI-003 Priya Menon, CLI-007 Nadia Rahman)

**Recorded facts to check**

- `REL-001` (CLI-003), `REL-002` (CLI-007) and `REL-003` (CLI-011) each name Morgan Vale and Cedar Harbour Holdings. CLI-011 is not one of the twelve applicants.
- Both applicants declare SGD 4,500,000. `DOC-102` (CLI-003) and `DOC-104` (CLI-007) are investment portfolio statements for SGD 4,500,000; `DOC-003` and `DOC-007` are profile declarations. `TXN-041` and `TXN-097` are incoming SGD 210,000 payments on 2026-05-10, with `ALT-003` and `ALT-007` raised.

**Questions and limits**

- Suggested rating is Medium for the shared owner and the open alert. Matching names and entity names do not by themselves establish transfers among the clients, common control of their accounts, or wrongdoing. Verify the ownership, identities, whether the records are current, and relevance to the payment.

## ONB-004 — funds explained by a property sale (CLI-004, Marcus Lee)

**Recorded facts to check**

- Applied 2025-12-18, declared wealth SGD 4,500,000. `DOC-004` is a fictional property-sale agreement summary (seller Marcus Lee, buyer Harbour Property Buyer, completion 2026-05-10, proceeds SGD 2,500,000, settlement trail not supplied). `DOC-103` records employment income of SGD 2,000,000. Together they equal the declared wealth.
- `TXN-055` records an incoming SGD 2,500,000 from "Harbour Property Buyer" on 2026-05-10. `ALT-004` is raised.

**Questions and limits**

- Suggested rating is Medium while `ALT-004` is open and Low once it is reviewed. The matching amount, buyer and date are potentially mitigating, but the summary alone does not prove the agreement, payer, settlement and transaction are linked. Do not claim the funds are fully explained solely because the amounts match.

## ONB-006 to ONB-012 — files without funding alerts

| File | Applicant | Recorded facts to check | Suggested rating before analyst decisions | Questions and limits |
| --- | --- | --- | --- | --- |
| ONB-006 | CLI-013 Sarah Yeo | `IDV-011`, `IDV-012` verified; no hits; `DOC-105` employment income SGD 4,500,000 | Low | A clean file needs a recorded rating with reasons before approval |
| ONB-007 | CLI-014 Darren Ho | `IDV-013` passport Expired; `IDV-014` verified; `DOC-106` inheritance SGD 8,000,000 | Low | Approval is blocked by the expired passport; the reviewer decides what to request |
| ONB-008 | CLI-015 Aisha Malik | `SCR-001` PEP, strong potential match (fictional former deputy minister); `DOC-107` SGD 4,500,000 | Low until the hit is decided; High if confirmed | A potential match does not change the rating until decided; a High rating needs senior approval |
| ONB-009 | CLI-016 Ethan Sim | `SCR-002` sanctions, partial potential match (born 1961 against the applicant's 1988, different nationality); `DOC-108` SGD 4,500,000 | High while unresolved; Low once cleared | Clearing needs a recorded reason; the reviewer decides whether the stated differences are enough |
| ONB-010 | CLI-017 Isabelle Tay | `SCR-003` adverse media, partial potential match (fictional fraud article about a namesake); `DOC-109` SGD 4,500,000 | Low until decided; Medium if confirmed | Only the name links the article to the applicant; the analyst decides |
| ONB-011 | CLI-018 Raj Mehta | `IDV-021` passport verified; `IDV-022` proof of address Missing; `DOC-110` SGD 8,000,000 | Low | Approval is blocked by the missing proof of address |
| ONB-012 | CLI-019 Rachel Chan | `IDV-023`, `IDV-024` verified; no hits; `DOC-111` employment income SGD 4,500,000 | Low | A second clean example |

## Reviewer sign-off to complete before use

| Item | Reviewer entry |
| --- | --- |
| Reviewer / role / date | |
| Application revision and actual dataset or snapshot checked | |
| Changes to the proposed facts, materiality, omissions and accepted decisions | |
| Approved key version and secure location | |
| Scope and limitations agreed for scoring | |

The reviewer decides materiality and scoring before seeing trial outcomes. A valid evidence ID is not sufficient unless the referenced record supports the particular claim. Record disagreements, unsupported claims, missing material facts and mitigating evidence using the [evaluation protocol](evaluation.md).
