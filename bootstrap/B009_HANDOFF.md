# B-009 — signed local authority adapter / REVIEW

Second bounded block. `runAuthorizedRegistryCommand` verifies Ed25519 signatures over the complete command plus registry ID, policy version and principal ID. A strict policy maps pinned public keys to registrar/verifier/approver/security roles; the adapter injects the verified actor and rejects actor injection, wrong registry/policy, unsupported keys, invalid signatures and missing roles. Separate signed verifier and approver identities are exercised.

This is a local interface prototype, not production authentication. The policy object is still supplied by the trusted caller; it is not fetched from a protected policy store, connected to workspace identity, tenant-scoped, revocable or independently distributed. The compatibility `runRegistryCommand` path can bypass this adapter and therefore must not be exposed as a production boundary. No private key is stored or committed; tests generate ephemeral keys.

Final scoped verification: strict TypeScript 7.0.2 PASS, Python compile PASS, combined B-004 through B-009 suite 90 PASS with zero failures/skips. Full checkout and project-wide commands remain unavailable because private HTTPS clone lacks a noninteractive credential. `project.py`, `make spec-check`, `make check`, CI, browser, live generation and production identity are NOT_RUN.

Next exact continuation: B-010 must pin authority policy in protected persistent configuration with rotation/revocation, validity windows and registry audience; the worker-facing path must refuse caller-supplied replacement policy. Only after that and real workspace/tenant identity integration can the adapter be considered for a production auth boundary.
