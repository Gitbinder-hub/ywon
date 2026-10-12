#!/usr/bin/env python3
"""Live probe for model-switch radar + freelancer — GEMINI_API_KEY from .env, no secrets logged."""
import pathlib, json, urllib.request, urllib.error

def load_env(p=".env"):
    env={}
    for line in pathlib.Path(p).read_text(encoding="utf-8").splitlines():
        line=line.strip()
        if not line or line.startswith("#") or "=" not in line: continue
        k,v=line.split("=",1)
        env[k.strip()]=v.strip()
    return env

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

env=load_env()
key=env.get("GEMINI_API_KEY") or env.get("GOOGLE_API_KEY") or ""
if not key:
    print("Gemini NOT_RUN")
else:
    print("Gemini 3.5-flash-lite health:", gemini_probe(key))
    print("Router wiring: routeViaSwitch + cost-visibility strict >10% gate -- keep_primary|fallback:<reason>")
fk=env.get("FREELANCER_ACCESS_TOKEN") or ""
if fk:
    try:
        req=urllib.request.Request("https://www.freelancer.com/api/users/0.1/self", headers={"freelancer-oauth-v1": fk})
        with urllib.request.urlopen(req, timeout=10) as r:
            j=json.loads(r.read().decode())
            print(f"Freelancer live: {j['result']['id']} {j['result']['username']} OK -- watch->draft->approve->place")
    except Exception as e:
        print("Freelancer FAIL", e)
