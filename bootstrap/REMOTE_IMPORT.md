# Full v0.4 migration — COMPLETE / verified 2026-10-02

Owner normal commit `6fbb5d8c6de6566773a541ecb51a221e9803fb14` imported the full tree into
`bootstrap/spec-v04-foundation`, preserving GitHub ancestry. All root entry hashes match the tested full project.
No further importer/ZIP overlay is needed. Old transfer-manifest expected HEAD `123b25f...` is intentionally obsolete;
do not change its expected_head to bypass the guard or rerun it over the current worktree.

Evidence: bootstrap/evidence/2026-10-02-import-verification/. Main unchanged; PR #1 draft/unmerged.
B-001 REVIEW and product gates unchanged. GitHub CI is unknown (check-run read HTTP403).

The original approved-source-ZIP importer and transfer runner remain tools/history, not instructions to rerun:
- Original Ywoom-Spec-v0.4.zip SHA256: 13a7e15d52aa38f994f81049c2e67be506d1c7b10be2daaa1c5d9b7f5d7b85fb.
- Historical prerequisite/instructions are preserved in previous commits/handoffs.
- Future migrations need fresh source/HEAD verification and backups; never synthetic-history or force push.
