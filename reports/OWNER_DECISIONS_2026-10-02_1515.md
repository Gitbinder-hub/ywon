# Owner decisions / sequence clarification — 2026-10-02 15:15 Asia/Bangkok

Owner: Oleg Gitbinder. Source: explicit owner message in the project conversation at 2026-10-02T15:15:40.794+07:00. Base checked: ac91abe03e16a6eaa56a2e500836d76cec4e5f47, bootstrap/spec-v04-foundation.

APPROVED: NO
This marker applies ONLY to the complete Q-001 gate: a sequencing conflict remains unresolved. The individual decisions below were explicitly confirmed by the owner; this is not a rejection of those choices. No agent gate/accept command was run and no Q task/dependency/status was changed.

## Confirmed choices
- Staged v0.4 plan P0 through P6, expanded base P2 and separate all-client public release gate: owner said yes, accepts, proceed this way. Future scope remains preserved.
- Live evaluation spend: zero for now. No external paid inference calls, account top-ups or new provider purchases are authorized by this message. A future deposit/account balance is not itself a bounded application spend authorization; cap/period/pricing/attempt plan must be recorded before live execution.
- Development: existing subscription is used alongside other owner work and the owner chooses not to allocate its cost to this project's development budget. Incremental purchases/spend authorization is zero. This is an accounting choice, not proof of free assistant/compute or measured zero total resource cost. Actual allocated subscription/compute cost remains unknown/not allocated.
- Pilot scenario remains previously confirmed: Russian narrated explainer 30–60 seconds, ordinary synthetic voice without cloning, permitted materials and human final review.
- After two unsuccessful attempts, pause and notify the user BEFORE a third. Each subsequent attempt needs a new explicit user decision. Notification/acknowledgment is not execution approval. This does not grant payment permission for the first two attempts and does not authorize automatic/infinite retries. An approved run-level attempt limit/budget still applies. Unknown paid outcome, unclear cost/insufficient cap, rights/security problems stop immediately, without waiting for two failures.

## Proposed recovery UX — requirements to refine, not implemented features
The owner requests a guided recovery experience rather than a confusing error. Show affected step/scene/version, failure or uncertainty, retained accepted results, attempts, known/pending cost and safe next actions.
Possible actions, constrained by capability and consent: fix inputs or prompt, replace the affected scene/material, explicitly approve a new bounded attempt, skip/remove the affected scene with a visible revised plan, or stop. Preserve unrelated accepted assets. Do not delete underlying materials automatically or charge for unknown-result resubmission. Editing a prompt does not erase paid attempt history or reset the cumulative budget. Clarify whether a completed-but-rejected output counts as unsuccessful in Q-003/Q-012/Q-014 design.
User-facing language should explain the task and repair action; no technical prompt editing requirement for novices. Offer structured fields and suggested fixes as well as advanced prompt controls. New suggestions are not guaranteed fixes.
This belongs to subsequent Director/pipeline/acceptance work; no full onboarding or production workflow is authorized early solely by this message.

## Conflict requiring owner clarification
Owner also described conducting first real price/quality tests only after the complete app lets them enter, finish onboarding and receive a final output, and expected later work mostly to tune prompts/integrations.
Accepted evidence-first plan instead requires Q-004/Q-005 real media/economics evidence and Q-005G before P1/P2. Current technical tests, synthetic media and mocked UI cannot establish real speech quality, provider availability, commercial terms, costs, pipeline recovery or novice usability. Later changes may require architecture/integration/UX work, not only prompt tuning.
Do not silently rewrite gates or treat the zero-spend choice as P0/P1 acceptance. Recommended option: preserve evidence-first sequence, do allowed preparation under zero spend; after explicit Q-001 resolution perform Q-002 official research and Q-003 protocol, then stop before Q-004 until a bounded live budget is approved.
Alternative owner choice: explicitly request a bounded pre-P0 guided prototype exception. Its exact scope, limits, tests and handoff must be separately agreed; mock/offline paths remain labeled and do not accept P0/P1/P2 or authorize paid calls/deployment. No whole-application blanket waiver is inferred.
Positive live budget currency/amount/period and maximum attempts remain future choices. Current zero-spend prohibition persists until explicit replacement; no seven-day positive-spend approval is inferred.

## Future ambition — preserved, not activated
Owner wants high-quality supportive UX, detectors/monitoring of model-user interaction, and eventual safe independent extension and promotion of the system. This expresses product ambition, not an implementation timeline, uniqueness guarantee, unrestricted autonomous spending or public publishing authorization.
Relevant existing scope includes QA/four-role orchestration, Skill Lab/Model Scout/Ops, future shell and advertising autonomy. Proposed later safeguards: deterministic event/invariant checks first, bounded model review only when evaluated/useful, privacy-minimized diagnostics, proposals in sandbox/branch, held-out evals, staged rollout/rollback and independent approval for protected paths, external actions and spending. No mandatory always-running paid reviewer bot or unsupervised production self-modification is selected.

## Evidence and limitations
Documentation-only change, no secrets/user assets/provider calls/runtime/protected policy/budget/dependency/workflow changes. Product validate/status/next and make check NOT RUN: trustworthy full checkout remains unavailable in this environment (GitHub DNS failure). Prior 98-test evidence is historical. No quality/cost/self-improvement claims tested here. PR remains draft; no main merge or product acceptance.
