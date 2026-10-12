# B-022 — persisted approval invalidation / REVIEW

Plan revision, recovery proposal, stop and financial uncertainty clear the persisted approval. A read-side check additionally blocks expired approval, current registry drift/revocation/expiry, changed budget snapshot, changed admission binding, active recovery or uncertainty.

Tests cover revision invalidation, unknown-paid recovery invalidation, approval expiry and post-approval capability revocation. No automatic reapproval or execution is possible.
