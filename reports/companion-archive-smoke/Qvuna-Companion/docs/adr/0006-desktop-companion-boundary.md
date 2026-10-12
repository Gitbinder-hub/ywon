# ADR 0006 — detachable Desktop Companion, one Qevunara core

Статус: accepted design direction by A-20261005; not implemented/client release. Date 2026-10-05.

Decision: Factory and Companion are independent execution adapters using canonical contracts/planning/policy/budget semantics. Authoritative server scopes/ledger remain server-side; local SQLite journal is not a SaaS database copy. Companion owns no unbounded shared memory or cloud admin secret. Outbound authenticated protocol, explicit device pairing/revocation, capability negotiation and pinned jobs. Disconnected/removed desktop cannot halt independent Factory jobs.
First target Windows10/11 x64; Linux/macOS follow Windows pilot with separate capability/permission/signing/evidence matrices. Portable core != universal GUI support. Official API social publishing remains Factory responsibility and separately activated; browser publisher not Companion pilot requirement.
Alternatives rejected: clone whole Factory to laptop (drift/resources/secrets); standalone fork Architect (inconsistent guards); direct laptop DB access (tenant/secret exposure); shared unbounded memory (privacy/authority leakage); service-as-admin for every action (unnecessary power).
Consequences: additional versioned device transport and OS adapters, offline leases/reconciliation, update/migration matrix, shared skill review. Desktop UI framework/installer/auth provider remain separate choices. Single-core contract tests mandatory; no claim exactly-once external action from lease alone.
Canonical details: docs/architecture/DESKTOP_COMPANION.md. Implementation transitions: docs/governance/IMPLEMENTATION_TRANSITIONS.md. This ADR does not override production phase gates or approve public distribution.
