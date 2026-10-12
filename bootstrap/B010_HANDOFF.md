# B-010 — persisted root-signed authority policy / REVIEW

Base 90d0a56cfc4c2412def0b51f0c8eadb86ea984a3. First bounded block. Adds `authority_store.py` and `authority-store.ts`: a separate SQLite policy projection with hash-linked append-only events/receipts, optimistic versions and exact command replay. Bootstrap must match an out-of-band SHA-256 fingerprint of an Ed25519 root. Every rotation is signed by the current root; the next root may be rotated in that signed policy while the original anchor fingerprint remains fixed.

Policies carry registry audience, policy version, validity window and exact principal public keys/roles. Removed principals are absent from the next version. Malformed root/principal keys, wrong anchor, bad root signature, stale rotation and projection corruption fail closed. Private keys are generated only in tests and never stored.

This remains a local prototype. The anchor fingerprint must ultimately come from protected deployment configuration or an equivalent trust channel; passing it from arbitrary request data would nullify the trust model. No SSO, tenant IAM, HSM/KMS, production migration, provider call, payment, generation, deploy or Q acceptance is included.
