# B-021 — persisted single-use plan approval / REVIEW

State-store schema v2 adds append-only approval receipts. Before persistence, the bridge reloads the unit, revalidates the current registry admission and verifies the signed approval against the persisted plan and budget. Approval and unit event commit in one local state-store transaction. Reusing an approval ID under a fresh command is rejected.

The unit remains `planned`; approval does not introduce approved/running execution states and never reserves budget. Old local schema-v1 state databases are explicitly unsupported/recreated, not silently migrated as production data.
