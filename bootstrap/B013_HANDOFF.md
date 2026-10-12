# B-013 — persistent single-use authorization consumption / REVIEW

Second bounded block. Authority-store schema v2 persists an authorization ID once with its signed-envelope hash, command ID and policy version. First consumption requires the valid 15-minute window. Exact replay remains available after command expiry so a lost response can recover the registry command receipt; reuse of the same authorization ID for different content is rejected.

Consumption occurs before the registry mutation. A crash between those local databases leaves a claimed authorization, but exact replay can continue the same command; a changed command cannot use it. Registry command idempotency handles a crash after registry commit. This is recoverable local sequencing, not an atomic cross-database transaction or production outbox. Schema-v1 authority test stores are explicitly unsupported and must be recreated; no production migration is claimed.

Final scoped verification: strict TypeScript 7.0.2 PASS, three Python workers compile, and combined B-004 through B-013 tests are 107 PASS with zero failures/skips. Full checkout/project.py/make/CI/browser/live generation remain NOT_RUN. No paid action, Q-state change, deployment, publication or main merge occurred.

Next exact continuation: B-014 should persist a coordinator/outbox record connecting authorization consumption to registry receipt, expose claimed-but-unfinished operations after restart and reconcile them only by exact command replay. B-015 can then add bounded operator inspection/stop controls for those local pending operations.
