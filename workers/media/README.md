# workers/media

Local ffprobe prototype.

## Public API
python3 workers/media/probe.py LOCAL_FILE.

## Invariants
Local files only; no shell; size cap and timeout; no production sandbox claim.

Scope: B-001 only; remaining features require Q tasks and owner gates.
