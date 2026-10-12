# B-045 — verified result metadata in local Studio / REVIEW

Adds a separate green semantic panel to `/studio`. A user enters a bounded run ID or opens `?verifiedRun=<id>`; the client requests only `/api/live-results/:runId`. Contract checks require all B-044 denial flags and a verified receipt before anything is shown. Rendering uses `textContent`, so run metadata cannot inject markup.

The panel shows the run ID, dimensions, H.264/AAC, measured duration and full SHA-256. It labels the artifact “Локально проверен · не опубликован”, keeps human content/rights review visible, and offers no video source, download, generation, import, publish or production-ready control. Existing offline player remains separate and unchanged.

Two new node:vm DOM tests cover a valid receipt and fail-closed invalid ID/malformed contract. The available non-base-API suite is 183/183 PASS; JS syntax, strict TypeScript 5.9.3 fallback and four Python workers pass. Static visual QA used the actual Studio markup/CSS at 1440px and 390px: no overlaps, clipped elements, console errors or horizontal overflow; mobile receipt rows were changed to a one-column layout after inspection. This is visual inspection of the local UI, not full browser interaction, WCAG certification or product acceptance.

Owner smoke after pull:

```bash
Ywoom_LIVE_RESULT_DB=outputs/live-result-receipts.sqlite node apps/api/src/server.ts
```

Then open `http://127.0.0.1:3000/studio?verifiedRun=google-p0-002`. Next safe boundary: connect the verified result to a local project as a read-only reference, without copying media or granting publish/generation authority.
