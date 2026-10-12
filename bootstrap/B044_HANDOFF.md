# B-044 — read-only verified-result API / REVIEW

Adds `createLiveResults` and wires it into `createApp`. `GET /api/live-results/:runId` is enabled only when an existing regular B-043 SQLite database is explicitly configured. The default server remains fail-closed. The handler enforces localhost/same-origin, validates the run ID, never creates a missing DB, maps missing/integrity/unavailable states without leaking filesystem details, and returns only the sanitized receipt plus fixed denial flags.

POST/PUT/PATCH/DELETE are denied with 405. No `/file` route exists. The API does not read the run directory, raw manifest, script, images, audio or MP4 and cannot trigger generation/import/publication. `artifactName` is the already constrained safe basename, not a path.

Three new tests cover sanitized success metadata, absent media route, read-only methods, missing result/store, foreign origin and actual `createApp` wiring. The 178-test non-base-API suite passes; targeted B-044 wiring in the base API file passes. Strict TypeScript passes with available 5.9.3 fallback and four Python workers compile. Full base API rerun has one environment-only failure because the partial local checkout lacks `apps/web/public` static fixtures; pinned 7.0.2 wrapper/full npm check/CI remain NOT_RUN. No network/provider/spend or production transition occurred.

Owner smoke command after pull:

```bash
Ywoom_LIVE_RESULT_DB=outputs/live-result-receipts.sqlite node apps/api/src/server.ts
curl http://127.0.0.1:3000/api/live-results/google-p0-002
```

Next boundary after owner confirmation: show this metadata in the local UI as an explicitly verified, not-published result. Media playback should remain on an separately designed authenticated/object-storage boundary rather than arbitrary local paths.
