# Companion protocol — B-051 local subset

One shared typed contract for the bounded owner pilot: LocalTask/LocalGrantInput/FileRef, strict field validation, portable filenames, canonical hashes and fixed local.file-inventory v1. Not the complete future device/lease/transport protocol from docs/architecture/DESKTOP_COMPANION.md; no pairing/auth/grants from the SaaS. Extra caller permissions/success flags, paid cost, unknown skill/version and duplicate files are denied.
`costMinor:0` means no external billable action in this pilot, NOT measured free electricity/CPU. Production budget/permission semantics remain in existing core; do not fork them here. UI/OS/transport adapters consume this contract, not model prose.
Transition TR-05: current typed local subset→authenticated companion transport with server-issued device grants. Owner mapping Q-006/Q-008/Q-044 for design; full implementation remains separately decomposed/gated, not accepted by B-051. No dual mission registry.
