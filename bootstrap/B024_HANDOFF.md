# B-024 — single-use offline attempt preparation / REVIEW

State-store schema v3 adds append-only attempt receipts. A current persisted plan approval can prepare exactly one attempt ID bound to approval ID, unit/revision and admission hash. Reusing the approval for another attempt or reusing an attempt ID is rejected transactionally.

The stored object is explicitly `offline_attempt_preparation` with `executionAllowed=false` and `budgetReserved=false`. It is not a provider request, queue job, financial reservation or permission to execute. Older local prototype stores are recreated, not silently treated as production migrations.
