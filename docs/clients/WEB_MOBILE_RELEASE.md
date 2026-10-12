# Адаптивный веб + Android/iOS к публичному релизу

## Направление владельца и граница
Responsive web starts P2. Android and iOS promoted from unscheduled FUTURE to explicit public-release
scope P6, not mandatory for private P0–P3 tests. Public release target includes both stores, subject to
security/usability/billing/store review gates; no invented dates and no guaranteed store acceptance.
Internal pilot, web beta and public all-client release are different labels. Missing client must not be
hidden behind «полный релиз»: owner may explicitly approve labeled staged launch and record waiver/risk.

## Options and recommendation
1. Responsive PWA: best reuse/fast first UX, installable where supported; not itself Android/iOS store apps.
2. Shared web editor + native shell (Capacitor-class): candidate default for low duplication;
   integrate camera/files/share/deep links/push/auth securely; prove WebView canvas/timeline performance.
3. Cross-platform native client (React Native-class) + shared API/contracts: better native UI potential,
   more editor adaptation/maintenance; escalate only if wrapper fails measured gates.
No dependency selected by this spec. Q-046 ADR prototype on real Android/iOS and supported OS/device matrix.
Bare website wrapper is not assumed store-compliant; official rules checked at submission (no current claim).

## Full workflow, not desktop UI on small screen
Mobile user can onboard/chat/import, inspect estimate, generate, receive progress, review,
edit text/layers/clip trims/subtitles, approve/export, manage plan/stop and continue on desktop.
Advanced capabilities exposed in focused panels or intentional progressive release, not fake unavailable controls.
Full project/state/output quality shared; usability differs by device. Heavy AI/render runs server-side.
Server jobs continue when app sleeps/killed; push/deep link checks permission/current artifact version.
Proxies/thumbnail virtualization, touch/numeric controls, low-memory cleanup, orientation/resume tests.
Large uploads resumable where implemented, network loss explicit. Do not promise unlimited background
upload or offline AI generation. Offline edits only supported local operations with conflict-safe sync.

## Security and commercial distribution
System auth flow/safe token storage, OAuth return URLs/PKCE, signed media access, tenant isolation;
no production API keys inside bundle. Push previews do not leak private content on lock screen by default.
Store requirements: official Apple/Google review, digital purchases/credits/subscriptions/payment rules,
AI moderation/disclosure/privacy/account deletion/permissions, regional exceptions, test accounts and fees.
BYOK/external generation payment is not assumed exemption from store billing rules; evaluate per model/region.
Shared backend billing ledger; avoid duplicate charges across web/store. Fees/compliance costs visible.
Public no-ad-budget strategy does not erase store/service/support costs.

## Acceptance
Q-046: chosen approach + real app packages/security/auth/upload/deep links, backend same project.
Q-047: ordinary users on both platforms complete full key workflow, offline/reconnect/resume/conflict,
proxy/final parity, a11y, crash/memory/network tests, current official store/billing/privacy preflight evidence.
Q-049G: accepted Q-035G/Q-045/Q-047, store availability or explicit approved staged-launch waiver,
known limits/support/pricing and release languages disclosed. Spec tests ≠ app/device/store tests.
