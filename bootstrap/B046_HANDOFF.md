# B-046 — immutable verified-result project reference / REVIEW

Adds `POST /api/offline/projects/:projectId/verified-result` with `{revision, runId, commandId}`. The server loads the existing project and B-043 receipt itself; callers cannot submit hashes, success flags or filesystem paths. The project reference stores only bounded identifiers/hashes plus fixed denial flags. Attachment increments the project revision and survives later plan edits.

One project accepts one immutable reference. Exact command replay is idempotent even after the revision increment. Reusing a command ID with changed data, attaching another command/result, deleting the reference, stale project revision, missing/unavailable receipt store and receipt integrity failure all fail closed. The local JSON rename is atomic for this single-user prototype but is not a production transaction, tenant boundary or externally anchored audit log.

Studio exposes “Привязать к проекту (только ссылка)” only when a project is saved, clean and verified metadata is loaded. The pending command ID is retained across client errors so retry is exact rather than a blind new mutation. Linked projects automatically reload the receipt metadata and label the link immutable; no player/media URL or publication action is added.

Two new tests cover DOM attachment plus real HTTP persistence/replay/conflict/preservation/deletion denial. Available suite: 185/185 PASS; strict TypeScript 5.9.3 fallback, JS syntax and four Python workers pass. Visual inspection at 1440px and 390px passes with no overlap, clipping or horizontal overflow. Full complete-checkout/static/browser interaction/CI remain NOT_RUN.

Next safe boundary: add a read-only project evidence summary/export that combines the project revision and immutable receipt hashes without embedding media or declaring publication readiness.
