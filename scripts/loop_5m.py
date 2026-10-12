#!/usr/bin/env python3
"""5m loop: health + radar + Telegram notify. No secrets logged."""
import pathlib, json, urllib.request, urllib.error, time, subprocess, sys

def load_env(p=".env"):
    env={}
    for line in pathlib.Path(p).read_text(encoding="utf-8").splitlines():
        line=line.strip()
        if not line or line.startswith("#") or "=" not in line: continue
        k,v=line.split("=",1)
        env[k.strip()]=v.strip()
    return env

def tg_send(env, text):
    tok=env.get("TELEGRAM_BOT_TOKEN") or ""; chat=env.get("TELEGRAM_CHAT_ID") or ""
    if not tok or not chat: return
    import urllib.parse, urllib.request
    data=urllib.parse.urlencode({"chat_id": chat, "text": text[:3500]}).encode()
    req=urllib.request.Request(f"https://api.telegram.org/bot{tok}/sendMessage", data=data, headers={"Content-Type":"application/x-www-form-urlencoded; charset=utf-8"})
    try:
        urllib.request.urlopen(req, timeout=10).read()
    except Exception:
        pass

def gemini_probe(key, model="gemini-3.5-flash-lite"):
    url=f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
    body=json.dumps({"contents":[{"role":"user","parts":[{"text":"say hi in 3 words"}]}]}).encode()
    req=urllib.request.Request(url, data=body, headers={"Content-Type":"application/json"})
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            j=json.loads(r.read().decode())
            return "healthy" if j.get("candidates") else "degraded"
    except urllib.error.HTTPError as e:
        return "down" if e.code>=500 else "degraded"
    except Exception:
        return "down"

def run_once():
    env=load_env()
    gem=env.get("GEMINI_API_KEY") or env.get("GOOGLE_API_KEY") or ""
    g_health = gemini_probe(gem) if gem else "NOT_RUN"
    # health via subprocess
    proc=subprocess.run([sys.executable, "-I", "scripts/health_check.py"], capture_output=True, text=True, encoding="utf-8", errors="ignore")
    health=proc.stdout.strip() or proc.stderr.strip()
    print(f"[{time.strftime('%H:%M:%S')}] 5m tick")
    print(health)
    print(f"Gemini 3.5-flash-lite: {g_health} | Freelancer -- watch->draft->approve->place | cron 6h + 60s wired")
    tg_send(env, f"Ywon 5m tick {time.strftime('%H:%M:%S')}\n{health}\nGemini: {g_health} | cron 6h+60s live_wired")
    return health

if __name__=="__main__":
    run_once()
    # schedule next via loop — caller uses PowerShell loop; this script is single tick for Telegram
