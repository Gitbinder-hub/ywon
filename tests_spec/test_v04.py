import copy, json, shutil, tempfile, unittest
from pathlib import Path
from test_project import q, ROOT, initial_fixture

class V04Checks(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name)/'repo'
        shutil.copytree(ROOT,self.root,ignore=shutil.ignore_patterns('__pycache__','.git','node_modules','.venv'))
        self.p=initial_fixture(self.root)
    def tearDown(self):self.tmp.cleanup()
    def test_v04_valid_and_unimplemented(self):
        self.assertTrue(q.validate(self.root));self.assertEqual(self.p['spec_version'],'0.4.0')
        self.assertEqual(self.p['product_implementation'],'not_started')
        self.assertTrue(all(t['status']=='TODO' for t in self.p['tasks']))
    def test_v03_archive_tamper(self):
        (self.root/'docs/archive/v0.3/README.md').write_text('changed')
        with self.assertRaises(q.ProjectError):q.structural(self.root,self.p)
    def test_requirement_missing_doc(self):
        x=q.read_json(self.root/'docs/requirements.json');x['requirements'][0]['document']='docs/missing.md'
        (self.root/'docs/requirements.json').write_text(json.dumps(x))
        with self.assertRaises(q.ProjectError):q.structural(self.root,self.p)
    def test_requirement_unknown_task(self):
        x=q.read_json(self.root/'docs/requirements.json');x['requirements'][0]['tasks']=['Q-MISSING']
        (self.root/'docs/requirements.json').write_text(json.dumps(x))
        with self.assertRaises(q.ProjectError):q.structural(self.root,self.p)
    def test_requirement_unknown_feature(self):
        x=q.read_json(self.root/'docs/requirements.json');x['requirements'][0]['features']=['F-MISSING']
        (self.root/'docs/requirements.json').write_text(json.dumps(x))
        with self.assertRaises(q.ProjectError):q.structural(self.root,self.p)
    def test_requirement_duplicates(self):
        x=q.read_json(self.root/'docs/requirements.json');x['requirements'].append(copy.deepcopy(x['requirements'][0]))
        (self.root/'docs/requirements.json').write_text(json.dumps(x))
        with self.assertRaises(q.ProjectError):q.structural(self.root,self.p)
    def test_release_gate_requires_mobile_ancestry(self):
        q.get_task(self.p,'Q-049G')['depends_on'].remove('Q-047')
        with self.assertRaises(q.ProjectError):q.structural(self.root,self.p)
    def test_release_required_task_not_disabled(self):
        q.get_task(self.p,'Q-046')['enabled']=False
        with self.assertRaises(q.ProjectError):q.structural(self.root,self.p)
    def test_p2_gate_contains_editor_evidence(self):
        gate=q.get_task(self.p,'Q-015G')
        self.assertIn('Q-041',gate['depends_on']);self.assertIn('Q-040',gate['depends_on'])
    def test_p1_gate_contains_document_cost_shell(self):
        gate=q.get_task(self.p,'Q-010G')
        for tid in ['Q-036','Q-037','Q-044']:self.assertIn(tid,gate['depends_on'])
    def test_original_features_preserved_mobile_promoted(self):
        fs=q.read_json(self.root/'tasks/features.json')['features'];m={f['id']:f for f in fs}
        for n in range(1,42):self.assertIn('F%02d'%n,m)
        self.assertEqual(m['F39']['first_phase'],'P6');self.assertEqual(m['F41']['first_phase'],'FUTURE')
    def test_active_contexts_not_archival(self):
        for t in self.p['tasks']:
            self.assertTrue(all('docs/archive/' not in x for x in t['context']))
    def test_source_snapshot_matches_original_manifest(self):
        x=q.read_json(self.root/'docs/archive/v0.3/SOURCE_MANIFEST.json')
        self.assertIn('tasks/project.json',x['files']);self.assertIn('PACKAGE_MANIFEST.json',x['files'])
        self.assertTrue(all(not k.startswith('docs/archive/') for k in x['files']))

if __name__=='__main__':unittest.main()
