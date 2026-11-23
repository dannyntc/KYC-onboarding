# Evaluation protocol and record

This is a blank protocol, not a report of results. An analyst and an independent reviewer must perform and record the work. Do not use real customer information.

## Objective and scope

Compare a manual KYC onboarding review with a genuinely live-model-assisted review on the same synthetic evidence. Separately, a fixture-mode walkthrough can evaluate the interface, but its prewritten text cannot establish model quality or AI time savings. Record the application revision, date, model and prompt version, mode, participants, cases, and any protocol deviations. Preserve the output and evidence used for review. New draft records retain their generation-time context and permitted evidence IDs; use the draft history on the KYC file to inspect the saved input, output, and provider response for each attempt, including failures. Older drafts have no snapshot. The local database is not tamper-proof.

The scenarios are the twelve onboarding files `ONB-001` to `ONB-012`: rapid initial funding (`ONB-001`), a source-of-wealth gap (`ONB-002`), a shared hidden owner (`ONB-003` and `ONB-005`), funds explained by a property sale (`ONB-004`), two clean applicants (`ONB-006` and `ONB-012`), an expired passport (`ONB-007`), a potential PEP match (`ONB-008`), a sanctions false positive (`ONB-009`), adverse media on a namesake (`ONB-010`) and a missing proof of address (`ONB-011`). The four transaction alerts `ALT-001` to `ALT-004` sit inside `ONB-001` to `ONB-004`. See [the demo script](demo.md) for the seeded evidence. Before timing, prepare a reviewer-approved answer key from the source records, including facts, meaningful omissions, mitigating evidence, expected uncertainty, and plausible next steps. An [unreviewed scenario reference draft](evaluation-reference-draft.md) is available for reviewer preparation; it is not an approved key. Do not treat the fixture as the answer key.

## Method

1. Agree the task boundary and start/stop times before a trial: start when the reviewer opens the KYC file, stop when they have saved the final risk rating and reasons and recorded a decision (approve, reject or request information, or a senior approval request). Record elapsed seconds and any interruptions. Give both methods the same evidence and decision criteria.
2. In the **manual** trial, inspect the file's records and make the decision without generating or consulting a draft. Record evidence collection effort as the count of distinct source records opened, alongside any relevant observations.
3. In the **live-assisted** trial, generate the live KYC draft, follow its citations, verify every material statement, and edit or reject it before saving the review. Record the model, prompt version, mode, and any provider or validation failure; do not replace a failed live call with a fixture. Count distinct records opened using the same rule as the manual trial.
4. Use independent investigators or counterbalance case order and trial order to reduce memory and learning effects. The same synthetic case is useful for paired comparison, but a person who has already seen it is not a blinded independent trial. Record investigator experience, order, case, and repeat attempts; do not combine incomparable trials without explaining the limitation.
5. A reviewer who did not produce the trial compares the saved note, final rating, decision and supporting records against the pre-agreed answer key, including whether the right blockers were resolved and whether any screening hit was decided on a recorded reason. Record supported material facts, missed material facts, unsupported or contradicted claims, valid and invalid citations, relevant mitigating facts, unresolved risk signals, and reviewer corrections. A valid ID alone does not establish that the cited source supports the statement. Do not count a cautious recommendation as a confirmed fact.
6. Review each scenario, including the clean files and the mitigating cases (a documented property sale and a cleared false positive). Do not infer real-world false-negative rates or detection performance from these synthetic examples. Do not claim improved detection or savings without sufficient reviewed measurements.

## Trial record — copy one table per trial

| Field | Entry |
| --- | --- |
| Trial ID / date / operator | |
| App revision / file ID / scenario | |
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
| Final risk rating / human decision / corrections / limitations | |

## Paired summary — complete only after review

| File and pair | Manual seconds | Live-assisted seconds | Difference | Manual vs assisted missed material facts | Unsupported claims / citation issues | Interpretation and limitations |
| --- | ---: | ---: | ---: | --- | --- | --- |
| | | | | | | |

For each matched pair, calculate time difference as `manual seconds − live-assisted seconds`; report absolute times as well. Describe the number of trials, order effects, failures, missing results and disagreements. Record any missed risk signal explicitly. A smaller time alone is not success if evidence quality or risk recognition worsens. Do not report percentage improvements as achieved unless they are calculated from reviewed, comparable trials and their limitations are stated.
