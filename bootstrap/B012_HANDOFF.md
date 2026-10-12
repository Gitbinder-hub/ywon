# B-012 — time-bound signed registry commands / REVIEW

Base c94814b9a2ce533396c64c657dda8a2df7c663af. First bounded block. Adds a signed envelope that covers registry audience, exact authority-policy version, principal, fixed mutation purpose, authorization ID, issued/expiry timestamps and the complete command. Windows are positive and capped at 15 minutes. A trusted code-level clock rejects not-yet-valid and expired commands; request content cannot choose the evaluation time.

Actor injection, wrong audience, role mismatch, malformed time windows and any signed-field mutation fail closed. This is authorization for local registry mutation only; it does not authorize provider execution, money, publishing or generation.
