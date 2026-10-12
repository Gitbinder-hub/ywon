#!/usr/bin/env python3
"""Offline spec/task continuity tooling. No network, API calls, git or deployment."""
from __future__ import annotations
import argparse, copy, hashlib, json, os, sys, tempfile
from datetime import datetime, timezone
from pathlib import Path

DEFAULT_ROOT = Path(__file__).resolve().parents[1]
STATUSES = {'TODO','DOING','REVIEW','BLOCKED','DONE'}
RESULTS = {'pass','fail','not_run','not_applicable'}
REQUIRED_HANDOFF = {'task_id','agent','session','branch','base_commit','work_commit','summary',
                   'changed_files','evidence','ac_results','not_done','risks','blockers','next_steps',
                   'recommended_next_tasks','required_owner_checks','costs'}

class ProjectError(Exception): pass

def now(): return datetime.now(timezone.utc).isoformat(timespec='seconds')
def read_json(p):
    try: return json.loads(p.read_text(encoding='utf-8'))
    except (OSError,ValueError) as e: raise ProjectError(f'Cannot read {p.name}: {e}') from e

def inside(root, name):
    p=(root/name).resolve()
    if not p.is_relative_to(root.resolve()): raise ProjectError(f'Path outside repository: {name}')
    return p

def atomic_text(p, text):
    p.parent.mkdir(parents=True,exist_ok=True)
    fd, tmp=tempfile.mkstemp(prefix='.Ywoom-',dir=p.parent)
    try:
        with os.fdopen(fd,'w',encoding='utf-8') as f: f.write(text)
        os.replace(tmp,p)
    finally:
        if os.path.exists(tmp): os.unlink(tmp)

def digest(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def load(root): return read_json(root/'tasks/project.json')
def task_map(p): return {t['id']:t for t in p['tasks']}
def get_task(p, tid):
    try: return task_map(p)[tid]
    except KeyError as e: raise ProjectError(f'Unknown task: {tid}') from e

def is_ready(p,t):
    tm=task_map(p)
    return (t['enabled'] and t['status']=='TODO' and t['phase']==p['current_phase']
            and all(tm[d]['status']=='DONE' for d in t['depends_on']))

def ensure_ready(p,t):
    if not is_ready(p,t): raise ProjectError(f"{t['id']} is not ready: phase/status/enabled/dependencies")

def feature_progress(p,f):
    ids=f['implementation_tasks']
    if f.get('spec_tooling_ready') and not ids: return 'spec_tooling_ready; product_runner_not_implemented'
    if not ids: return 'future_not_scheduled'
    states=[get_task(p,i)['status'] for i in ids]
    if all(s=='DONE' for s in states): return 'first_scope_accepted; future_scope_not_complete'
    if any(s!='TODO' for s in states): return 'partial_or_under_review'
    return 'unimplemented'

def views(root,p):
    counts={s:sum(t['status']==s for t in p['tasks']) for s in sorted(STATUSES)}
    ready=[t for t in p['tasks'] if is_ready(p,t)]
    active=[t for t in p['tasks'] if t['status'] in {'DOING','REVIEW','BLOCKED'}]
    st=['# STATE — generated, do not edit manually','',f"Spec: {p['spec_version']}",
        f"Current phase: {p['current_phase']}",f"Accepted product implementation: {p['product_implementation']}",
        f"Bootstrap implementation: {p.get('bootstrap_implementation', {}).get('status', 'none')} (does not accept P0/P1)",
        f"Registry updated_at: {p['updated_at']}",'',
        'Это состояние задач, не доказательство работоспособности продукта.',
        'Источник: tasks/project.json; полная цель: tasks/features.json и docs/product/17_MASTER_PLAN.md.',
        'REVIEW не равно DONE. Моки/spec tests не равно real media acceptance.','',
        '## Counts', ' | '.join(f'{k}: {v}' for k,v in counts.items()),'', '## Active / awaiting review']
    st += [f"- {t['id']} {t['status']}: {t['title']} | agent={t['assignee']} | handoff={t['handoff'] or t['checkpoint'] or '-'} | blocker={t['block_reason'] or '-'}" for t in active] or ['- None']
    st += ['', '## Ready now']
    st += [f"- {t['id']} ({t['kind']}): {t['title']}" for t in ready] or ['- No ready tasks; inspect gates/dependencies/blockers.']
    st += ['', '## Last accepted']
    done=[t for t in p['tasks'] if t['status']=='DONE']
    done.sort(key=lambda t:t['acceptance']['at'],reverse=True)
    st += [f"- {t['id']} | by={t['acceptance']['by']} | at={t['acceptance']['at']} | evidence={t['handoff']}" for t in done[:5]] or ['- None; no product tasks accepted.']
    st += ['', '## Next agent','1. AGENTS.md → validate/status/next → ready task context → last handoff → actual git diff.',
           '2. Owner gates/paid budgets need explicit decision. No silent self-acceptance.',
           '3. Future branches remain preserved; activate/decompose only after accepted gate.']
    bl=['# BACKLOG — generated from tasks/project.json','',
        'Не редактировать статусы здесь. project.py updates → render → validate.',
        'v0.2 T-IDs исторические; активный план использует Q-IDs.','']
    for phase in p['phase_order']:
        bl += [f'## {phase}','']
        for t in [x for x in p['tasks'] if x['phase']==phase]:
            bl += [f"### {t['id']} {t['title']} [{t['status']}]"+(' [DEFERRED/disabled]' if not t['enabled'] else ''),
                   f"- kind: {t['kind']}; paid_calls: {t['paid_calls']}; agent: {t['assignee'] or '-'}",
                   '- depends: '+(', '.join(t['depends_on']) or 'none'),
                   '- context: '+', '.join('`'+x+'`' for x in t['context']),
                   '- scope: '+t['scope'], '- out_of_scope: '+t['out_of_scope'],
                   '- acceptance criteria:']
            bl += [f"  - {ac['id']}: {ac['text']}" for ac in t['ac']]
            bl += [f"- handoff/checkpoint: {t['handoff'] or t['checkpoint'] or '-'}",
                   '- blocker: '+(t['block_reason'] or '-'), '']
    features=read_json(root/'tasks/features.json')['features']
    fs=['# FEATURE_STATUS — generated','',
        'First scope acceptance is NOT the completion of all future ambitions.',
        '| Feature | First phase | Derived status | Tasks / expansions |','|---|---|---|---|']
    fs += [f"| {f['id']} {f['title']} | {f['first_phase']} | {feature_progress(p,f)} | {', '.join(f['implementation_tasks']+f['expansion_tasks']) or 'future planning'} |" for f in features]
    return {'docs/STATE.md':'\n'.join(st)+'\n','tasks/BACKLOG.md':'\n'.join(bl)+'\n','docs/FEATURE_STATUS.md':'\n'.join(fs)+'\n'}

def render(root,p=None):
    for name,text in views(root,p or load(root)).items(): atomic_text(root/name,text)

def validate_handoff(root,t,name,accepted=False):
    hp=inside(root,name); h=read_json(hp)
    missing=REQUIRED_HANDOFF-set(h)
    if missing: raise ProjectError(f'{name}: missing fields {sorted(missing)}')
    if h['task_id']!=t['id']: raise ProjectError(f'{name}: task ID mismatch')
    for k in ['agent','session','branch','base_commit','work_commit','summary']:
        if not isinstance(h[k],str) or not h[k].strip(): raise ProjectError(f'{name}: empty {k}')
    for k in ['changed_files','evidence','ac_results','not_done','risks','blockers','next_steps','recommended_next_tasks','required_owner_checks']:
        if not isinstance(h[k],list): raise ProjectError(f'{name}: {k} must be list')
    actual={a['id'] for a in t['ac']}; records=h['ac_results']
    if len({a.get('id') for a in records})!=len(records): raise ProjectError(f'{name}: duplicate AC results')
    if {a.get('id') for a in records}!=actual: raise ProjectError(f'{name}: must cover exactly all task AC IDs')
    for a in records:
        if a.get('result') not in RESULTS: raise ProjectError(f'{name}: bad AC result')
        if not isinstance(a.get('evidence'),list): raise ProjectError(f'{name}: evidence list missing')
        if a['result']=='pass' and not a['evidence']: raise ProjectError(f'{name}: pass needs evidence refs')
        if a['result']!='pass' and not a.get('reason'): raise ProjectError(f'{name}: non-pass needs reason')
        for ref in a['evidence']:
            if not isinstance(ref,str): raise ProjectError(f'{name}: evidence ref must be string')
            if ref.startswith('https://'): continue  # existence != validity; owner checks source
            if not inside(root,ref).is_file(): raise ProjectError(f'{name}: missing evidence {ref}')
        if accepted and a['result'] not in {'pass','not_applicable'}:
            raise ProjectError(f'{name}: cannot accept AC {a["id"]}={a["result"]}')
    for e in h['evidence']:
        if e.get('result') not in RESULTS: raise ProjectError(f'{name}: bad evidence result')
        if e.get('result')=='pass' and e.get('exit_code') not in {None,0}:
            raise ProjectError(f'{name}: pass with nonzero exit code')
    for f in h['changed_files']:
        if not inside(root,f).is_file(): raise ProjectError(f'{name}: changed file missing {f}')
    if accepted and h['blockers']: raise ProjectError(f'{name}: unresolved blockers')
    if not isinstance(h['costs'],dict): raise ProjectError(f'{name}: costs must be object')
    cost=h['costs'].get('known_usd')
    if cost is not None and (not isinstance(cost,(float,int)) or isinstance(cost,bool) or cost<0):
        raise ProjectError(f'{name}: invalid cost')
    return h

def structural(root,p):
    if p.get('schema_version')!=1: raise ProjectError('Unsupported schema version')
    ts=p.get('tasks',[]); ids=[t['id'] for t in ts]
    if len(set(ids))!=len(ids): raise ProjectError('Duplicate task IDs')
    tm=task_map(p); phases=p['phase_order']
    if p['current_phase'] not in phases: raise ProjectError('Invalid current phase')
    for t in ts:
        if t['status'] not in STATUSES: raise ProjectError(f'{t["id"]}: invalid status')
        if t['phase'] not in phases: raise ProjectError(f'{t["id"]}: invalid phase')
        if not isinstance(t['enabled'],bool): raise ProjectError('enabled must be boolean')
        if t['kind'] not in {'implementation','owner_gate'}: raise ProjectError('Invalid task kind')
        if not t['ac'] or len({a['id'] for a in t['ac']})!=len(t['ac']): raise ProjectError('Invalid AC IDs')
        for path in t['context']:
            if not inside(root,path).is_file(): raise ProjectError(f'{t["id"]}: missing context {path}')
        for d in t['depends_on']:
            if d not in tm or d==t['id']: raise ProjectError(f'{t["id"]}: invalid dependency {d}')
            if phases.index(tm[d]['phase'])>phases.index(t['phase']): raise ProjectError('Dependency on future phase')
        if t['status'] in {'DOING','REVIEW','DONE'}:
            if not t['enabled']: raise ProjectError(f'{t["id"]}: active disabled task')
            if not all(tm[d]['status']=='DONE' for d in t['depends_on']): raise ProjectError(f'{t["id"]}: unaccepted dependency')
        if t['status']=='DOING' and (not t['assignee'] or not t['session']): raise ProjectError('DOING has no assignee/session')
        if t['status']=='BLOCKED' and not t['block_reason']: raise ProjectError('BLOCKED needs reason')
        if t['status'] in {'REVIEW','DONE'}:
            if not t['handoff']: raise ProjectError(f'{t["id"]}: missing handoff')
            validate_handoff(root,t,t['handoff'],accepted=t['status']=='DONE')
        if t['status']=='DONE':
            a=t.get('acceptance')
            if not a or not a.get('owner_confirmed') or not a.get('by') or not a.get('note') or not a.get('at'):
                raise ProjectError(f'{t["id"]}: missing owner acceptance')
            if a.get('handoff_sha256')!=digest(inside(root,t['handoff'])): raise ProjectError('Accepted handoff changed; review required')
        elif t.get('acceptance'): raise ProjectError('Acceptance on unfinished task')
    visited=set(); visiting=set()
    def visit(tid):
        if tid in visiting: raise ProjectError('Cyclic task dependency')
        if tid in visited: return
        visiting.add(tid)
        for d in tm[tid]['depends_on']: visit(d)
        visiting.remove(tid); visited.add(tid)
    for tid in ids: visit(tid)
    for phase,gate in p['phase_gates'].items():
        if gate not in tm or tm[gate]['phase']!=phase or tm[gate]['kind']!='owner_gate': raise ProjectError('Invalid phase gate')
    for phase in phases[:phases.index(p['current_phase'])]:
        if tm[p['phase_gates'][phase]]['status']!='DONE': raise ProjectError('Current phase ahead of unaccepted gate')
    for key,gate in [('selected_expansion_tasks','Q-030G'),('selected_scale_tasks','Q-035G')]:
        for tid in p.get(key,[]):
            if tid not in tm or not tm[tid]['enabled'] or tid not in tm[gate]['depends_on']:
                raise ProjectError(f'{key}: selected task not enabled / missing gate dependency')
        if tm[gate]['status'] in {'DOING','REVIEW','DONE'} and not p.get(key):
            raise ProjectError(f'{gate}: no selected implemented branch tasks')
    fm=read_json(root/'tasks/features.json')['features']; fids=[f['id'] for f in fm]
    if len(set(fids))!=len(fids): raise ProjectError('Duplicate feature IDs')
    for f in fm:
        if f['first_phase'] not in phases+['FUTURE']: raise ProjectError('Invalid feature phase')
        for tid in f['implementation_tasks']+f['expansion_tasks']:
            if tid not in tm: raise ProjectError('Unknown feature task link')
        for fid in f['dependencies']:
            if fid not in fids or fid==f['id']: raise ProjectError('Invalid feature dependency')
    manifest=read_json(root/'docs/archive/v0.2/SOURCE_MANIFEST.json')
    for name,sha in manifest['files'].items():
        f=inside(root,'docs/archive/v0.2/'+name)
        if (root/'.git').exists():
            if not f.is_file() or digest(f)!=sha: raise ProjectError(f'Historical archive altered: {name}')
    # Historical v0.3 exact nonrecursive snapshot, plus original v0.2 retained above.
    m3=read_json(root/'docs/archive/v0.3/SOURCE_MANIFEST.json')
    for name,sha in m3['files'].items():
        f=inside(root,'docs/archive/v0.3/'+name)
        if (root/'.git').exists():
            if not f.is_file() or digest(f)!=sha: raise ProjectError(f'Historical v0.3 archive altered: {name}')
    requirements=read_json(root/'docs/requirements.json')
    if requirements.get('schema_version')!=1 or requirements.get('spec_version')!=p['spec_version']:
        raise ProjectError('Requirement registry schema/spec version mismatch')
    rids=set()
    for req in requirements['requirements']:
        if req['id'] in rids: raise ProjectError('Duplicate requirement IDs')
        rids.add(req['id'])
        if not req.get('requirement') or not inside(root,req['document']).is_file():
            raise ProjectError('Missing requirement text/document')
        if not req['tasks'] or any(t not in tm for t in req['tasks']):
            raise ProjectError('Unknown/empty requirement task link')
        if not req['features'] or any(f not in fids for f in req['features']):
            raise ProjectError('Unknown/empty requirement feature link')
    rg=p.get('public_release_gate')
    if not rg or rg not in tm or tm[rg]['kind']!='owner_gate' or tm[rg]['phase']!='P6':
        raise ProjectError('Invalid public release gate')
    required=p.get('public_release_tasks',[])
    if not required or 'Q-035G' not in tm[rg]['depends_on']:
        raise ProjectError('Missing public release prerequisites')
    # Transitive reachability: a later acceptance task can depend on the implementation task.
    def ancestors(tid):
        found=set()
        def walk(i):
            for d in tm[i]['depends_on']:
                if d not in found: found.add(d); walk(d)
        walk(tid); return found
    for tid in required:
        if tid not in tm or not tm[tid]['enabled'] or tid not in ancestors(rg):
            raise ProjectError('Release task not enabled / missing gate ancestry')
    if (root/'AGENTS.md').read_bytes()!=(root/'CLAUDE.md').read_bytes(): raise ProjectError('AGENTS/CLAUDE mismatch')

def validate(root,p=None,check_views=True):
    p=p or load(root); structural(root,p)
    if check_views:
        for name,text in views(root,p).items():
            if not (root/name).is_file() or (root/name).read_text(encoding='utf-8')!=text:
                raise ProjectError(f'Generated view stale: {name}; run render')
    return True

def event(t,action,by,note=''):
    t['history'].append(dict(at=now(),action=action,by=by,note=note))

def owner(args):
    if not args.owner_confirmed or not args.by or not args.note:
        raise ProjectError('Owner command needs --owner-confirmed, --by, --note; agent must not self-accept')

def advance(p,tid):
    phase=p['current_phase']; order=p['phase_order']
    if p['phase_gates'][phase]==tid and order.index(phase)<len(order)-1:
        p['current_phase']=order[order.index(phase)+1]

def apply(root,p,args):
    p=copy.deepcopy(p); t=get_task(p,args.task); cmd=args.command
    if cmd=='start':
        ensure_ready(p,t)
        if t['kind']=='owner_gate' and not args.owner_confirmed: raise ProjectError('Owner task: use gate with explicit decision')
        if not args.agent: raise ProjectError('start needs --agent')
        t.update(status='DOING',assignee=args.agent,session=args.session or now(),block_reason=None)
        event(t,'start',args.agent)
    elif cmd=='resume':
        owner(args)
        if t['status'] not in {'DOING','BLOCKED'}: raise ProjectError('resume requires DOING/BLOCKED')
        if not args.agent: raise ProjectError('resume needs --agent')
        if not t['enabled'] or t['phase']!=p['current_phase'] or not all(get_task(p,d)['status']=='DONE' for d in t['depends_on']):
            raise ProjectError('resume phase/enabled/dependencies not ready')
        t.update(status='DOING',assignee=args.agent,session=args.session or now(),block_reason=None)
        event(t,'resume',args.by,args.note)
    elif cmd=='block':
        if t['status'] not in {'TODO','DOING','REVIEW'}: raise ProjectError('block requires TODO/DOING/REVIEW')
        if not args.reason: raise ProjectError('block needs --reason')
        t.update(status='BLOCKED',block_reason=args.reason)
        event(t,'block',args.agent or t['assignee'] or 'unassigned',args.reason)
    elif cmd in {'checkpoint','submit'}:
        if t['status'] not in ({'DOING','BLOCKED'} if cmd=='checkpoint' else {'DOING'}):
            raise ProjectError(f'{cmd}: invalid current status')
        if not args.handoff: raise ProjectError(f'{cmd} needs --handoff')
        validate_handoff(root,t,args.handoff)
        if cmd=='checkpoint': t['checkpoint']=args.handoff
        else: t.update(status='REVIEW',handoff=args.handoff,block_reason=None,review_note=None)
        event(t,cmd,t['assignee'] or args.agent or 'unknown',args.handoff)
    elif cmd=='reject':
        owner(args)
        if t['status']!='REVIEW': raise ProjectError('reject requires REVIEW')
        t.update(status='TODO',assignee=None,session=None,review_note=args.note,block_reason=None)
        event(t,'reject',args.by,args.note)
    elif cmd=='accept':
        owner(args)
        if t['status']!='REVIEW': raise ProjectError('accept requires REVIEW')
        validate_handoff(root,t,t['handoff'],accepted=True)
        t['status']='DONE'
        t['acceptance']=dict(by=args.by,at=now(),note=args.note,owner_confirmed=True,
                             handoff_sha256=digest(inside(root,t['handoff'])))
        event(t,'accept',args.by,args.note); advance(p,t['id'])
    elif cmd=='gate':
        owner(args); ensure_ready(p,t)
        if t['kind']!='owner_gate': raise ProjectError('gate only applies to owner_gate task')
        if not args.evidence: raise ProjectError('gate needs --evidence report')
        ev=inside(root,args.evidence)
        if not ev.is_file() or 'APPROVED: YES' not in ev.read_text(encoding='utf-8'):
            raise ProjectError('Owner report must exist and explicitly contain APPROVED: YES')
        name=f'handoffs/{t["id"]}.json'
        h=dict(task_id=t['id'],agent=args.by,session=now(),branch='owner decision',base_commit='not_available',
               work_commit='pending',summary=args.note,changed_files=[args.evidence],
               evidence=[dict(command='owner manual review',exit_code=None,result='pass',artifact=args.evidence,notes=args.note)],
               ac_results=[dict(id=a['id'],result='pass',evidence=[args.evidence],reason='Owner confirms this AC') for a in t['ac']],
               not_done=[],risks=[],blockers=[],next_steps=[],recommended_next_tasks=[],required_owner_checks=[],
               costs=dict(known_usd=None,notes='See approved report; no paid calls by this tool'))
        # Check dynamic scope before creating handoff; no false gate from planning alone.
        if t['id']=='Q-030G' and not p.get('selected_expansion_tasks'): raise ProjectError('Choose and implement P5 branch tasks first')
        if t['id']=='Q-035G' and not p.get('selected_scale_tasks'): raise ProjectError('Choose and implement P6 scale tasks first')
        atomic_text(inside(root,name),json.dumps(h,ensure_ascii=False,indent=2)+'\n')
        t.update(status='DONE',assignee=args.by,session=h['session'],handoff=name,
                 acceptance=dict(by=args.by,at=now(),note=args.note,owner_confirmed=True,handoff_sha256=digest(inside(root,name))))
        event(t,'owner_gate',args.by,args.note); advance(p,t['id'])
    else: raise ProjectError('Unknown mutation command')
    p['updated_at']=now()
    if any(t['status']=='DONE' and t['kind']=='implementation' for t in p['tasks']):
        p['product_implementation']='in_progress; see accepted tasks and evidence'
    structural(root,p)
    return p

def main(argv=None):
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--root',type=Path,default=DEFAULT_ROOT)
    sub=ap.add_subparsers(dest='command',required=True)
    for c in ['validate','render','status','next']: sub.add_parser(c)
    for c in ['start','resume','block','checkpoint','submit','accept','reject','gate']:
        q=sub.add_parser(c); q.add_argument('task')
        q.add_argument('--agent'); q.add_argument('--session'); q.add_argument('--handoff')
        q.add_argument('--by'); q.add_argument('--note'); q.add_argument('--reason'); q.add_argument('--evidence')
        q.add_argument('--owner-confirmed',action='store_true')
    args=ap.parse_args(argv); root=args.root.resolve()
    try:
        p=load(root)
        if args.command=='render':
            structural(root,p); render(root,p); print('Generated STATE/BACKLOG/FEATURE_STATUS.'); return 0
        validate(root,p)
        if args.command=='validate': print('PASS: spec/task/handoff/archive consistency. Product/media NOT tested.'); return 0
        if args.command=='status': print(views(root,p)['docs/STATE.md']); return 0
        if args.command=='next':
            ready=[t for t in p['tasks'] if is_ready(p,t)]
            if not ready: print('No ready tasks. Inspect REVIEW/DOING/BLOCKED and owner gates.'); return 0
            for t in ready:
                print(f"{t['id']} | {t['kind']} | {t['title']} | paid_calls={t['paid_calls']}")
                print('context: '+', '.join(t['context']))
                for a in t['ac']: print(a['id']+': '+a['text'])
            return 0
        changed=apply(root,p,args)
        atomic_text(root/'tasks/project.json',json.dumps(changed,ensure_ascii=False,indent=2)+'\n')
        render(root,changed); validate(root,changed)
        print(f"{args.task}: {get_task(changed,args.task)['status']}; phase={changed['current_phase']}")
        return 0
    except (ProjectError,KeyError,TypeError,ValueError) as e:
        print(f'ERROR: {e}',file=sys.stderr); return 2

if __name__=='__main__': sys.exit(main())
