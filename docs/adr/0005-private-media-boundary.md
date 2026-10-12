# ADR 0005: private tenant-scoped media boundary

Status: proposed contract direction for P1; no provider or infrastructure selected.

## Context

ADR 0001 retains a modular TS monolith, Postgres data/queue and object storage, while exact P1 stack selection remains pending. The data model requires tenant-owned assets with hash, byte size, license/consent provenance, retention and availability. Security requirements require tenant-scoped keys and download checks, untrusted-media limits/sandboxing, deletion/retention behavior and no public upload without approval. Generation/export approval and publication permission remain independent.

The B-035–B-049 live spike proves a narrow local generation/evidence path. Its files, SQLite receipt store and localhost/Codespaces UI are not a production media service and must not be promoted by adding public file routes.

## Decision

Adopt a two-stage server-owned boundary contract before choosing a storage vendor:

1. **Ingest planning** accepts bounded tenant/project/asset identity, media kind, exact SHA-256, byte size, allowlisted MIME and retention-policy ID. The server derives the object key. The first state is always `quarantine_required`; caller-supplied object keys/status/URLs are rejected.
2. **Delivery evaluation** requires authenticated actor/workspace binding, current asset version/hash, `verified` state, clean scan, approved rights, active retention, non-deleted state, bounded 60–900 second TTL, role and separate publication approval where applicable.
3. A successful evaluation is only `ready_for_authorized_signer`. This module never creates a signed URL and never sets delivery/publication/execution true. A future authenticated server-side signer must re-read current durable state immediately before signing.
4. Preview/download and publication-upload are distinct purposes. Publication requires publisher role plus a separate approval ID; generation or project approval cannot substitute.
5. Object storage is private. Quarantine and verified namespaces/buckets, scanner identity, signer identity, audit events, deletion/retention jobs, backup/restore and tenant-consistent database constraints are production implementation requirements.

## Consequences

The contract can be tested without credentials, cloud resources, public networking or purchases. It blocks path injection, public-by-default objects, stale caller assertions and accidental publication coupling. It does not prove any vendor, authentication system, scanner, database, queue, signed-URL implementation, deletion process or restore objective. Those remain P1 ADR/implementation work and owner-gated product tasks.
