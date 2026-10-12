"""B-043 local SQLite store for sanitized verified-artifact receipts. Not production storage."""
import hashlib, json, os, re, sqlite3, sys
from pathlib import Path
APP_ID=0x51564D4C
SCHEMA=1
MAX_REQUEST=128*1024
ID=re.compile(r"[A-Za-z0-9][A-Za-z0-9_.-]{0,63}\Z")
HEX=re.compile(r"[0-9a-f]{64}\Z")
class Reject(Exception): pass
def encoded(v): return json.dumps(v,sort_keys=True,separators=(",",":"),ensure_ascii=False,allow_nan=False)
def digest(v): return hashlib.sha256(encoded(v).encode()).hexdigest()
def ident(v):
    if not isinstance(v,str) or not ID.fullmatch(v): raise Reject("invalid_id")
    return v
def receipt(v):
    if not isinstance(v,dict) or set(v)!={"schemaVersion","mode","runId","artifactName","sha256","bytes","durationMs","width","height","videoCodec","audioCodec","paidCallEvidenceCount","productionReady","executionAllowed","qualityReviewRequired","verificationHash"}: raise Reject("invalid_receipt")
    if v["schemaVersion"]!=1 or v["mode"]!="verified_live_artifact_receipt" or v["artifactName"] not in {"result.mp4","result-recovered.mp4"}: raise Reject("invalid_receipt")
    ident(v["runId"])
    if not isinstance(v["sha256"],str) or not HEX.fullmatch(v["sha256"]): raise Reject("invalid_receipt")
    if not isinstance(v["verificationHash"],str) or not HEX.fullmatch(v["verificationHash"]): raise Reject("invalid_receipt")
    for k,lo,hi in (("bytes",1,200*1024*1024),("durationMs",1,120000),("width",1,8192),("height",1,8192),("paidCallEvidenceCount",1,100)):
        if type(v[k]) is not int or not lo<=v[k]<=hi: raise Reject("invalid_receipt")
    if v["videoCodec"]!="h264" or v["audioCodec"]!="aac" or v["productionReady"] is not False or v["executionAllowed"] is not False or v["qualityReviewRequired"] is not True: raise Reject("unsafe_receipt")
    core={k:v[k] for k in v if k!="verificationHash"}
    if digest(core)!=v["verificationHash"]: raise Reject("verification_hash_mismatch")
    return v
def initialize(db):
    db.executescript("""
    CREATE TABLE results(run_id TEXT PRIMARY KEY, artifact_sha256 TEXT NOT NULL UNIQUE, receipt_json TEXT NOT NULL, receipt_hash TEXT NOT NULL);
    CREATE TABLE commands(command_id TEXT PRIMARY KEY, request_hash TEXT NOT NULL, response_json TEXT NOT NULL);
    CREATE TRIGGER results_no_update BEFORE UPDATE ON results BEGIN SELECT RAISE(ABORT,'append_only'); END;
    CREATE TRIGGER results_no_delete BEFORE DELETE ON results BEGIN SELECT RAISE(ABORT,'append_only'); END;
    CREATE TRIGGER commands_no_update BEFORE UPDATE ON commands BEGIN SELECT RAISE(ABORT,'append_only'); END;
    CREATE TRIGGER commands_no_delete BEFORE DELETE ON commands BEGIN SELECT RAISE(ABORT,'append_only'); END;
    """)
    db.execute(f"PRAGMA application_id={APP_ID}")
    db.execute(f"PRAGMA user_version={SCHEMA}")
def verify_row(row):
    if not row: return None
    value=json.loads(row[0])
    if digest(value)!=row[1]: raise Reject("integrity_failure")
    return receipt(value)
def operate(db,request):
    action=request.get("action")
    if action=="get":
        run_id=ident(request.get("runId")); value=verify_row(db.execute("SELECT receipt_json,receipt_hash FROM results WHERE run_id=?",(run_id,)).fetchone())
        if value is None: raise Reject("result_not_found")
        return {"ok":True,"receipt":value,"replayed":False,"productionReady":False,"executionAllowed":False}
    if action!="import" or set(request)!={"action","commandId","receipt"}: raise Reject("unsupported_command")
    command_id=ident(request.get("commandId")); value=receipt(request.get("receipt")); request_hash=digest(request)
    db.execute("BEGIN IMMEDIATE")
    prior=db.execute("SELECT request_hash,response_json FROM commands WHERE command_id=?",(command_id,)).fetchone()
    if prior:
        if prior[0]!=request_hash: raise Reject("command_conflict")
        db.commit(); response=json.loads(prior[1]);response["replayed"]=True;return response
    if db.execute("SELECT 1 FROM results WHERE run_id=? OR artifact_sha256=?",(value["runId"],value["sha256"])).fetchone(): raise Reject("artifact_already_imported")
    text=encoded(value);db.execute("INSERT INTO results VALUES(?,?,?,?)",(value["runId"],value["sha256"],text,digest(value)))
    response={"ok":True,"receipt":value,"replayed":False,"productionReady":False,"executionAllowed":False}
    db.execute("INSERT INTO commands VALUES(?,?,?)",(command_id,request_hash,encoded(response)));db.commit();return response
def main():
    if len(sys.argv)!=2: raise Reject("invalid_database")
    raw=sys.stdin.buffer.read(MAX_REQUEST+1)
    if len(raw)>MAX_REQUEST: raise Reject("command_too_large")
    request=json.loads(raw)
    if not isinstance(request,dict): raise Reject("invalid_command")
    path=Path(sys.argv[1]);path.parent.mkdir(parents=True,exist_ok=True)
    if path.exists() and (path.is_symlink() or not path.is_file()): raise Reject("unsafe_database_path")
    new=not path.exists();db=sqlite3.connect(path,timeout=5,isolation_level=None)
    db.execute("PRAGMA journal_mode=WAL");db.execute("PRAGMA synchronous=FULL")
    if new:
        db.execute("BEGIN EXCLUSIVE");initialize(db);db.commit()
    if db.execute("PRAGMA application_id").fetchone()[0]!=APP_ID or db.execute("PRAGMA user_version").fetchone()[0]!=SCHEMA: raise Reject("foreign_database")
    print(encoded(operate(db,request)))
try: main()
except (Reject,json.JSONDecodeError,sqlite3.DatabaseError) as e:
    try:
        code=str(e) if isinstance(e,Reject) else "store_failure"
        print(encoded({"ok":False,"code":code}))
    except Exception: pass
