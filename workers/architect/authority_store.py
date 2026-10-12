"""B-016 local authority policy + operation coordinator. No production IAM or provider execution."""
import hashlib,json,os,re,sqlite3,sys
from pathlib import Path
APP_ID=0x51564150;SCHEMA=4;MAX=256*1024;ID=re.compile(r'[A-Za-z0-9][A-Za-z0-9_.-]{0,63}\Z')
OP_SELECT='SELECT authorization_id,envelope_hash,command_id,policy_version,version,state,envelope_json,result_json,reason,operator_id,created_at_ms,updated_at_ms FROM operations'
class Reject(Exception):pass
def enc(v):return json.dumps(v,sort_keys=True,separators=(',',':'),ensure_ascii=False,allow_nan=False)
def dig(v):return hashlib.sha256(enc(v).encode()).hexdigest()
def ident(v):
 if not isinstance(v,str) or not ID.fullmatch(v):raise Reject('invalid_id')
 return v
def init(db):
 db.executescript('''CREATE TABLE current_policy(slot INTEGER PRIMARY KEY CHECK(slot=1),version INTEGER NOT NULL,anchor_fingerprint TEXT NOT NULL,policy_json TEXT NOT NULL);CREATE TABLE commands(command_id TEXT PRIMARY KEY,request_hash TEXT NOT NULL,response_json TEXT NOT NULL);CREATE TABLE events(version INTEGER PRIMARY KEY,previous_hash TEXT NOT NULL,event_hash TEXT NOT NULL,policy_json TEXT NOT NULL,command_id TEXT NOT NULL UNIQUE);CREATE TABLE operations(authorization_id TEXT PRIMARY KEY,envelope_hash TEXT NOT NULL,command_id TEXT NOT NULL,policy_version INTEGER NOT NULL,version INTEGER NOT NULL,state TEXT NOT NULL,envelope_json TEXT NOT NULL,result_json TEXT,reason TEXT,operator_id TEXT,created_at_ms INTEGER NOT NULL,updated_at_ms INTEGER NOT NULL);CREATE TABLE operation_events(authorization_id TEXT NOT NULL,version INTEGER NOT NULL,previous_hash TEXT NOT NULL,event_hash TEXT NOT NULL,event_type TEXT NOT NULL,operation_json TEXT NOT NULL,PRIMARY KEY(authorization_id,version));CREATE TRIGGER authority_events_no_update BEFORE UPDATE ON events BEGIN SELECT RAISE(ABORT,'append_only');END;CREATE TRIGGER authority_events_no_delete BEFORE DELETE ON events BEGIN SELECT RAISE(ABORT,'append_only');END;CREATE TRIGGER authority_commands_no_update BEFORE UPDATE ON commands BEGIN SELECT RAISE(ABORT,'append_only');END;CREATE TRIGGER authority_commands_no_delete BEFORE DELETE ON commands BEGIN SELECT RAISE(ABORT,'append_only');END;CREATE TRIGGER operation_events_no_update BEFORE UPDATE ON operation_events BEGIN SELECT RAISE(ABORT,'append_only');END;CREATE TRIGGER operation_events_no_delete BEFORE DELETE ON operation_events BEGIN SELECT RAISE(ABORT,'append_only');END;''')
 db.execute(f'PRAGMA application_id={APP_ID}');db.execute(f'PRAGMA user_version={SCHEMA}')
def verify(db):
 rows=db.execute('SELECT version,previous_hash,event_hash,policy_json,command_id FROM events ORDER BY version').fetchall();previous='0'*64
 for expected,row in enumerate(rows,1):
  policy=json.loads(row[3])
  if row[0]!=expected or row[1]!=previous or dig({'previous':previous,'version':row[0],'commandId':row[4],'policy':policy})!=row[2]:raise Reject('integrity_failure')
  previous=row[2]
 cur=db.execute('SELECT version,anchor_fingerprint,policy_json FROM current_policy WHERE slot=1').fetchone()
 if cur and (not rows or cur[0]!=rows[-1][0] or cur[2]!=rows[-1][3]):raise Reject('integrity_failure')
 if rows and not cur:raise Reject('integrity_failure')
 return ({'version':cur[0],'anchorFingerprint':cur[1],'policy':json.loads(cur[2])} if cur else None)
def operation(row):
 return {'authorizationId':row[0],'envelopeHash':row[1],'commandId':row[2],'policyVersion':row[3],'version':row[4],'state':row[5],'envelope':json.loads(row[6]),'result':json.loads(row[7]) if row[7] is not None else None,'reason':row[8],'operatorId':row[9],'createdAtMs':row[10],'updatedAtMs':row[11]}
def load_operation(db,aid):
 row=db.execute(OP_SELECT+' WHERE authorization_id=?',(aid,)).fetchone()
 if not row:return None
 op=operation(row);events=db.execute('SELECT version,previous_hash,event_hash,event_type,operation_json FROM operation_events WHERE authorization_id=? ORDER BY version',(aid,)).fetchall();previous='0'*64
 for expected,event in enumerate(events,1):
  snapshot=json.loads(event[4])
  if event[0]!=expected or event[1]!=previous or dig({'previous':previous,'authorizationId':aid,'version':event[0],'eventType':event[3],'operation':snapshot})!=event[2]:raise Reject('operation_integrity_failure')
  previous=event[2]
 if not events or op['version']!=events[-1][0] or enc(op)!=events[-1][4]:raise Reject('operation_integrity_failure')
 return op
def append_operation(db,op,event_type):
 previous=db.execute('SELECT event_hash FROM operation_events WHERE authorization_id=? ORDER BY version DESC LIMIT 1',(op['authorizationId'],)).fetchone();ph=previous[0] if previous else '0'*64;text=enc(op);eh=dig({'previous':ph,'authorizationId':op['authorizationId'],'version':op['version'],'eventType':event_type,'operation':op});db.execute('INSERT INTO operation_events VALUES(?,?,?,?,?,?)',(op['authorizationId'],op['version'],ph,eh,event_type,text))
def operate(db,r):
 action=r.get('action')
 if action=='get':
  cur=verify(db)
  if not cur:raise Reject('not_found')
  return {'ok':True,**cur,'replayed':False}
 if action in {'get_operation','list_pending'}:
  verify(db)
  if action=='get_operation':
   aid=ident(r.get('authorizationId'));op=load_operation(db,aid)
   if not op:raise Reject('operation_not_found')
   return {'ok':True,'operation':op}
  ids=[x[0] for x in db.execute("SELECT authorization_id FROM operations WHERE state='claimed' ORDER BY created_at_ms,authorization_id LIMIT 101").fetchall()];return {'ok':True,'operations':[load_operation(db,x) for x in ids[:100]],'hasMore':len(ids)>100}
 if action=='consume':
  cur=verify(db)
  if not cur:raise Reject('not_found')
  aid=ident(r.get('authorizationId'));command_id=ident(r.get('commandId'));eh=r.get('envelopeHash');pv=r.get('policyVersion');issued=r.get('issuedAtMs');expires=r.get('expiresAtMs');now=r.get('nowMs');envelope=r.get('envelope')
  if not isinstance(eh,str) or not re.fullmatch(r'[a-f0-9]{64}',eh) or type(pv)is not int or pv!=cur['version'] or any(type(x)is not int for x in (issued,expires,now)) or not isinstance(envelope,dict):raise Reject('invalid_consumption')
  op=load_operation(db,aid)
  if op:
   if op['envelopeHash']!=eh or op['commandId']!=command_id or op['policyVersion']!=pv or enc(op['envelope'])!=enc(envelope):raise Reject('authorization_reuse_conflict')
   if op['state']=='stopped':raise Reject('operation_stopped')
   return {'ok':True,'operation':op,'replayed':True}
  if issued>now or now>=expires or expires-issued>900000 or expires<=issued:raise Reject('authorization_time_invalid')
  db.execute('INSERT INTO operations VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',(aid,eh,command_id,pv,1,'claimed',enc(envelope),None,None,None,now,now));op=operation(db.execute(OP_SELECT+' WHERE authorization_id=?',(aid,)).fetchone());append_operation(db,op,'claimed');return {'ok':True,'operation':op,'replayed':False}
 if action=='complete':
  verify(db);aid=ident(r.get('authorizationId'));eh=r.get('envelopeHash');result=r.get('result');now=r.get('nowMs')
  if not isinstance(eh,str) or not isinstance(result,dict) or type(now)is not int:raise Reject('invalid_completion')
  op=load_operation(db,aid)
  if not op:raise Reject('operation_not_found')
  if op['envelopeHash']!=eh:raise Reject('authorization_reuse_conflict')
  if op['state']=='stopped':raise Reject('operation_stopped')
  if op['state']=='completed':
   if enc(op['result'])!=enc(result):raise Reject('completion_conflict')
   return {'ok':True,'operation':op,'replayed':True}
  db.execute("UPDATE operations SET version=version+1,state='completed',result_json=?,updated_at_ms=? WHERE authorization_id=?",(enc(result),now,aid));op=operation(db.execute(OP_SELECT+' WHERE authorization_id=?',(aid,)).fetchone());append_operation(db,op,'completed');return {'ok':True,'operation':op,'replayed':False}
 if action=='stop':
  verify(db);aid=ident(r.get('authorizationId'));operator_id=ident(r.get('operatorId'));reason=r.get('reason');now=r.get('nowMs')
  if not isinstance(reason,str) or not reason.strip() or len(reason)>1000 or type(now)is not int:raise Reject('invalid_stop')
  op=load_operation(db,aid)
  if not op:raise Reject('operation_not_found')
  if op['state']=='completed':raise Reject('completed_operation')
  if op['state']=='stopped':return {'ok':True,'operation':op,'replayed':True}
  db.execute("UPDATE operations SET version=version+1,state='stopped',reason=?,operator_id=?,updated_at_ms=? WHERE authorization_id=?",(reason,operator_id,now,aid));op=operation(db.execute(OP_SELECT+' WHERE authorization_id=?',(aid,)).fetchone());append_operation(db,op,'stopped');return {'ok':True,'operation':op,'replayed':False}
 if action!='set':raise Reject('unsupported_action')
 cmd=ident(r.get('commandId'));rh=dig(r);receipt=db.execute('SELECT request_hash,response_json FROM commands WHERE command_id=?',(cmd,)).fetchone()
 if receipt:
  if receipt[0]!=rh:raise Reject('idempotency_conflict')
  x=json.loads(receipt[1]);x['replayed']=True;return x
 cur=verify(db);expected=r.get('expectedVersion')
 if type(expected)is not int or expected<0:raise Reject('invalid_version')
 if (cur['version'] if cur else 0)!=expected:raise Reject('version_conflict')
 policy=r.get('policy');anchor=r.get('anchorFingerprint')
 if not isinstance(policy,dict) or policy.get('policyVersion')!=expected+1 or not isinstance(anchor,str) or not re.fullmatch(r'[a-f0-9]{64}',anchor):raise Reject('invalid_policy_payload')
 if cur and anchor!=cur['anchorFingerprint']:raise Reject('anchor_change_denied')
 version=expected+1;text=enc(policy);previous=db.execute('SELECT event_hash FROM events ORDER BY version DESC LIMIT 1').fetchone();ph=previous[0] if previous else '0'*64;eh=dig({'previous':ph,'version':version,'commandId':cmd,'policy':policy});response={'ok':True,'version':version,'anchorFingerprint':anchor,'policy':policy,'replayed':False}
 db.execute('INSERT INTO events VALUES(?,?,?,?,?)',(version,ph,eh,text,cmd));db.execute('INSERT INTO current_policy VALUES(1,?,?,?) ON CONFLICT(slot) DO UPDATE SET version=excluded.version,policy_json=excluded.policy_json',(version,anchor,text));db.execute('INSERT INTO commands VALUES(?,?,?)',(cmd,rh,enc(response)));return response
def main():
 if len(sys.argv)!=2:raise Reject('database_path_required')
 raw=sys.stdin.buffer.read(MAX+1)
 if len(raw)>MAX:raise Reject('request_too_large')
 r=json.loads(raw)
 if not isinstance(r,dict):raise Reject('invalid_request')
 p=Path(sys.argv[1])
 if p.is_symlink() or (p.exists() and not p.is_file()):raise Reject('unsafe_database_path')
 new=not p.exists()
 if new and r.get('action')!='set':raise Reject('not_found')
 if new:p.parent.mkdir(parents=True,exist_ok=True)
 lock=Path(str(p)+'.init-lock');fd=None;db=None
 if not new and lock.exists():raise Reject('initialization_busy')
 if new:
  try:fd=os.open(lock,os.O_CREAT|os.O_EXCL|os.O_WRONLY,0o600)
  except FileExistsError:raise Reject('initialization_busy')
 try:
  fresh=new and not p.exists();db=sqlite3.connect(p,timeout=3,isolation_level=None);db.execute('PRAGMA busy_timeout=3000')
  if fresh:db.execute('PRAGMA journal_mode=WAL');db.execute('PRAGMA synchronous=FULL');init(db)
  elif db.execute('PRAGMA application_id').fetchone()[0]!=APP_ID or db.execute('PRAGMA user_version').fetchone()[0]!=SCHEMA:raise Reject('unsupported_database')
  db.execute('BEGIN IMMEDIATE')
  try:x=operate(db,r);db.execute('COMMIT')
  except Exception:db.execute('ROLLBACK');raise
  print(enc(x))
 finally:
  if db is not None:db.close()
  if fd is not None:os.close(fd);lock.unlink(missing_ok=True)
if __name__=='__main__':
 try:main()
 except Reject as e:print(enc({'ok':False,'code':str(e)}))
 except (ValueError,TypeError,KeyError):print(enc({'ok':False,'code':'invalid_request'}))
 except sqlite3.Error:print(enc({'ok':False,'code':'database_error'}))
 except OSError:print(enc({'ok':False,'code':'filesystem_error'}))
