# B-035 — pinned Google provider route / REVIEW

Pins the bounded P0 route to `gemini-3.5-flash-lite` for structured script, `gemini-3.1-flash-lite-image` for 1K images and `gemini-3.8-flash-lite-tts` for narration. The API key is read only from `GOOGLE_API_KEY`/`GEMINI_API_KEY`, sent only in `x-goog-api-key`, never accepted as an argument or written to manifests. A conservative per-run estimate and explicit cap block calls before any side effect.

Prices and request shapes were checked against current official Google documentation. This is provider selection for a bounded evaluation, not production certification or an accepted Q-002 result. Actual model availability, billing and output quality still require the live run.
