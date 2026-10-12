#!/usr/bin/env python3
"""Live health checks: DB + S3 + Telegram + Freelancer + Gemini — no secrets logged."""
import pathlib, json, urllib.request

def load_env(p=".env"):
    env={}
    for line in pathlib.Path(p).read_text(encoding="utf-8").splitlines():
        line=line.strip()
        if not line or line.startswith("#") or "=" not in line: continue
        k,v=line.split("=",1)
        env[k.strip()]=v.strip()
    return env

def check_db(env):
    try: import psycopg2
    except ImportError: return "NOT_RUN (psycopg2 missing)"
    url=env.get("DATABASE_URL")
    if not url: return "NOT_RUN"
    try:
        c=psycopg2.connect(url, connect_timeout=8)
        cur=c.cursor()
        cur.execute("select version()")
        ver=cur.fetchone()[0].split(",")[0]
        cur.execute("select count(*) from pg_tables where schemaname='public'")
        n=cur.fetchone()[0]
        c.close()
        return f"PASS ({ver}, {n} tables)"
    except Exception as e: return f"FAIL {e}"

def check_s3(env):
    try:
        import boto3
        from botocore.config import Config
    except ImportError: return "NOT_RUN (boto3 missing)"
    ep=env.get("S3_ENDPOINT"); b=env.get("S3_BUCKET")
    ak=env.get("S3_ACCESS_KEY_ID"); sk=env.get("S3_SECRET_ACCESS_KEY")
    if not all([ep,b,ak,sk]): return "NOT_RUN"
    try:
        s=boto3.client("s3", endpoint_url=ep, aws_access_key_id=ak, aws_secret_access_key=sk, region_name="auto", config=Config(signature_version="s3v4"))
        s.put_object(Bucket=b, Key="healthcheck/live.txt", Body=b"ok")
        s.get_object(Bucket=b, Key="healthcheck/live.txt")
        s.delete_object(Bucket=b, Key="healthcheck/live.txt")
        return "PASS (put/get/delete healthcheck/live.txt)"
    except Exception as e: return f"FAIL {e}"

def check_tg(env):
    t=env.get("TELEGRAM_BOT_TOKEN") or ""; ch=env.get("TELEGRAM_CHAT_ID") or ""
    if not t or not ch: return "NOT_RUN"
    try:
        with urllib.request.urlopen(f"https://api.telegram.org/bot{t}/getMe", timeout=8) as r:
            j=json.loads(r.read().decode())
            return f"PASS (@{j['result']['username']})" if j.get("ok") else f"FAIL {j}"
    except Exception as e: return f"FAIL {e}"

def check_freelancer(env):
    tk=env.get("FREELANCER_ACCESS_TOKEN") or ""
    if not tk: return "NOT_RUN"
    try:
        req=urllib.request.Request("https://www.freelancer.com/api/users/0.1/self", headers={"freelancer-oauth-v1": tk})
        with urllib.request.urlopen(req, timeout=10) as r:
            j=json.loads(r.read().decode())
            return f"PASS ({j['result']['id']} {j['result']['username']})"
    except Exception as e: return f"FAIL {e}"

def check_gemini(env):
    k=env.get("GEMINI_API_KEY") or env.get("GOOGLE_API_KEY") or ""
    if not k: return "NOT_RUN"
    try:
        with urllib.request.urlopen(urllib.request.Request("https://generativelanguage.googleapis.com/v1beta/models?key="+k), timeout=8) as r:
            j=json.loads(r.read().decode())
            return f"PASS ({len(j.get('models',[]))} models)"
    except Exception as e: return f"FAIL {e}"

if __name__=="__main__":
    env=load_env()
    print("DB:        ", check_db(env))
    print("S3:        ", check_s3(env))
    print("Telegram:  ", check_tg(env))
    print("Freelancer:", check_freelancer(env))
    print("Gemini:    ", check_gemini(env))
