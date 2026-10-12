# B-011 — pinned authority-policy registry path / REVIEW

Second bounded block. `runPinnedAuthorizedRegistryCommand` loads the current policy from the integrity-checked authority store; the caller cannot supply a replacement policy. It verifies the pinned bootstrap anchor, registry audience, exact current policy version, active validity window, principal membership/role and the existing complete-command Ed25519 signature before registry mutation.

Time is obtained from a trusted code-level clock dependency, not from command/request content. Tests inject a deterministic clock; production must supply a protected system clock. Policy rotation immediately rejects old policy versions and removed principals. Existing compatibility adapters remain callable by trusted local tests and therefore the package is still not a production service boundary.

Final scoped verification: strict TypeScript 7.0.2 PASS, three Python workers compile, and combined B-004 through B-011 tests are 99 PASS with zero failures/skips. Initial policy tests exposed test fixtures leaking private-key fields into public policy records; fixtures were corrected and strict key validation added. Full checkout/project.py/make/CI/browser/live generation remain NOT_RUN.

Next exact continuation: B-012 should add signed command issued/expiry times, purpose/audience binding and one-time authorization consumption tied to command ID and policy version. Delayed signed commands must fail after their narrow window even if the wider policy is still active.
