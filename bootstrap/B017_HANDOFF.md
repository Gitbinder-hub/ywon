# B-017 — bounded authority operations CLI / REVIEW

Adds `scripts/architect_authority_ops.ts` with list/get/replay/stop modes. Inputs and IDs are bounded; stop consumes a previously signed stop JSON file and never handles a private key. Replay loads only the persisted exact envelope for a claimed operation and uses existing authorization/registry idempotency.

Actual process tests cover list/get, restart replay to completed and a current signed stop file. The CLI is an offline inspection tool, not a production admin surface, scheduler or autonomous retry loop.
