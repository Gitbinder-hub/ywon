# ADR 0008 — Editor / renderer choice (Q-039 P2)

Decided 2026-10-08 for P2 bounded prototype. Candidate libraries spike (fabric.js/canva-kit/konva, timeline-kit) license/size/mobile/performance checked offline; chosen interactive editor: **own canvas overlay model + timeline model** via `packages/editable-document` contract, not FFmpeg as frontend. FFmpeg remains server-side compositor/renderer only.

Spike scope: 2 deps pinned, license MIT/Apache-compatible, bundle <200 KiB overlay logic, mobile drag→numeric fallback, parity golden fixtures will compare editor JSON → renderer output hashes. FFmpeg never presented as browser editor.

Pinned fonts/renderer: `r1` via `packages/editable-document/src/renderer.ts` (fonts font-a/b/c/Inter/Roboto), max canvas 8192, timebase ms/sRGB. Server renderer uses same grammar; tolerance declared via golden exports.

Unsupported effects: arbitrary HTML/scripts/remote URLs, native tracking-follow, generative video-edit — explicitly limited, not silent degrade. Local edit has no paid API cost; render cost visible via cost-visibility before submit.

Status: accepted for P2 prototype. Exact tool choice separate ADR to be updated when production library pinned.
