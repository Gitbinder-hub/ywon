# B-015 — pending-operation inspection and signed stop / REVIEW

Second bounded block. Local APIs list at most 100 claimed operations and inspect one operation by authorization ID, including the exact signed envelope needed for controlled replay. A current `security_reviewer` may issue a separate Ed25519-signed, maximum-15-minute stop command bound to registry, policy version, operation ID and reason.

Stop is terminal for the local coordinator: stopped operations disappear from pending results and registry replay through the coordinator is denied. Registrar cannot stop; changing the signed reason invalidates the signature; completed operations cannot be retroactively stopped. Stop does not cancel or refund any external work—none exists in this prototype.

Final scoped verification: strict TypeScript 7.0.2 PASS, all three Python workers compile, and combined B-004 through B-015 tests are 113 PASS with zero failures/skips. Two existing replay assertions initially exposed that capability-registry receipts use `record`, not state-store `state`; coordinator replay handling was corrected without weakening assertions. Full checkout/project.py/make/CI/browser/live generation remain NOT_RUN.

Next exact continuation: B-016 should give coordinator state changes their own append-only hash-linked operation event history and verify operation projections on every list/get/mutation. Current policy history is protected, but operation rows themselves are not yet independently hash-chained.
