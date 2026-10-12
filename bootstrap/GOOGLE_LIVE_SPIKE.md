# Google Gemini P0 live spike

This is a bounded paid evaluation path, not production routing. It uses fixed low-cost models:

- text/script: `gemini-3.5-flash-lite`;
- image: `gemini-3.1-flash-lite-image` at 1K;
- speech: `gemini-3.8-flash-lite-tts`;
- local assembly: FFmpeg H.264/AAC MP4.

The adapter makes no automatic provider retry. A timeout or malformed response leaves an `unknown` manifest for inspection. Each run allows 1–3 images, 10–60 seconds, a maximum five provider calls and an explicit per-run `maxEstimatedUsdMicros`. The estimate is a conservative preflight, not a provider invoice.

## Secret setup

Create or select a dedicated Gemini API key in Google AI Studio, restrict it to Gemini API, and configure a Google Cloud billing alert. Never paste the key into chat or commit it. In a local terminal:

```bash
read -s GEMINI_API_KEY
export GEMINI_API_KEY
```

`GOOGLE_API_KEY` is also supported and takes precedence if both are set.

## Inspect without spending

```bash
node scripts/architect_google_spike.ts plan \
  --input bootstrap/fixtures/B036-google-live.json
```

Confirm `withinCap: true`, exact models, call count and the estimated maximum. Planning never reads the key and never calls Google.

## Explicit paid run

Only after the owner approves the per-run cap and test content:

```bash
node scripts/architect_google_spike.ts run --live \
  --input bootstrap/fixtures/B036-google-live.json \
  --output-root outputs/google-p0
```

A unique `runId` is mandatory. The run directory is created exclusively and will not be overwritten. It contains script JSON, exact generated images, narration WAV, MP4 and a manifest with hashes and completed-call records. Do not blindly rerun an `unknown` result; inspect the manifest and provider console first.

Official sources used for the route and API shape:

- https://ai.google.dev/gemini-api/docs/api-key
- https://ai.google.dev/gemini-api/docs/pricing
- https://ai.google.dev/gemini-api/docs/image-generation
- https://ai.google.dev/gemini-api/docs/generate-content/speech-generation.md

## Open the private preview from GitHub Codespaces (B-047)

The server accepts localhost and the one exact private Codespaces forwarding host derived from `CODESPACE_NAME`, `PORT`, and `GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN`. It does not allow arbitrary `*.app.github.dev` hosts or cross-origin requests. Open port 3000 from the Codespaces **Ports** tab, then append `/studio?verifiedRun=google-p0-002` to that forwarded HTTPS URL. Directly typing `127.0.0.1` into VS Code Simple Browser can point at the wrong network namespace.

## Export a linked project's sanitized evidence (B-048)

After a verified receipt is attached to a local project:

```bash
curl -s http://127.0.0.1:3000/api/offline/projects/PROJECT_ID/evidence | python3 -m json.tool
curl -OJ http://127.0.0.1:3000/api/offline/projects/PROJECT_ID/evidence?download=1
```

The endpoint rechecks the current B-043 receipt and its hashes before emitting a canonical evidence hash. It excludes title, script, scenes, media, local paths, invoice, rights approval, production readiness and publication authority.

## Open or download project evidence from Studio (B-049)

After a verified result is attached, Studio shows **Открыть evidence JSON** and **Скачать evidence JSON**. Both use the relative same-origin B-048 route for the current immutable project ID. They remain hidden before attachment and do not expose media, filesystem paths, generation, execution or publication actions.
