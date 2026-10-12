import contextlib
import importlib.util
import io
import json
from pathlib import Path
import shutil
import tempfile
import unittest
from unittest import mock

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('registry_sync', ROOT/'scripts/sync_q001_q002.py')
sync = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sync)

class RegistrySyncTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)/'repo'
        # Copy source definitions, then install the capsule's initial four-file state.
        shutil.copytree(ROOT, self.root, ignore=shutil.ignore_patterns('.git','node_modules','__pycache__','.venv'))
        c = json.loads((self.root/sync.CAPSULE).read_text())
        hashes = self.hashes()
        if all(hashes[p] == c['targets'][p]['after'] for p in sync.TARGETS):
            # Reverse only in this disposable copy, never in the actual repository.
            sync.run(self.root, ['git', 'apply', '--reverse', str(self.root/sync.PATCH)])
        elif not all(hashes[p] == c['targets'][p]['before'] for p in sync.TARGETS):
            self.fail('The source fixture must have a coherent before/after graph')
        self.git('init', '-b', sync.BRANCH)
        self.git('config','user.name','Synthetic unit-test fixture')
        self.git('config','user.email','unit-test@example.invalid')
        self.git('add','.')
        self.git('commit','-m','Synthetic test source only; never pushed')
        c['published_evidence_commit'] = self.git('rev-parse','HEAD')
        (self.root/sync.CAPSULE).write_text(json.dumps(c,indent=2)+'\n')
        self.git('add',sync.CAPSULE)
        self.git('commit','-m','Test-only ancestry fixture')
        self.c = c
        self.before = self.hashes()
    def git(self,*args):
        return sync.run(self.root,['git',*args])
    def hashes(self):
        return {p:sync.blob((self.root/p).read_bytes()) for p in sync.TARGETS}
    def call(self,apply=False):
        with contextlib.redirect_stdout(io.StringIO()):
            return sync.synchronize(self.root,apply)
    def assert_stopped_unchanged(self):
        before=self.hashes()
        with self.assertRaises(sync.SyncError):self.call(True)
        self.assertEqual(self.hashes(),before)
    def test_default_preflight_does_not_write(self):
        self.assertEqual(self.call(),'preflight')
        self.assertEqual(self.hashes(),self.before)
        self.assertEqual(self.git('status','--porcelain'),'')
    def test_apply_exact_four_files_and_keeps_review_gate(self):
        self.assertEqual(self.call(True),'applied')
        self.assertEqual(self.hashes(),{p:self.c['targets'][p]['after'] for p in sync.TARGETS})
        p=json.loads((self.root/'tasks/project.json').read_text())
        states={t['id']:t['status'] for t in p['tasks']}
        self.assertEqual([states['Q-001'],states['Q-002'],states['Q-003']],['DONE','REVIEW','TODO'])
        self.assertEqual(p['current_phase'],'P0')
        self.assertEqual(len(list((self.root/'.git/Ywoom-registry-backups').glob('q001-q002-*'))),1)
    def test_second_apply_is_noop(self):
        self.call(True)
        after=self.hashes()
        self.assertEqual(self.call(True),'already')
        self.assertEqual(self.hashes(),after)
    def test_main_branch_is_refused(self):
        self.git('switch','-c','main')
        self.assert_stopped_unchanged()
    def test_dirty_unrelated_source_is_refused(self):
        with (self.root/'README.md').open('a') as f:f.write('\nUncommitted owner content\n')
        self.assert_stopped_unchanged()
    def test_patch_tamper_is_refused(self):
        with (self.root/sync.PATCH).open('a') as f:f.write('\n')
        self.assert_stopped_unchanged()
    def test_approval_evidence_tamper_is_refused(self):
        (self.root/'reports/P0_APPROVAL.md').write_text('APPROVED: NO\n')
        self.assert_stopped_unchanged()
    def test_partial_state_is_refused(self):
        partial = Path(self.tmp.name)/'partial'
        for name in sync.TARGETS:
            dst = partial/name
            dst.parent.mkdir(parents=True,exist_ok=True)
            dst.write_bytes((self.root/name).read_bytes())
        sync.run(partial,['git','apply',str(self.root/sync.PATCH)])
        (self.root/'docs/STATE.md').write_bytes((partial/'docs/STATE.md').read_bytes())
        self.assert_stopped_unchanged()
    def test_unrelated_committed_file_is_preserved(self):
        p=self.root/'OWNER_EXTRA.txt';p.write_text('Keep this owner file exactly.\n')
        self.git('add','OWNER_EXTRA.txt');self.git('commit','-m','Synthetic unrelated owner file')
        self.call(True)
        self.assertEqual(p.read_text(),'Keep this owner file exactly.\n')
    def test_post_write_validation_failure_rolls_back_exact_targets(self):
        original=sync.run
        def fail_post(root,command):
            if root==self.root and command==['python3','scripts/project.py','validate']:
                raise sync.SyncError('Synthetic post-write validation failure')
            return original(root,command)
        with mock.patch.object(sync,'run',side_effect=fail_post):
            self.assert_stopped_unchanged()
        self.assertEqual(self.git('status','--porcelain'),'')

if __name__=='__main__':unittest.main()
