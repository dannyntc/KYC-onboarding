# Synthetic scenario reference — draft for reviewer preparation

**Status: unreviewed draft, not an approved answer key and not an evaluation result.** A qualified, independent reviewer should check the file records, correct or extend this sheet, agree which facts and uncertainties are material, and approve a version before trials begin. Keep the approved key away from investigators until their trials are complete.

This draft is based on `createSeed()` in `src/lib/seed-data.ts`. Amounts below are SGD; source data stores cents. It describes the fresh seed, not necessarily the current contents of an existing demo database. Before using it, compare the actual trial evidence and saved draft snapshot with the reference, and record any differences and the application revision. Do not reset an existing demo database to prepare a trial. These examples are fictional and do not establish whether a real applicant or transaction is suspicious. Application dates fall in December 2025 and the account activity is dated January to May 2026, so all activity follows the application.

"Suggested rating" below is what the application's simple rules produce from the seeded records, not a view on the right answer. The reviewer decides what a competent analyst should conclude.

## ONB-001 — clean file, wealth from employment income (CLI-001, Amelia Tan)

**Recorded facts to check**

- Applied 2025-12-15 with declared wealth of SGD 4,500,000 and expected monthly activity of SGD 50,000–100,000.
- `IDV-001` (passport) and `IDV-002` (proof of address) are verified. There are no screening hits. `DOC-101` records employment income corroborating SGD 4,500,000; `DOC-001` is a profile declaration with no corroborated amount.

**Questions and limits**

- Suggested rating is Low with no risk factors. A clean file still needs a recorded rating with reasons before approval.

## ONB-002 — source-of-wealth gap (CLI-002, Daniel Lim)

**Recorded facts to check**

- Applied 2025-12-16. Declares SGD 8,000,000 from a company sale. `IDV-003` and `IDV-004` are verified; there are no screening hits.
- `DOC-002` is a fictional company-sale extract that records SGD 3,000,000, so SGD 5,000,000 of declared wealth is not corroborated.

**Questions and limits**

- Suggested rating is High because of the SGD 5,000,000 not corroborated. The difference is not proof that the amount is illicit or that no other supporting records exist. Request further evidence of the sale proceeds.
- The extract supports the SGD 3,000,000 figure; it does not by itself establish the buyer, the sale date or the payment trail.

## ONB-003 and ONB-005 — shared beneficial owner (CLI-003 Priya Menon, CLI-007 Nadia Rahman)

**Recorded facts to check**

- `REL-001` (CLI-003), `REL-002` (CLI-007) and `REL-003` (CLI-011) each name Morgan Vale and Cedar Harbour Holdings. CLI-011 is not one of the twelve applicants.
- Both applicants declare SGD 4,500,000. `DOC-102` (CLI-003) and `DOC-104` (CLI-007) are investment portfolio statements for SGD 4,500,000; `DOC-003` and `DOC-007` are profile declarations.

**Questions and limits**

- Suggested rating is Medium for the shared owner. Matching names and entity names do not by themselves establish common control or wrongdoing. Verify the ownership, identities and whether the records are current.

## ONB-004 — wealth documented by a property sale (CLI-004, Marcus Lee)

**Recorded facts to check**

- Applied 2025-12-18, declared wealth SGD 4,500,000. `DOC-004` is a fictional property-sale agreement summary (seller Marcus Lee, buyer Harbour Property Buyer, completion 2026-05-10, proceeds SGD 2,500,000, settlement trail not supplied). `DOC-103` records employment income of SGD 2,000,000. Together they equal the declared wealth.

**Questions and limits**

- Suggested rating is Low: the documents add up to the declared wealth. The agreement summary alone does not prove the sale or its settlement, and the settlement trail was not supplied.

## ONB-006 to ONB-012 — other files

| File | Applicant | Recorded facts to check | Suggested rating before analyst decisions | Questions and limits |
| --- | --- | --- | --- | --- |
| ONB-006 | CLI-013 Sarah Yeo | `IDV-011`, `IDV-012` verified; no hits; `DOC-105` employment income SGD 4,500,000 | Low | A clean file needs a recorded rating with reasons before approval |
| ONB-007 | CLI-014 Darren Ho | `IDV-013` passport Expired; `IDV-014` verified; `DOC-106` inheritance SGD 8,000,000 | Low | Approval is blocked by the expired passport; the reviewer decides what to request |
| ONB-008 | CLI-015 Aisha Malik | `SCR-001` PEP, strong potential match (fictional former deputy minister); `DOC-107` SGD 4,500,000 | Medium until the hit is decided (strong potential PEP match); High if confirmed | A strong potential PEP match raises the rating to Medium until decided; a High rating needs senior approval |
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
