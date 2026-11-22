# Evaluation protocol and record

This is a blank protocol, not a report of results. An analyst and an independent reviewer must perform and record the work. Do not use real customer information.

## Objective and scope

Compare a manual investigation with a genuinely live-model-assisted investigation on the same synthetic evidence. Separately, a fixture-mode walkthrough can evaluate the interface, but its prewritten text cannot establish model quality or AI time savings. Record the application revision, date, model and prompt version, mode, participants, cases, and any protocol deviations. Preserve the output and evidence used for review. New draft records retain their generation-time context and permitted evidence IDs; use Analysis history in the case workbench to inspect the saved input, output, and provider response for each attempt, including failures. Older drafts have no snapshot. The local database is not tamper-proof.

The scenarios are `ALT-001` (rapid movement), `ALT-002` (source-of-wealth discrepancy), `ALT-003` (linked ownership), and `ALT-004` (documented property sale). See [the demo script](demo.md) for the seeded evidence. Before timing, prepare a reviewer-approved answer key from the source records, including facts, meaningful omissions, mitigating evidence, expected uncertainty, and plausible next steps. An [unreviewed scenario reference draft](evaluation-reference-draft.md) is available for reviewer preparation; it is not an approved key. Do not treat the fixture as the answer key.

## Method

1. Agree the task boundary and start/stop times before a trial: start when the investigator opens the case, stop when they save a review note and chosen action. Record elapsed seconds and any interruptions. Give both methods the same evidence and decision criteria.
2. In the **manual** trial, inspect the case records and write the review without generating or consulting a draft. Record evidence collection effort as the count of distinct source records opened, alongside any relevant observations.
3. In the **live-assisted** trial, generate the live draft, follow its citations, verify every material statement, and edit or reject it before saving the review. Record the model, prompt version, mode, and any provider or validation failure; do not replace a failed live call with a fixture. Count distinct records opened using the same rule as the manual trial.
4. Use independent investigators or counterbalance case order and trial order to reduce memory and learning effects. The same synthetic case is useful for paired comparison, but a person who has already seen it is not a blinded independent trial. Record investigator experience, order, case, and repeat attempts; do not combine incomparable trials without explaining the limitation.
5. A reviewer who did not produce the trial compares the saved note and supporting records against the pre-agreed answer key. Record supported material facts, missed material facts, unsupported or contradicted claims, valid and invalid citations, relevant mitigating facts, unresolved risk signals, and reviewer corrections. A valid ID alone does not establish that the cited source supports the statement. Do not count a cautious recommendation as a confirmed fact.
6. Review each scenario, including the documented-sale mitigating case. Do not infer real-world false-negative rates or detection performance from these synthetic examples. Do not claim improved detection or savings without sufficient reviewed measurements.

## Trial record — copy one table per trial

| Field | Entry |
| --- | --- |
| Trial ID / date / operator | |
| App revision / case ID / scenario | |
| Method: manual, live-assisted, or fixture walkthrough | |
| Model / prompt version / provider result | |
| Trial order / prior exposure / interruptions | |
| Start / stop / elapsed seconds | |
| Distinct evidence records opened and IDs | |
| Draft and saved review location / audit event | |
| Reviewer and answer-key version | |
| Material supported facts / missed facts / unsupported or contradicted claims | |
| Citations checked / valid and supporting / invalid or non-supporting | |
| Mitigating evidence and unresolved risk signals | |
| Final human action / corrections / limitations | |

## Paired summary — complete only after review

| Case and pair | Manual seconds | Live-assisted seconds | Difference | Manual vs assisted missed material facts | Unsupported claims / citation issues | Interpretation and limitations |
| --- | ---: | ---: | ---: | --- | --- | --- |
| | | | | | | |

For each matched pair, calculate time difference as `manual seconds − live-assisted seconds`; report absolute times as well. Describe the number of trials, order effects, failures, missing results and disagreements. Record any missed risk signal explicitly. A smaller time alone is not success if evidence quality or risk recognition worsens. Do not report percentage improvements as achieved unless they are calculated from reviewed, comparable trials and their limitations are stated.
