# B-047 — exact private Codespaces preview origin / REVIEW

The owner could curl the B-044 API inside the Codespace, proving the server and receipt database were healthy, but manually entering `http://127.0.0.1:3000` in VS Code Simple Browser reached a different browser-side network namespace and showed connection refused.

`isAllowedPreviewRequest` now centralizes the preview boundary. It permits existing localhost/127.0.0.1 HTTP same-origin access and, only when Codespaces runtime variables are present, the exact `https://${CODESPACE_NAME}-${PORT}.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}` host. Arbitrary forwarding subdomains, suffix lookalikes, wrong port, HTTP downgrade and foreign Origin remain denied. This is private-preview compatibility, not production authentication; the port must remain private.

Two focused security tests PASS and scoped strict TypeScript 5.9.3 PASS. Changed API files pass syntax. Full complete-checkout API/browser/CI and actual owner forwarded URL remain NOT_RUN until the owner pulls and restarts.

Owner flow: pull, restart the server, open the **Ports** tab, ensure port 3000 is Private, choose **Open in Browser**, and append `/studio?verifiedRun=google-p0-002` to the forwarded HTTPS URL.
