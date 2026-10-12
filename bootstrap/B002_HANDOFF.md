# B-002 — substantial offline block / REVIEW

Owner explicitly authorized «Да, делай офлайн-блок» on 2026-10-02 at 12:59 Asia/Bangkok.
This is a separate pre-P0 exception, not Q-001 acceptance. Scope: bootstrap/B002.json,
DECISION.md; usage: OFFLINE_STUDIO.md. No Q task status/dependency was changed.

## Implemented and published to the remote source branch
- `/studio`: persistent projects, full script, editable 1–6 scene plan, own PNG/JPEG and
  pre-created WAV/MP3/M4A narration uploads with explicit rights confirmation.
- Integer 30–60s, portrait/landscape, explicit longer-audio trim consent; no short-audio
  padding, no URL inputs, no AI/TTS, no hidden generation/fallback.
- Real FFmpeg H.264/AAC MP4, static image fit/padding, escaped Cyrillic captions;
  preview/download/Range, job history/report, explicit retry/cancel/interrupted-on-restart.
- Immutable hashed assets and snapshot revision; optimistic save conflict checks even for
  concurrent requests; a running render does not consume later project edits.
- Same-origin/loopback Host guards, file signatures before ffprobe, local file/pipe protocol
  whitelist; single render and serialized material preparation; bounded sizes/job count.
- Technical sample with two generated PNGs and 30s tone, clearly NOT speech/TTS/real P0.
- Existing `/api/generate` still denies, `/api/health` remains productReady=false.

## Verified locally
`make check` PASS: strict TS, app.js + studio.js syntax; 37 Node (including 4 new
backend/integration + 3 actual-JS VM fixture cases), 7 Python media, 44 spec, 10 transfer,
zero skips. Clean ZIP extraction + offline npm ci + make check also PASS, same counts. Summary: bootstrap/evidence/2026-10-02-offline/verification.json.
Raw full/clean-install logs and archive source manifest remain in the delivered ZIP.
Real tests upload PNG/JPEG/WAV/MP3/M4A, render two-scene demo and 30s portrait /
60s landscape, decode actual MP4, check hashes/Range/report/immutable revisions,
repeat, cancel, corrupt-asset failure, audio duration rejection, restart/persisted project.
Test media are synthetic signals, NOT generated/narrated explainer quality evidence.
Node24.14.1, Python3.13.14, FFmpeg7.0.2-static; TS7.0.2/Node18 typings remain provisional.

## Delivery / remote boundary
Complete source archive `Ywoom-Foundation-v0.4-B002-offline.zip` and separately downloadable
`Ywoom-B002-diagnostic-example.mp4` are delivered in the owner conversation.
Archive has no `.git`, node_modules, local project/asset data or bundled FFmpeg binary.
Do NOT replace genuine GitHub ancestry with local ZIP/synthetic Git history.
Owner authorized remote transfer with «делай» on 2026-10-02 at 13:35 Asia/Bangkok.
Remote base b90c853634c1654ea6b73356038c4163a80083f1 was rechecked unchanged.
B-002 code is published at 4502eb2a3b836384cf732731c75478263f3711e1 on
bootstrap/spec-v04-foundation. GitHub apps/workers/tests subtree hashes and package.json /
.gitignore blob hashes exactly match the tested local source; see remote-source-verification.json.
Ordinary pull of that branch now provides /studio. Main unchanged; PR #1 draft/unmerged.
Local source branch: local/b002-offline-studio-20261002. B-001 remains REVIEW.

## Not verified / risks
Actual browser/video UX, accessibility/visual quality and other OS not_run. UI only Russian.
No real narration/user assets/subjective quality or P0/P1 acceptance. No paid APIs,
production auth/tenant isolation/database/queue/deploy/publishing. Trusted local disk only;
no multi-process locking/encryption/auto-GC. 100MiB asset cap + 20 jobs do not constitute a
full disk quota. Audio text/meaning/silence/rights are not machine-verified. Local compute /
assistant cost unknown (null), not zero. GitHub CI unknown; no new remote CI PASS inferred.
Original PACKAGE_MANIFEST remains the shipping snapshot, not new-release certification.

## Next substantial work
1. Remote code publication and runtime hash verification are complete; review draft PR #1.
   Preserve real GitHub history; do not merge/accept Q gates without owner confirmation.
2. Owner can pull bootstrap/spec-v04-foundation and try the technical demo or their own
   permitted narration/images. The earlier ZIP remains a valid pre-publication snapshot.
3. Full Q-001 choices (staged scope, financial cap/currency/period/stop rule) remain unresolved
   before dependent real P0/provider work. Do not auto-accept or infer paid API approval.
