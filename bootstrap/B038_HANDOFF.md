# B-038 — Google image HTTP 400 reconciliation / REVIEW

The user-supplied manifest shows `google-p0-001` completed the text call and received HTTP 400 on the first image request. No image, TTS or MP4 completed. Because the old adapter discarded Google's error body, the exact provider complaint cannot be recovered locally; check Google usage/billing for the text charge.

The image call now uses the minimal official Interactions shape: model, string input, and `response_format` with only image type/aspect ratio. Optional `mime_type` and `image_size` were removed as likely incompatibilities. HTTP 4xx now produces `rejected_check_manifest` with sanitized status/code/message rather than an ambiguous unknown. Secrets are redacted and no automatic retry occurs.

Scoped verification: 166 combined tests PASS, strict TypeScript PASS, Python workers compile, mocked image/TTS still assemble a decodeable MP4. No second paid run was made. A fresh run ID and explicit owner authorization are required for another attempt.
