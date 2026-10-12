# B-001 actual checks
Local environment: Node24.14.1, Python3.13.14, TS7.0.2, Node typings18.19.130, ffprobe available.
make check: strict typecheck, JS syntax, 12 Node + 3 Python media + 44 full-pack spec tests passed; no local skips.
Additional smoke: actual CLI startup/health/UI; approved ZIP importer conflict preflight/code retention/output hash checks.
Source app/API/importer blobs match remotely uploaded tested content (JSON formatting may differ elsewhere).
GitHub CI check status not readable:403. No remote success claim.
See raw logs and HANDOFF.md for unrun checks, pending migration and provisional toolchain.
