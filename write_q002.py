import json, pathlib
p = pathlib.Path('handoffs/Q-002.json')
data = {
  "task_id": "Q-002",
  "agent": "cline/act (Claude Opus 5.5 via Cline)",
  "session": "2026-10-06T07:39:00+00:00",
  "branch": "not_available",
  "base_commit": "not_available",
  "work_commit": "pending",
  "summary": "Q-002 refresh 2026-10-06 zero spend: 9 official sources fetched, primary fal schnell 0.003/mpx UP + Google Gemini TTS (3.8-flash-lite-tts Kore) + OpenAI gpt-4o-mini-tts reserve, Opus 5.5 Director; AC1/AC2 pass with exact IDs/prices/regions/rights and explicit UNKNOWNs, AC3 not_run pending owner route/cost agreement. Google Live --live ~0.11 authorized but NOT executed — keys missing (env len 0).",
  "changed_files": [
    "reports/Q002_PROVIDER_RESEARCH_2026-10-06.md",
    "handoffS/Q-002.json"
  ],
  "evidence": [
    {
      "command": "fetch_web_content 9 official sources 2026-10-06",
      "exit_code": 0,
      "result": "pass",
      "artifact": "reports/Q002_PROVIDER_RESEARCH_2026-10-06.md",
      "notes": "ai.google.dev pricing/models/image-generation/speech-generation/available-regions; fal.ai flux/schnell + pricing; docs.anthropic.com pricing; platform.openai.com gpt-4o-mini-tts — fetched live, no keys"
    },
    {
      "command": "python -X utf8 scripts/project.py validate",
      "exit_code": 0,
      "result": "pass",
      "artifact": "reports/Q002_PROVIDER_RESEARCH_2026-10-06.md",
      "notes": "PASS spec/task/handoff/archive. Product/media NOT tested."
    },
    {
      "command": "env key lengths",
      "exit_code": 0,
      "result": "pass",
      "artifact": "reports/Q002_PROVIDER_RESEARCH_2026-10-06.md",
      "notes": "GOOGLE/GEMINI/FAL/ANTHROPIC all len 0 — live NOT_RUN, zero spend"
    },
    {
      "command": "preflight from google-live.ts",
      "exit_code": 0,
      "result": "pass",
      "artifact": "packages/architect/src/google-live.ts",
      "notes": "estimate 5000+3*33600+ceil(30/10)*1500=110300 micros USD 0.1103 < cap 250000 calls 5 strict +/-2s"
    }
  ],
  "ac_results": [
    {
      "id": "AC1",
      "result": "pass",
      "evidence": ["reports/Q002_PROVIDER_RESEARCH_2026-10-06.md"],
      "reason": "Each candidate: exact ID, official URL+checked_at 2026-10-06, price/unit, region/access, commercial label with explicit gaps."
    },
    {
      "id": "AC2",
      "result": "pass",
      "evidence": ["reports/Q002_PROVIDER_RESEARCH_2026-10-06.md"],
      "reason": "Duration/rounding/audio/ref/control/idempotency/cancel/retention documented or UNKNOWN for schema/account guarantees."
    },
    {
      "id": "AC3",
      "result": "not_run",
      "evidence": ["reports/Q002_PROVIDER_RESEARCH_2026-10-06.md"],
      "reason": "Primary/reserve proposed with illustrative costs (fal 0.018, Google 0.1103 within 0.25 +20% R=0.022) but owner agreement pending. No purchases."
    }
  ],
  "not_done": [
    "Owner AC3 agreement on route/cost/limitations",
    "Live account/region check and pinned ID availability (3.5 vs 3.8)",
    "Exact dims/voices/cancel-invoice/ACL approval",
    "No real-media/production certification"
  ],
  "risks": [
    "Pinned IDs may be deprecated vs 3.8 family — recheck live",
    "fal public URLs + IN_PROGRESS cancel may still bill",
    "Russia not in Google regions excerpt — account block possible",
    "Estimate != hard cap/invoice"
  ],
  "blockers": [
    "Q-002 AC3 pending owner confirm; do not accept/unblock Q-003",
    "Live spike authorized but blocked on env key install"
  ],
  "next_steps": [
    "Owner reviews 2026-10-06 report then explicitly confirms route",
    "After acceptance prepare Q-003 without spend",
    "When live authorized: set GOOGLE_API_KEY in shell env, run architect_google_spike --live, verify + store + invoice poll"
  ],
  "recommended_next_tasks": ["Q-003 only after Q-002 accepted"],
  "required_owner_checks": [
    "Agree primary/reserve for planning only including unknowns, zero execution",
    "Re-affirm per-run cap covers variance; authorize key via env not chat",
    "Keep neural video excluded until endpoint approved"
  ],
  "costs": {
    "known_usd": 0,
    "notes": "No provider calls. Preflight 0.1103 within 0.25. Illustrative costs not a quote."
  }
}
# fix key typo
data["changed_files"] = ["reports/Q002_PROVIDER_RESEARCH_2026-10-06.md", "handoffs/Q-002.json"]
p.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print("written", p, "len", len(p.read_text(encoding="utf-8")))
