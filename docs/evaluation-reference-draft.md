# Synthetic scenario reference — draft for reviewer preparation

**Status: unreviewed draft, not an approved answer key and not an evaluation result.** A qualified, independent reviewer should check the case records, correct or extend this sheet, agree which facts and uncertainties are material, and approve a version before trials begin. Keep the approved key away from investigators until their trials are complete.

This draft is based on `createSeed()` in `src/lib/seed-data.ts`. Amounts below are SGD; source data stores cents. It describes the fresh seed, not necessarily the current contents of an existing demo database. Before using it, compare the actual trial evidence and saved analysis snapshot with the reference, and record any differences and the application revision. Do not reset an existing demo database to prepare a trial. These examples are fictional and do not establish whether a real transaction or client is suspicious.

## ALT-001 — rapid movement

**Recorded facts to check**

- `CLI-001` has an expected monthly activity range of SGD 50,000–100,000.
- `TXN-013` records an incoming SGD 1,200,000 from “New third party” on 2026-05-10. `TXN-014` records an outgoing SGD 850,000 to “Fictional counterparty” on 2026-05-11. Both use `ACC-CLI-001`.
- `DOC-001` is a profile declaration whose summary says further corroboration may be required; it does not explain the two payments.

**Questions and limits**

- The incoming amount exceeds the stated monthly maximum and the outgoing amount follows the next day. Those observations do not establish a connection between the two payments, their purpose, or wrongdoing.
- The source and purpose of the incoming funds, the recipient and purpose of the outgoing payment, and a supporting payment trail need human review. The provided counterparty labels do not identify the parties beyond their fictional labels.
- The retrieved profile extract does not provide a mitigating explanation; absence of one in this extract is not proof none exists elsewhere.

## ALT-002 — source-of-wealth comparison

**Recorded facts to check**

- `CLI-002` declares wealth of SGD 8,000,000 from a company sale and expected monthly activity of SGD 50,000–100,000.
- `DOC-002` is a fictional company-sale extract that records SGD 3,000,000. The difference between declared wealth and this one recorded amount is SGD 5,000,000.
- `TXN-027` records an incoming SGD 210,000 on 2026-05-10, above the profile's stated monthly maximum.

**Questions and limits**

- The difference is not proof that SGD 5,000,000 is illicit or that no other supporting records exist. Request further evidence of sale proceeds and the relevant funds trail as appropriate.
- The extract supports the SGD 3,000,000 figure; it does not by itself establish the source or purpose of `TXN-027`.
- The profile states that the declared wealth came from a company sale; it does not identify the buyer, sale date or payment trail.

## ALT-003 — related ownership

**Recorded facts to check**

- `CLI-003` has an expected monthly activity range of SGD 50,000–100,000; `TXN-041` records an incoming SGD 210,000 on 2026-05-10.
- `REL-001` for `CLI-003`, `REL-002` for `CLI-007`, and `REL-003` for `CLI-011` each name Morgan Vale and Cedar Harbour Holdings. The related-client account identifiers shown by the workbench are `ACC-CLI-007` and `ACC-CLI-011`.

**Questions and limits**

- The records identify matching names and entity names; verify the ownership, identities, relationship, whether the records are current, and relevance to the transaction before drawing a conclusion.
- Matching records do not by themselves establish transfers among the clients, common control of their personal accounts, or wrongdoing. The retrieved data does not establish the purpose of `TXN-041`.
- `DOC-003` is a profile declaration; additional ownership and source-of-funds corroboration may be needed.

## ALT-004 — documented property sale

**Recorded facts to check**

- `CLI-004` has an expected monthly activity range of SGD 50,000–100,000.
- `TXN-055` records an incoming SGD 2,500,000 from “Harbour Property Buyer” on 2026-05-10. `DOC-004` is a fictional property-sale agreement summary naming Marcus Lee as seller, Harbour Property Buyer as buyer, completion on 2026-05-10, and proceeds of SGD 2,500,000. It states that the settlement trail is not supplied.

**Questions and limits**

- The matching amount, named buyer and date are potentially mitigating, but the available summary alone does not prove the agreement, payer, settlement and transaction are linked. Verify the agreement and payment trail.
- The incoming amount exceeds the stated monthly maximum. A large amount and a matching summary are both relevant; neither requires an automatic escalation or closure.
- Do not claim the transaction has been fully explained or the case cleared solely because the amounts match.

## Reviewer sign-off to complete before use

| Item | Reviewer entry |
| --- | --- |
| Reviewer / role / date | |
| Application revision and actual dataset or snapshot checked | |
| Changes to the proposed facts, materiality, omissions and accepted next steps | |
| Approved key version and secure location | |
| Scope and limitations agreed for scoring | |

The reviewer decides materiality and scoring before seeing trial outcomes. A valid evidence ID is not sufficient unless the referenced record supports the particular claim. Record disagreements, unsupported claims, missing material facts and mitigating evidence using the [evaluation protocol](evaluation.md).
