# B-008 — hardened local capability registry / REVIEW

Base e55ba82afedfb7196cfe6c7783938166e17d6a21. First of this pass's two bounded blocks. Registry schema v2 validates capability fields before persistence, verifies a per-record hash-linked event chain and projection on every read/mutation, protects events and receipts with append-only triggers, identifies its SQLite application/schema and fails closed around first-create races and retained initialization locks.

Tests cover malformed capabilities, event/projection tampering, append-only enforcement, foreign/old schema rejection, concurrent first writers and retained init locks. A race exposed during the first run was fixed by checking an existing init lock before opening an incompletely initialized database.

Schema-v1 registry files from B-006 are deliberately rejected rather than silently migrated. They contain only offline test declarations and must be recreated from reviewed source declarations. This is not an acceptable production migration policy. The database owner can still drop triggers and rebuild history; hashes are detection under the writer contract, not external notarization.

No execution, payment, provider, generation, deploy, publication, Q-state change or owner acceptance was added.
