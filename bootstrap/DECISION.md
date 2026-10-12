# B-001 — explicit owner decision / provisional ADR
2026-10-01: owner chose «v0.4 + каркас до P0, без платных API» and approved repository publication.
User later made repository private; no change to implementation scope.

Build a bounded, localhost-only, stateless prototype before real P0 evidence.
Runtime: Node 24 built-in HTTP/crypto + Python stdlib + optional existing ffprobe.
No new runtime JS packages, hosted services, secret keys, paid generators, auth or database.
Contracts and API/core are TypeScript; web is a disposable static development shell, not production UX.
Frontend framework/API library/queue/auth/database choices remain Q-006 and later ADR decisions.

Typecheck tooling pinned to versions available in this offline environment: TS 7.0.2,
@types/node 18.19.130 (only stable HTTP/fs/crypto subset used). Runtime is Node 24.14.1.
This type-definition/runtime version mismatch is an explicit bootstrap limitation; current Node 24
matching types and audited lockfile are required before accepted P1. No frozen production stack claim.
Node runtime supports direct erasable .ts execution; no transpiler runtime dependency.
The prototype has no provider interface that can submit paid work. /api/generate always denies.

Remote source files can be committed through GitHub integration; local git/npm network unavailable.
Full v0.4 ZIP is preserved and importer available; remote complete spec import must be verified separately.
No Q task marked DONE from this exception. B-001 submission REVIEW; owner/independent agent accepts evidence.

## B-002 — explicit additional exception, 2026-10-02
Owner requested a substantial complete offline block and explicitly answered
«Да, делай офлайн-блок» to the scope survey at 12:59 Asia/Bangkok.
This authorizes local persistent projects/scenes, owned image and already-created
narration uploads, FFmpeg MP4 assembly, preview/download/history/retry/cancel and
a labeled technical sample. It supersedes B-001's *stateless/no-editor* limits only
for this bounded single-user local workflow. See bootstrap/B002.json.
No AI/TTS/provider generation, new runtime packages, paid calls, public deployment,
production auth/tenant/database/queue decisions, Q gate acceptance or P1/P2 activation.
The existing denial of /api/generate remains. Unknown compute/assistant cost is null.
