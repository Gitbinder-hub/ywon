import argparse, copy, importlib.util, json, shutil, tempfile, unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('Ywoom_project',ROOT/'scripts/project.py')
q=importlib.util.module_from_spec(spec); spec.loader.exec_module(q)

def args(cmd,tid,**kw):
    defaults=dict(command=cmd,task=tid,agent=None,session=None,handoff=None,by=None,note=None,
                  reason=None,evidence=None,owner_confirmed=False)
    defaults.update(kw); return argparse.Namespace(**defaults)

class ContinuityTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory(); self.root=Path(self.tmp.name)/'repo'
        shutil.copytree(ROOT,self.root,ignore=shutil.ignore_patterns('__pycache__','.git'))
        self.p=q.load(self.root)
    def tearDown(self): self.tmp.cleanup()
    def gate_first(self):
        (self.root/'reports/test-owner.md').write_text('APPROVED: YES\nOwner: test owner\nConfirmed task AC and limits for test only.\n')
        self.p=q.apply(self.root,self.p,args('gate','Q-001',by='test owner',note='test only',
                          evidence='reports/test-owner.md',owner_confirmed=True))
    def start_second(self):
        self.gate_first(); self.p=q.apply(self.root,self.p,args('start','Q-002',agent='test agent'))
    def handoff(self,result='pass',blockers=None):
        t=q.get_task(self.p,'Q-002')
        report='reports/test-evidence.md'; (self.root/report).write_text('Synthetic evidence for unit test only.\n')
        h=q.read_json(self.root/'handoffs/TEMPLATE.json')
        h.update(task_id='Q-002',agent='test agent',session='test',branch='test',base_commit='test',work_commit='test',
                 changed_files=[report],summary='synthetic test',evidence=[],blockers=blockers or [],
                 ac_results=[dict(id=a['id'],result=result,evidence=[report] if result=='pass' else [],
                                  reason='test evidence' if result=='pass' else 'not run') for a in t['ac']])
        name='handoffs/Q-002.json'; (self.root/name).write_text(json.dumps(h))
        return name
    def submit_second(self,result='pass',blockers=None):
        name=self.handoff(result,blockers)
        self.p=q.apply(self.root,self.p,args('submit','Q-002',handoff=name))
    def test_initial_pack_valid(self): self.assertTrue(q.validate(self.root))
    def test_first_ready_owner_gate_only(self):
        self.assertEqual([t['id'] for t in self.p['tasks'] if q.is_ready(self.p,t)],['Q-001'])
    def test_dependencies_block_start(self):
        with self.assertRaises(q.ProjectError): q.apply(self.root,self.p,args('start','Q-002',agent='x'))
    def test_owner_task_needs_confirmation(self):
        with self.assertRaises(q.ProjectError): q.apply(self.root,self.p,args('start','Q-001',agent='x'))
    def test_owner_gate_requires_report_and_flag(self):
        with self.assertRaises(q.ProjectError): q.apply(self.root,self.p,args('gate','Q-001',by='x',note='x'))
    def test_template_is_not_approval(self):
        with self.assertRaises(q.ProjectError): q.apply(self.root,self.p,args('gate','Q-001',by='x',note='x',
             evidence='reports/P0_APPROVAL_TEMPLATE.md',owner_confirmed=True))
    def test_owner_decision_unblocks_next(self):
        self.gate_first(); self.assertTrue(q.is_ready(self.p,q.get_task(self.p,'Q-002')))
    def test_cannot_start_twice(self):
        self.start_second()
        with self.assertRaises(q.ProjectError): q.apply(self.root,self.p,args('start','Q-002',agent='other'))
    def test_review_does_not_unblock_dependencies(self):
        self.start_second(); self.submit_second()
        self.assertFalse(q.is_ready(self.p,q.get_task(self.p,'Q-003')))
    def test_agent_cannot_accept_without_explicit_owner_declaration(self):
        self.start_second(); self.submit_second()
        with self.assertRaises(q.ProjectError): q.apply(self.root,self.p,args('accept','Q-002',by='agent',note='x'))
    def test_owner_accept_records_proof_and_unblocks(self):
        self.start_second(); self.submit_second()
        self.p=q.apply(self.root,self.p,args('accept','Q-002',by='owner',note='reviewed test',owner_confirmed=True))
        self.assertEqual(q.get_task(self.p,'Q-002')['status'],'DONE')
        self.assertTrue(q.is_ready(self.p,q.get_task(self.p,'Q-003')))
    def test_not_run_cannot_be_accepted(self):
        self.start_second(); self.submit_second('not_run')
        with self.assertRaises(q.ProjectError): q.apply(self.root,self.p,args('accept','Q-002',by='owner',note='x',owner_confirmed=True))
    def test_missing_ac_not_submittable(self):
        self.start_second(); name=self.handoff(); h=q.read_json(self.root/name); h['ac_results'].pop()
        (self.root/name).write_text(json.dumps(h))
        with self.assertRaises(q.ProjectError): q.apply(self.root,self.p,args('submit','Q-002',handoff=name))
    def test_pass_needs_evidence(self):
        self.start_second(); name=self.handoff(); h=q.read_json(self.root/name); h['ac_results'][0]['evidence']=[]
        (self.root/name).write_text(json.dumps(h))
        with self.assertRaises(q.ProjectError): q.validate_handoff(self.root,q.get_task(self.p,'Q-002'),name)
    def test_missing_evidence_path_rejected(self):
        self.start_second(); name=self.handoff(); h=q.read_json(self.root/name); h['ac_results'][0]['evidence']=['reports/not-there.md']
        (self.root/name).write_text(json.dumps(h))
        with self.assertRaises(q.ProjectError): q.validate_handoff(self.root,q.get_task(self.p,'Q-002'),name)
    def test_blocker_prevents_accept(self):
        self.start_second(); self.submit_second(blockers=['critical'])
        with self.assertRaises(q.ProjectError): q.apply(self.root,self.p,args('accept','Q-002',by='owner',note='x',owner_confirmed=True))
    def test_reject_returns_to_todo_not_done(self):
        self.start_second(); self.submit_second()
        self.p=q.apply(self.root,self.p,args('reject','Q-002',by='owner',note='fix',owner_confirmed=True))
        self.assertEqual(q.get_task(self.p,'Q-002')['status'],'TODO')
        self.assertIn('fix',q.get_task(self.p,'Q-002')['review_note'])
    def test_checkpoint_preserves_doing(self):
        self.start_second(); name=self.handoff('not_run')
        self.p=q.apply(self.root,self.p,args('checkpoint','Q-002',handoff=name))
        self.assertEqual(q.get_task(self.p,'Q-002')['status'],'DOING')
        self.assertEqual(q.get_task(self.p,'Q-002')['checkpoint'],name)
    def test_resume_requires_owner(self):
        self.start_second()
        self.p=q.apply(self.root,self.p,args('block','Q-002',reason='need access'))
        with self.assertRaises(q.ProjectError): q.apply(self.root,self.p,args('resume','Q-002',agent='new'))
        self.p=q.apply(self.root,self.p,args('resume','Q-002',agent='new',by='owner',note='handoff approved',owner_confirmed=True))
        self.assertEqual(q.get_task(self.p,'Q-002')['assignee'],'new')
    def test_cyclic_dependencies_detected(self):
        q.get_task(self.p,'Q-001')['depends_on']=['Q-002']
        with self.assertRaises(q.ProjectError): q.structural(self.root,self.p)
    def test_duplicate_ids_detected(self):
        self.p['tasks'].append(copy.deepcopy(self.p['tasks'][0]))
        with self.assertRaises(q.ProjectError): q.structural(self.root,self.p)
    def test_future_task_disabled(self):
        self.assertFalse(q.get_task(self.p,'Q-026')['enabled'])
        with self.assertRaises(q.ProjectError): q.apply(self.root,self.p,args('start','Q-026',agent='x'))
    def test_phase_cannot_skip_unaccepted_gate(self):
        self.p['current_phase']='P2'
        with self.assertRaises(q.ProjectError): q.structural(self.root,self.p)
    def test_selected_branch_requires_gate_dependency(self):
        self.p['selected_expansion_tasks']=['Q-026']; q.get_task(self.p,'Q-026')['enabled']=True
        with self.assertRaises(q.ProjectError): q.structural(self.root,self.p)
    def test_generated_view_drift_detected(self):
        (self.root/'docs/STATE.md').write_text('invented done')
        with self.assertRaises(q.ProjectError): q.validate(self.root)
        q.render(self.root,self.p); self.assertTrue(q.validate(self.root))
    def test_accepted_handoff_tampering_detected(self):
        self.start_second(); self.submit_second()
        self.p=q.apply(self.root,self.p,args('accept','Q-002',by='owner',note='ok',owner_confirmed=True))
        hp=self.root/'handoffs/Q-002.json'; h=q.read_json(hp); h['summary']='tampered'; hp.write_text(json.dumps(h))
        with self.assertRaises(q.ProjectError): q.structural(self.root,self.p)
    def test_original_archive_tampering_detected(self):
        (self.root/'docs/archive/v0.2/README.md').write_text('different')
        with self.assertRaises(q.ProjectError): q.structural(self.root,self.p)
    def test_no_path_escape(self):
        with self.assertRaises(q.ProjectError): q.inside(self.root,'../escape.json')
    def test_agent_rules_match(self):
        (self.root/'CLAUDE.md').write_text('different')
        with self.assertRaises(q.ProjectError): q.structural(self.root,self.p)
    def test_feature_link_to_unknown_task_rejected(self):
        fs=q.read_json(self.root/'tasks/features.json'); fs['features'][0]['implementation_tasks'].append('Q-NOT-THERE')
        (self.root/'tasks/features.json').write_text(json.dumps(fs))
        with self.assertRaises(q.ProjectError): q.structural(self.root,self.p)
    def test_tool_does_not_write_state_on_failed_mutation(self):
        before=(self.root/'tasks/project.json').read_bytes()
        rc=q.main(['--root',str(self.root),'start','Q-002','--agent','test'])
        self.assertEqual(rc,2); self.assertEqual(before,(self.root/'tasks/project.json').read_bytes())

if __name__=='__main__': unittest.main()
