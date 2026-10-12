# Единый контракт редактируемого результата

Концептуальная схема; Q-036 закрепляет типы/индексы/migration plan. Не SQL migrations в этом пакете.

## Новые сущности
content_items(workspace_id, project_id, kind:image|text|video|sequence, brief_version, recipe_version,
 primary_channel_id?, content_locale, state, current_revision_ref).
content_variants(item_id, parent_variant_id?, purpose, platform_profile_ref?, market?, locale,
 document_revision_ref, accepted_revision_ref?).
editable_documents(item_id, schema_version, kind, coordinate_space, timebase?, current_revision_ref).
document_revisions(document_id, revision, parent_revision?, immutable_json, hash, renderer_version,
 font_refs, source_asset_refs, created_by, change_reason).
editor_commands(document_id, base_revision, idempotency_key, validated_intent, actor, result_revision).
region_edit_requests(document_revision_ref, region/mask_asset_ref, protected_refs, comment,
 operation_id, candidate_revision_ref, drift_report_ref).
recipe_templates(workspace_id, accepted_source_revision, recipe_version, confirmed_style_facts, rights_refs).
platform_profiles(id, version, official_source, checked_at, formats/limits, delivery_capabilities).
content_plans(project_id, version, item_refs, baseline_estimate_ref, review_policy_ref, schedule/timezone).

Episode/Scene/Shot остаются video-domain деталями; video content item имеет explicit episode relation.
Не создавать fake episodes для text/image, не требовать channel для free visual. Для planned/published item
primary channel обязателен; free item явно задаёт content locale, never silent guess.
Video language inheritance из series/primary channel сохранён; localization — отдельный variant с lineage.
Один ledger/operation/approval model на все types. Уникальные tenant FK и permission checks на всех refs.

## Document grammar
Canvas layers: id/type(text/image/shape)/asset_ref or text/style/transform/z/visible/locked.
Timeline: tracks/clips/source refs/in-out/source time/placement/duration/subtitle cues/keyframes (versioned support).
Sequence: ordered child revision refs, per-item duration, shared theme; Text: semantic blocks/claim refs.
Canonical coordinates independent of viewport, explicit units/origin/color profile/timebase;
server normalizes resource bounds/fonts/URLs. Arbitrary HTML, scripts, remote code in document запрещены.
Unsupported nodes → clear read-only/degraded outcome, не silent dropping at export.

## Consistency
Optimistic concurrency via base revision; conflict → branch/reload/merge for supported operations,
never silent overwrite. Draft autosave checkpoint отдельный от approved immutable snapshot.
Approval bound to variant revision/hash/export profile; edits invalidate affected downstream approval only.
Preview/final uses same grammar and pinned fonts/effects where possible; tolerance matrix and golden render tests.
Rollback выбирает старую revision, не стирает журнал и billed attempts. AI-generated candidate сначала branch.

## Storage and export
Exact assets/versions retained by agreed policy; missing source blocks rerender with recovery path.
Flat PNG/MP4 is deliverable, not editable project. Project export includes manifest/licensed transferable assets
(or unavailable refs), checksums/schema/renderer version; portability does not promise every external editor.
Untrusted ingest/font/media parsed in sandbox with size/duration/resource limits.
