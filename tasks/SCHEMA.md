# Registry schema v1
project.json: schema_version/spec_version/updated_at/product_implementation/current_phase/phase_order/
phase_gates/selected_expansion_tasks/selected_scale_tasks/tasks[].
Task: id/title/phase/kind/enabled/status/depends_on/context/ac/scope/out_of_scope/paid_calls,
assignee/session/handoff/checkpoint/block_reason/review_note/acceptance/history.
Statuses: TODO → DOING → REVIEW → DONE; reject→TODO; block→BLOCKED; authorized resume→DOING.
Gate shortcut records owner decision and proof. DONE dependencies only; current-phase ready tasks only.
Owner tasks are explicit gate kind. Work cannot skip gate by changing current_phase; validator checks prior gates.
Implementation DONE requires full AC proof and owner declaration; truth needs independent review.

features.json: features[] with id/title/first_phase/activation_gate/acceptance_intent/dependencies/
implementation_tasks/expansion_tasks/future_notes/spec_tooling_ready/progress_rule.
Feature state computed, not hand-edited duplicate. Full feature scope never assumed complete from first task.

handoff: TEMPLATE.json fields + one ac_results record per AC; pass has evidence refs,
not_applicable has reason, fail/not_run block acceptance. Relative local refs must exist inside root;
https evidence allowed but must be inspected. Costs unknown=null, not fabricated zero.
History events immutable by convention/git review, not secure audit storage.


## v0.4 traceability and release fields
project.json adds public_release_gate/public_release_tasks/release_profile. These do not grant approvals;
release gate is owner_gate in P6 and depends on all required release tasks plus Q-035G.
docs/requirements.json: schema/spec version, unique id/document/tasks/features/requirement;
all references validated; no product status duplicated here. Product step semantics described by subject docs.
Legacy context paths moved; department files canonical, numbered old paths only redirects.
