# P0 owner approval — TEMPLATE, not approved
APPROVED: NO
Owner:
Date:
Task: Q-001
Accepted spec: 0.3.0; first scope: narrated explainer 30–60 seconds; manual review.
Live-eval cap (amount/currency/period):
Development cap:
Allowed providers/actions:
Supported pilot language(s)/voice/materials:
Stop conditions/max attempts:
Rights/consents:
Allowed storage/output retention:
Unresolved decisions and constraints:

Copy to reports/P0_APPROVAL.md, fill all choices. Only owner changes APPROVED to YES after review.
Then `python3 scripts/project.py gate Q-001 --by Oleg --evidence reports/P0_APPROVAL.md --note "accepted limits and scope" --owner-confirmed`.
The command records your decision and all gate AC as confirmed; it does not authenticate owner or grant API access.
Zero spend is permitted but blocks live production until a separately recorded approved budget update.
