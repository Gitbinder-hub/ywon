import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
import warnings
import zipfile

spec = importlib.util.spec_from_file_location('full_tree', Path(__file__).resolve().parents[1] / 'scripts/apply_full_tree.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class TransferTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.home = Path(self.temp.name)
        self.repo = self.home / 'repo'
        self.repo.mkdir()
        self.run_git('init', '-b', 'transfer/test')
        (self.repo / 'old.txt').write_text('old')
        (self.repo / 'keep.txt').write_text('preserve me')
        self.run_git('add', '.')
        self.run_git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@invalid', 'commit', '-m', 'fixture')
        self.archive = self.home / 'payload.zip'
        self.manifest = self.make_payload({'old.txt': b'new', 'docs/INDEX.md': b'v0.4 fixture'})

    def tearDown(self):
        self.temp.cleanup()

    def run_git(self, *args):
        return subprocess.check_output(['git', '-C', str(self.repo), *args], text=True, stderr=subprocess.DEVNULL).strip()

    def make_payload(self, files, duplicate=False):
        with zipfile.ZipFile(self.archive, 'w') as z:
            for name, data in files.items():
                z.writestr('Ywoom-foundation/' + name, data)
            if duplicate:
                name = next(iter(files))
                with warnings.catch_warnings():
                    warnings.simplefilter('ignore', UserWarning)
                    z.writestr('Ywoom-foundation/' + name, files[name])
        return {'expected_head': self.run_git('rev-parse', 'HEAD'), 'archive_prefix': 'Ywoom-foundation/',
                'archive_sha256': hashlib.sha256(self.archive.read_bytes()).hexdigest(),
                'files': {name: hashlib.sha256(data).hexdigest() for name, data in files.items()}}

    def apply(self, manifest=None, backup=None):
        return module.transfer(self.repo, self.archive, manifest or self.manifest, backup)

    def test_default_preflight_does_not_write(self):
        result = self.apply()
        self.assertEqual(result['mode'], 'preflight')
        self.assertEqual((self.repo / 'old.txt').read_text(), 'old')
        self.assertFalse((self.repo / 'docs').exists())
        self.assertEqual(self.run_git('status', '--porcelain'), '')

    def test_apply_preserves_history_extra_files_and_backup(self):
        before = self.run_git('rev-parse', 'HEAD')
        result = self.apply(backup=self.home / 'backup')
        self.assertEqual(result['mode'], 'applied_locally')
        self.assertEqual(result['remote_import'], 'not_performed')
        self.assertEqual((self.repo / 'old.txt').read_text(), 'new')
        self.assertEqual((self.repo / 'keep.txt').read_text(), 'preserve me')
        self.assertEqual(self.run_git('rev-parse', 'HEAD'), before)
        self.assertTrue((self.home / 'backup/history.bundle').exists())
        with zipfile.ZipFile(self.home / 'backup/before-files.zip') as z:
            self.assertEqual(z.read('old.txt'), b'old')
        self.assertTrue(self.run_git('status', '--porcelain'))

    def test_dirty_tree_refused_before_backup_or_writes(self):
        (self.repo / 'keep.txt').write_text('another agent change')
        with self.assertRaisesRegex(ValueError, 'Dirty repository'):
            self.apply(backup=self.home / 'backup')
        self.assertFalse((self.home / 'backup').exists())
        self.assertEqual((self.repo / 'old.txt').read_text(), 'old')

    def test_changed_head_refused(self):
        manifest = copy.deepcopy(self.manifest)
        manifest['expected_head'] = '0' * 40
        with self.assertRaisesRegex(ValueError, 'HEAD changed'):
            self.apply(manifest)

    def test_corrupt_archive_refused(self):
        self.archive.write_bytes(self.archive.read_bytes() + b'corrupt')
        with self.assertRaisesRegex(ValueError, 'SHA-256 mismatch'):
            self.apply()

    def test_unsafe_path_refused_before_writes(self):
        self.manifest = self.make_payload({'../escape.txt': b'no'})
        with self.assertRaisesRegex(ValueError, 'Unsafe/reserved'):
            self.apply()
        self.assertFalse((self.home / 'escape.txt').exists())

    def test_duplicate_zip_entry_refused(self):
        self.manifest = self.make_payload({'old.txt': b'new'}, duplicate=True)
        with self.assertRaisesRegex(ValueError, 'Duplicate ZIP'):
            self.apply()

    def test_ignored_symlink_destination_refused(self):
        (self.repo / '.gitignore').write_text('docs\n')
        self.run_git('add', '.gitignore')
        self.run_git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@invalid', 'commit', '-m', 'ignore fixture')
        outside = self.home / 'outside'
        outside.mkdir()
        (self.repo / 'docs').symlink_to(outside, target_is_directory=True)
        self.manifest['expected_head'] = self.run_git('rev-parse', 'HEAD')
        with self.assertRaises(ValueError):
            self.apply()
        self.assertFalse((outside / 'INDEX.md').exists())

    def test_main_branch_refused(self):
        self.run_git('branch', '-m', 'main')
        with self.assertRaisesRegex(ValueError, 'explicit work branch'):
            self.apply()

    def test_runtime_blob_change_refused(self):
        self.manifest['unchanged_runtime_blobs'] = {'old.txt': self.run_git('hash-object', 'old.txt')}
        with self.assertRaisesRegex(ValueError, 'Reviewed runtime differs'):
            self.apply()


if __name__ == '__main__':
    unittest.main()
