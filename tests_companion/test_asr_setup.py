"""Offline provisioning boundary tests; no downloads, installs or real audio."""
import hashlib
import importlib.util
from pathlib import Path
import stat
import shutil
import uuid
import subprocess
from contextlib import contextmanager
import unittest
from unittest.mock import patch
import zipfile

spec = importlib.util.spec_from_file_location('asr_install', Path(__file__).resolve().parents[1] / 'scripts/companion_asr_install.py')
setup = importlib.util.module_from_spec(spec)
spec.loader.exec_module(setup)


@contextmanager
def temporary_dir():
    # Python 3.14 mkdtemp's Windows private ACL prevents this sandbox token from
    # reopening its own files. Use an inherited-ACL workspace fixture directory.
    base = (Path(__file__).resolve().parents[1] / 'outputs/asr-setup-tests').resolve()
    base.mkdir(parents=True, exist_ok=True)
    folder = base / uuid.uuid4().hex
    folder.mkdir()
    try:
        yield str(folder)
    finally:
        if folder.resolve().parent != base or folder.is_symlink():
            raise RuntimeError('Unsafe test cleanup path')
        shutil.rmtree(folder)


class SetupTests(unittest.TestCase):
    def test_default_runtime_is_short_and_outside_deep_package(self):
        with patch.dict(setup.os.environ, {'LOCALAPPDATA': r'C:\Users\Test\AppData\Local'}):
            parent = setup.runtime_parent()
            self.assertEqual(parent, Path(r'C:\Users\Test\AppData\Local\Ywon\ASR'))
            self.assertLessEqual(len(str(parent / 'r-12345678')), 120)

    def test_relative_and_long_runtime_paths_fail_before_install(self):
        with self.assertRaisesRegex(ValueError, 'must_be_absolute'):
            setup.runtime_parent(Path('relative'))
        with self.assertRaisesRegex(ValueError, 'too_long'):
            setup.runtime_parent(Path('C:/') / ('x' * 121))

    def test_private_runtime_choice_is_validated_and_cli_can_override(self):
        with temporary_dir() as folder:
            root = Path(folder)
            options = root / 'local-asr-setup.json'
            options.write_text('{"schemaVersion":1,"runtimeBase":"E:/Ywon-ASR"}')
            self.assertEqual(setup.setup_runtime(root, None), Path('E:/Ywon-ASR'))
            self.assertEqual(setup.setup_runtime(root, Path('E:/Alternative')), Path('E:/Alternative'))
            options.write_text('{"schemaVersion":1,"runtimeBase":"relative"}')
            with self.assertRaisesRegex(ValueError, 'absolute'):
                setup.setup_runtime(root, None)
            options.write_text('{"schemaVersion":1,"runtimeBase":"E:/Ywon-ASR","install":true}')
            with self.assertRaisesRegex(ValueError, 'invalid_local_setup_options'):
                setup.setup_runtime(root, None)

    def test_existing_download_is_revalidated_without_network(self):
        with temporary_dir() as folder:
            root = Path(folder)
            cached = root / 'local-asr-runtime/setup-fixture' / (setup.MODEL_ID + '.zip')
            cached.parent.mkdir(parents=True)
            cached.write_bytes(b'model-fixture')
            expected = hashlib.sha256(cached.read_bytes()).hexdigest()
            verify = setup.verify_archive
            partial = root / 'local-asr-runtime/setup-000-partial' / (setup.MODEL_ID + '.zip')
            partial.parent.mkdir(parents=True)
            partial.write_bytes(b'partial')
            with patch.object(setup, 'MODEL_BYTES', 13), \
                 patch.object(setup, 'verify_archive', side_effect=lambda p: verify(p, expected, 13)), \
                 patch.object(setup, 'download_model') as download:
                self.assertEqual(setup.cached_model(root), cached)
                self.assertEqual(partial.read_bytes(), b'partial')
                cached.write_bytes(b'tampered-data')
                with self.assertRaisesRegex(ValueError, 'hash_mismatch'):
                    setup.cached_model(root)
                download.assert_not_called()

    def test_subprocess_stage_and_exit_are_preserved_without_retry(self):
        with patch.object(setup.subprocess, 'run', side_effect=subprocess.CalledProcessError(1, ['python'])) as run:
            with self.assertRaisesRegex(ValueError, 'ensurepip_exit_1'):
                setup.run_step(['python'], 'ensurepip')
            run.assert_called_once()

    def test_model_hash_and_length_must_both_match(self):
        with temporary_dir() as folder:
            path = Path(folder) / 'fixture.zip'
            path.write_bytes(b'model-fixture')
            expected = hashlib.sha256(path.read_bytes()).hexdigest()
            setup.verify_archive(path, expected, 13)
            with self.assertRaisesRegex(ValueError, 'hash_mismatch'):
                setup.verify_archive(path, '0' * 64, 13)
            with self.assertRaisesRegex(ValueError, 'hash_mismatch'):
                setup.verify_archive(path, expected, 14)

    def test_normal_model_is_extracted_into_fresh_folder(self):
        with temporary_dir() as folder:
            path = Path(folder) / 'fixture.zip'
            with zipfile.ZipFile(path, 'w') as z:
                z.writestr(setup.MODEL_ID + '/conf/model.conf', 'test')
            target = Path(folder) / 'model'
            root = setup.extract_model(path, target)
            self.assertEqual((root / 'conf/model.conf').read_text(), 'test')
            with self.assertRaisesRegex(ValueError, 'output_exists'):
                setup.extract_model(path, target)

    def test_traversal_windows_paths_other_roots_rejected_before_writes(self):
        for name in ['../escape.txt', '/absolute', 'C:/file',
                     setup.MODEL_ID + '/../../escape', setup.MODEL_ID + r'\..\..\escape',
                     'other-model/file', setup.MODEL_ID + '/file:stream']:
            with self.subTest(name=name), temporary_dir() as folder:
                path = Path(folder) / 'fixture.zip'
                with zipfile.ZipFile(path, 'w') as z:
                    z.writestr(name, 'test')
                target = Path(folder) / 'model'
                with self.assertRaisesRegex(ValueError, 'unsafe_model_archive'):
                    setup.extract_model(path, target)
                self.assertFalse(target.exists())

    def test_links_and_case_collisions_rejected_before_writes(self):
        for kind in ['symlink', 'case']:
            with self.subTest(kind=kind), temporary_dir() as folder:
                path = Path(folder) / 'fixture.zip'
                with zipfile.ZipFile(path, 'w') as z:
                    if kind == 'symlink':
                        info = zipfile.ZipInfo(setup.MODEL_ID + '/link')
                        info.create_system = 3
                        info.external_attr = (stat.S_IFLNK | 0o777) << 16
                        z.writestr(info, '../elsewhere')
                    else:
                        z.writestr(setup.MODEL_ID + '/File.txt', 'a')
                        z.writestr(setup.MODEL_ID + '/file.txt', 'b')
                target = Path(folder) / 'model'
                with self.assertRaisesRegex(ValueError, 'unsafe_model_archive'):
                    setup.extract_model(path, target)
                self.assertFalse(target.exists())

    def test_extra_members_rejected(self):
        with temporary_dir() as folder:
            path = Path(folder) / 'fixture.zip'
            with zipfile.ZipFile(path, 'w') as z:
                for i in range(65):
                    z.writestr(setup.MODEL_ID + f'/{i}.txt', 'a')
            with self.assertRaisesRegex(ValueError, 'archive_limit'):
                setup.extract_model(path, Path(folder) / 'model')

    def test_default_check_does_not_install_or_download(self):
        with patch.object(setup, 'preflight', return_value={'installed': False}), \
             patch.object(setup, 'install') as install, \
             patch.object(setup, 'download_model') as download:
            self.assertEqual(setup.main([]), 0)
            install.assert_not_called()
            download.assert_not_called()

    def test_failure_does_not_retry(self):
        with patch.object(setup, 'install', side_effect=ValueError('model_download_hash_mismatch')) as install:
            self.assertEqual(setup.main(['--install-local-asr']), 2)
            install.assert_called_once()


if __name__ == '__main__':
    unittest.main()
