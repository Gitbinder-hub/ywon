# B-050 — fail-closed production media boundary / REVIEW

Adds `media-boundary.ts`, an offline CLI, two fixtures and proposed ADR 0005. This is a typed contract for later P1 implementation, not a cloud integration.

Ingest accepts only exact bounded asset/workspace/project IDs, kind, SHA-256, bytes, allowlisted MIME and retention policy. It derives the tenant-scoped object key and returns `quarantine_required`; no upload is authorized. Caller object keys, paths, states, signed URLs and success flags are unknown fields and fail closed.

Delivery evaluation checks tenant consistency, authenticated actor, role, current verified state, clean scan, approved rights, active retention, deletion state and 60–900 second TTL. Publication upload additionally requires publisher role and a separate approval ID. Passing all fixture checks yields only `ready_for_authorized_signer`; `signedUrl=null`, `receiptCurrent=false`, and all authority flags stay false because a future server signer must re-read authenticated durable state.

Seven tests cover derivation, MIME/size bounds, no-access signer readiness, each blocker class, separate publication approval, injection refusal and actual CLI behavior. Available partial suite is 181/181 PASS; scoped strict TypeScript 5.9.3, CLI syntax and four Python workers pass. Full checkout/pinned toolchain/CI and every real infrastructure component remain NOT_RUN.

Next implementation gate is no longer another bootstrap file route. Select and approve P1 auth, Postgres/queue and private object-storage ADRs, then implement authenticated tenant-scoped persistence/quarantine/scanning before any signer or media delivery.
