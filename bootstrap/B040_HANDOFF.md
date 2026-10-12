# B-040 — keyless local recovery after FFmpeg failure / REVIEW

The supplied `google-p0-002` manifest proves the complete paid provider sequence succeeded: one text call, three images and one TTS output. No provider reconciliation or retry is needed. FFmpeg failed because relative generated paths inside a concat file were resolved relative to that file's directory, duplicating path segments.

The adapter now resolves output roots to absolute paths and records sanitized FFmpeg stderr. `architect_google_spike.ts assemble` validates the existing manifest/assets, rejects symlinks/incomplete paid outputs, makes zero network calls, writes `result-recovered.mp4` without overwriting prior files and marks `localAssemblyRecovered`.

Scoped verification: 167 combined tests PASS; strict TypeScript PASS; Python workers compile; a forced FFmpeg failure recovered offline into an ffprobe-decodeable MP4 with provider call count unchanged. No additional paid call is authorized or required.
