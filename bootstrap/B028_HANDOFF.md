# B-028 — derived offline reservation intent / REVIEW

State-store schema v4 derives one reservation intent from persisted plan and prepared attempt: initial estimate, unit/effective cap, admission hash and exact attempt binding. Caller success/reserved flags are not accepted. One attempt cannot create two intents.

The intent always has `executionAllowed=false` and `budgetReserved=false`. It is a request-shaped local record, not a ledger operation or monetary hold. Protected budget packages were not modified.
