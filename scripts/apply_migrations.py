#!/usr/bin/env python3
"""Apply infra/migrations/*.sql to DATABASE_URL from .env — idempotent via IF NOT EXISTS / ON CONFLICT."""
import pathlib, sys

def load_env(path=".env"):
    env={}
    try:
        for line in pathlib.Path(path).read_text(encoding="utf-8").splitlines():
            line=line.strip()
            if not line or line.startswith("#") or "=" not in line: continue
            k,v=line.split("=",1)
            env[k.strip()] = v.strip()
    except FileNotFoundError:
        pass
    return env

def main():
    env = load_env()
    url = env.get("DATABASE_URL") or __import__("os").environ.get("DATABASE_URL")
    if not url:
        print("DATABASE_URL not found in .env nor env", file=sys.stderr)
        sys.exit(2)
    try:
        import psycopg2
    except ImportError:
        print("psycopg2 not installed", file=sys.stderr)
        sys.exit(2)
    mig_dir = pathlib.Path("infra/migrations")
    files = sorted(mig_dir.glob("*.sql"))
    if not files:
        print("no migrations", file=sys.stderr); sys.exit(2)
    conn = psycopg2.connect(url, connect_timeout=10)
    conn.autocommit = False
    cur = conn.cursor()
    for p in files:
        sql = p.read_text(encoding="utf-8")
        try:
            cur.execute(sql)
            conn.commit()
            print(f"{p.name} OK")
        except Exception as e:
            conn.rollback()
            print(f"{p.name} FAIL: {e}", file=sys.stderr)
            sys.exit(1)
    cur.execute("select tablename from pg_tables where schemaname='public' order by tablename;")
    print("tables:", ", ".join(r[0] for r in cur.fetchall()))
    conn.close()

if __name__ == "__main__":
    main()
