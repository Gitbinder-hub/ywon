"""B-008 hardened local capability registry. Still no production identity or provider proof."""
import datetime, hashlib, json, os, re, sqlite3, sys
from pathlib import Path
APP_ID=0x51564D43; SCHEMA=2; MAX=256*1024; ID=re.compile(r"[A-Za-z0-9][A-Za-z0-9_.-]{0,63}\Z")
FIDELITIES={'exact_3d','supported_control','prompt_guidance','2d_approximation'}; CONTROLS={'text','reference_image','video','depth','pose','camera','keyframes'}; KINDS={'image','video','depth','pose','audio'}
class Reject(Exception): pass
def enc(v): return json.dumps(v,sort_keys=True,separators=(",",":"),ensure_ascii=False,allow_nan=False)
def dig(v): return hashlib.sha256(enc(v).encode()).hexdigest()
def ident(v):
 if not isinstance(v,str) or not ID.fullmatch(v): raise Reject('invalid_id')
 return v
def integer(v,minimum,maximum):
 if type(v) is not int or v<minimum or v>maximum:raise Reject('invalid_integer')
 return v
def instant(v):
 if not isinstance(v,str): raise Reject('invalid_time')
 try:x=datetime.datetime.fromisoformat(v.replace('Z','+00:00'))
 except ValueError:raise Reject('invalid_time')
 if x.tzinfo is None:raise Reject('timezone_required')
 return x
def enum_list(v,allowed,maximum):
 if not isinstance(v,list) or len(v)>maximum or len(set(v))!=len(v) or any(x not in allowed for x in v):raise Reject('invalid_capability')
 return v
def capability(v,cap_id,version):
 if not isinstance(v,dict) or set(v)-{'status'}!={'id','version','fidelities','controls','requiredAssetKinds','maxDurationSec','price'} or v.get('id')!=cap_id or v.get('version')!=version or v.get('status') not in {None,'candidate'}:raise Reject('invalid_capability')
 out={'id':cap_id,'version':version,'fidelities':enum_list(v['fidelities'],FIDELITIES,4),'controls':enum_list(v['controls'],CONTROLS,7),'requiredAssetKinds':enum_list(v['requiredAssetKinds'],KINDS,5),'maxDurationSec':integer(v['maxDurationSec'],1,600),'price':None}
 if v['price'] is not None:
  p=v['price']
  if not isinstance(p,dict) or set(p)!={'currency','fixedMinor','perSecondMinor','minimumSeconds','roundingSeconds'} or p.get('currency')!='USD':raise Reject('invalid_capability')
  out['price']={'currency':'USD','fixedMinor':integer(p['fixedMinor'],0,1_000_000),'perSecondMinor':integer(p['perSecondMinor'],0,1_000_000),'minimumSeconds':integer(p['minimumSeconds'],1,600),'roundingSeconds':integer(p['roundingSeconds'],1,600)}
 return out
def init(db):
 db.executescript('''CREATE TABLE capabilities(key TEXT PRIMARY KEY,version INTEGER NOT NULL,record_json TEXT NOT NULL);CREATE TABLE commands(command_id TEXT PRIMARY KEY,request_hash TEXT NOT NULL,response_json TEXT NOT NULL);CREATE TABLE events(key TEXT NOT NULL,version INTEGER NOT NULL,previous_hash TEXT NOT NULL,event_hash TEXT NOT NULL,record_json TEXT NOT NULL,command_id TEXT NOT NULL UNIQUE,PRIMARY KEY(key,version));CREATE TRIGGER capability_events_no_update BEFORE UPDATE ON events BEGIN SELECT RAISE(ABORT,'append_only');END;CREATE TRIGGER capability_events_no_delete BEFORE DELETE ON events BEGIN SELECT RAISE(ABORT,'append_only');END;CREATE TRIGGER capability_commands_no_update BEFORE UPDATE ON commands BEGIN SELECT RAISE(ABORT,'append_only');END;CREATE TRIGGER capability_commands_no_delete BEFORE DELETE ON commands BEGIN SELECT RAISE(ABORT,'append_only');END;''')
 db.execute(f'PRAGMA application_id={APP_ID}');db.execute(f'PRAGMA user_version={SCHEMA}')
def verify(db,key):
 rows=db.execute('SELECT version,previous_hash,event_hash,record_json,command_id FROM events WHERE key=? ORDER BY version',(key,)).fetchall();previous='0'*64
 for expected,row in enumerate(rows,1):
  record=json.loads(row[3])
  if row[0]!=expected or row[1]!=previous or dig({'previous':previous,'key':key,'version':row[0],'commandId':row[4],'record':record})!=row[2]:raise Reject('integrity_failure')
  previous=row[2]
 current=db.execute('SELECT version,record_json FROM capabilities WHERE key=?',(key,)).fetchone()
 if current and (not rows or current[0]!=rows[-1][0] or current[1]!=rows[-1][3]):raise Reject('integrity_failure')
 if rows and not current:raise Reject('integrity_failure')
 return json.loads(current[1]) if current else None
def actor(v,roles):
 if not isinstance(v,dict) or set(v)!={'id','role'} or v.get('role') not in roles:raise Reject('unauthorized_actor_role')
 return ident(v.get('id'))
def evidence(items):
 if not isinstance(items,list) or not 1<=len(items)<=16:raise Reject('evidence_required')
 out=[];seen=set()
 for e in items:
  if not isinstance(e,dict) or set(e)!={'id','sourceType','sourceUri','sha256','observedAt','expiresAt'}:raise Reject('invalid_evidence')
  eid=ident(e.get('id'));uri=e.get('sourceUri')
  if eid in seen or e.get('sourceType') not in {'fixture','official_document','benchmark'} or not isinstance(uri,str) or not uri or len(uri)>2048 or not re.fullmatch(r'[a-f0-9]{64}',str(e.get('sha256'))):raise Reject('invalid_evidence')
  observed=instant(e.get('observedAt'));expires=instant(e.get('expiresAt'))
  if expires<=observed:raise Reject('invalid_evidence_window')
  seen.add(eid);out.append(e)
 return out
def mainop(db,r):
 kind=r.get('kind')
 if kind=='get':
  key=ident(r.get('id'))+'@'+ident(r.get('version'));cur=verify(db,key)
  if not cur:raise Reject('not_found')
  return {'ok':True,'record':cur,'replayed':False}
 if kind=='list':
  keys=[x[0] for x in db.execute('SELECT key FROM capabilities ORDER BY key').fetchall()];return {'ok':True,'records':[verify(db,k) for k in keys]}
 if kind not in {'register','verify','approve','revoke'}:raise Reject('unsupported_action')
 cmd=ident(r.get('commandId'));rh=dig(r);old=db.execute('SELECT request_hash,response_json FROM commands WHERE command_id=?',(cmd,)).fetchone()
 if old:
  if old[0]!=rh:raise Reject('idempotency_conflict')
  x=json.loads(old[1]);x['replayed']=True;return x
 cap_id=ident(r.get('id'));version=ident(r.get('version'));key=cap_id+'@'+version;cur=verify(db,key);now=datetime.datetime.now(datetime.timezone.utc).isoformat()
 if kind=='register':
  if cur:raise Reject('capability_exists')
  actor(r.get('actor'),{'capability_registrar'});base=capability(r.get('capability'),cap_id,version);ev=evidence(r.get('evidence'));reason=r.get('reason')
  if reason is not None and (not isinstance(reason,str) or len(reason)>1000):raise Reject('invalid_reason')
  cur={**base,'status':'candidate','recordVersion':1,'evidence':ev,'verifiedBy':None,'approvedBy':None,'revokedBy':None,'reason':reason,'updatedAt':now}
 else:
  if not cur:raise Reject('not_found')
  if type(r.get('expectedRecordVersion')) is not int or r['expectedRecordVersion']!=cur['recordVersion']:raise Reject('version_conflict')
  if kind=='verify':
   aid=actor(r.get('actor'),{'capability_verifier'})
   if cur['status']!='candidate':raise Reject('invalid_transition')
   if not any(e['sourceType'] in {'official_document','benchmark'} for e in cur['evidence']):raise Reject('verification_basis_required')
   cur['status']='verified';cur['verifiedBy']=aid
  elif kind=='approve':
   aid=actor(r.get('actor'),{'capability_approver'})
   if cur['status']!='verified' or aid==cur['verifiedBy']:raise Reject('independent_approval_required')
   if any(instant(e['expiresAt'])<=datetime.datetime.now(datetime.timezone.utc) for e in cur['evidence']):raise Reject('evidence_expired')
   cur['status']='approved';cur['approvedBy']=aid
  else:
   aid=actor(r.get('actor'),{'capability_approver','security_reviewer'});reason=r.get('reason')
   if cur['status']=='revoked':raise Reject('invalid_transition')
   if not isinstance(reason,str) or not reason.strip() or len(reason)>1000:raise Reject('revocation_reason_required')
   cur['status']='revoked';cur['revokedBy']=aid;cur['reason']=reason
  cur['recordVersion']+=1;cur['updatedAt']=now
 previous=db.execute('SELECT event_hash FROM events WHERE key=? ORDER BY version DESC LIMIT 1',(key,)).fetchone();previous_hash=previous[0] if previous else '0'*64
 text=enc(cur);event=dig({'previous':previous_hash,'key':key,'version':cur['recordVersion'],'commandId':cmd,'record':cur});response={'ok':True,'record':cur,'replayed':False}
 db.execute('INSERT INTO events VALUES(?,?,?,?,?,?)',(key,cur['recordVersion'],previous_hash,event,text,cmd));db.execute('INSERT INTO capabilities VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET version=excluded.version,record_json=excluded.record_json',(key,cur['recordVersion'],text));db.execute('INSERT INTO commands VALUES(?,?,?)',(cmd,rh,enc(response)));return response
def main():
 if len(sys.argv)!=2:raise Reject('database_path_required')
 raw=sys.stdin.buffer.read(MAX+1)
 if len(raw)>MAX:raise Reject('request_too_large')
 r=json.loads(raw,parse_constant=lambda _:(_ for _ in ()).throw(Reject('nonfinite_json')))
 if not isinstance(r,dict):raise Reject('invalid_request')
 p=Path(sys.argv[1])
 if p.is_symlink() or (p.exists() and not p.is_file()):raise Reject('unsafe_database_path')
 new=not p.exists()
 if new and r.get('kind')!='register':raise Reject('not_found')
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
  db.execute('PRAGMA synchronous=FULL');db.execute('BEGIN IMMEDIATE')
  try:x=mainop(db,r);db.execute('COMMIT')
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
