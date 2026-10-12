# B-014 — durable local authorization coordinator / REVIEW

Base e3a2c066feb8b16aee94cfe7e991d04a39b4d4f9. First bounded block. Authority-store schema v3 replaces the simple consumption row with an operation record containing authorization/envelope hash, exact signed envelope, command ID, policy version, state and final registry receipt. States are `claimed`, `completed` and `stopped`.

The coordinator persists `claimed` before registry mutation. On success or deterministic rejection it stores the registry receipt as `completed`. A worker-outcome-unknown result remains `claimed`. After restart, pending operations can be listed and the persisted exact envelope replayed: registry idempotency resolves whether the command committed, then the coordinator records the receipt. Exact completed replay returns the stored receipt and does not mutate again.

This closes the local observability gap but is not one atomic transaction across databases and is not a production distributed outbox. Schema-v2 test stores are explicitly unsupported/recreated; no production migration is claimed.
