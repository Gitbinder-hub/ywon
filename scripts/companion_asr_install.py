"""Explicit Windows provisioning helper; normal audio startup never invokes this.

Default is a read-only check. --install-local-asr allows official model download
and hash-locked PyPI installation in a fresh private runtime folder. No audio,
provider, admin, firewall or OS permission actions. Partial runs are preserved.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import platform
import re
import shutil
import stat
import struct
import subprocess
import sys
import urllib.request
import uuid
import zipfile

ROOT = Path(__file__).resolve().parents[1]
MODEL_ID = 'vosk-model-small-ru-0.22'
MODEL_URL = 'https://alphacephei.com/vosk/models/' + MODEL_ID + '.zip'
MODEL_BYTES = 46236750
MODEL_SHA256 = '961d5ff98a17f4aa6de69864d0aa71fa5bac682301d2b5d17a3f24c5c99a46d4'
LOCK_HASHES = {
    'requirements-asr.txt': '8d440571d732ab6b18617a253b5a566aa15e0b8fc3145e4a9f9e0a13378fcd58',
    'requirements-asr-build.txt': '45bdbc396f783aadb2fcb2ffd682282b835b06a8e0da6f98c7efd74df5e3e12e',
}


def sha256(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        while chunk := stream.read(1024 * 1024):
            digest.update(chunk)
    return digest.hexdigest()


def ordinary_path(path):
    for part in (path, *path.parents):
        if part.is_symlink() or (hasattr(part, 'is_junction') and part.is_junction()):
            raise ValueError('linked_setup_path_denied')


def verify_archive(path, expected_hash=MODEL_SHA256, expected_size=MODEL_BYTES):
    if path.stat().st_size != expected_size or sha256(path) != expected_hash:
        raise ValueError('model_download_hash_mismatch')


def extract_model(archive, target):
    """Validate the entire member list before writing into a fresh directory."""
    if target.exists():
        raise ValueError('model_output_exists')
    ordinary_path(target)
    with zipfile.ZipFile(archive) as package:
        members = package.infolist()
        names = set()
        total = count = 0
        for member in members:
            name = member.filename
            path = PurePosixPath(name)
            if (not re.fullmatch(r'[A-Za-z0-9_./-]{1,240}', name)
                    or path.is_absolute() or '..' in path.parts
                    or not path.parts or path.parts[0] != MODEL_ID
                    or str(path).lower() in names
                    or member.flag_bits & 1):
                raise ValueError('unsafe_model_archive')
            names.add(str(path).lower())
            mode = member.external_attr >> 16
            if stat.S_IFMT(mode) not in (0, stat.S_IFREG, stat.S_IFDIR):
                raise ValueError('unsafe_model_archive')
            if not member.is_dir():
                count += 1
                total += member.file_size
            if count > 64 or total > 100 * 1024 * 1024 or len(members) > 100:
                raise ValueError('model_archive_limit')
        target.mkdir()
        for member in members:
            destination = target.joinpath(*PurePosixPath(member.filename).parts)
            if member.is_dir():
                destination.mkdir(parents=True, exist_ok=True)
                continue
            destination.parent.mkdir(parents=True, exist_ok=True)
            written = 0
            with package.open(member) as source, destination.open('xb') as output:
                while chunk := source.read(1024 * 1024):
                    written += len(chunk)
                    if written > member.file_size:
                        raise ValueError('model_archive_limit')
                    output.write(chunk)
    return target / MODEL_ID


def runtime_parent(runtime_base=None):
    if runtime_base is None:
        local = os.environ.get('LOCALAPPDATA')
        if not local:
            raise ValueError('localappdata_missing_choose_runtime_base')
        runtime_base = Path(local) / 'Ywon' / 'ASR'
    parent = Path(runtime_base)
    if not parent.is_absolute():
        raise ValueError('runtime_base_must_be_absolute')
    ordinary_path(parent)
    parent = parent.resolve()
    # Leave room for venv packages/native model filenames. LongPathsEnabled does
    # not make CreateProcess accept every venv-launcher path over MAX_PATH.
    if len(str(parent / 'r-12345678')) > 120:
        raise ValueError('runtime_path_too_long_choose_shorter_runtime_base')
    return parent


def existing_disk_path(path):
    while not path.exists():
        path = path.parent
    return path


def setup_runtime(root, runtime_base):
    # Optional private per-computer choice, never shipped in a source archive.
    local = root / 'local-asr-setup.json'
    if runtime_base is None and local.exists():
        ordinary_path(local)
        if not local.is_file() or local.stat().st_size > 4096:
            raise ValueError('invalid_local_setup_options')
        value = json.loads(local.read_text('utf-8'))
        if (not isinstance(value, dict) or set(value) != {'schemaVersion', 'runtimeBase'}
                or value['schemaVersion'] != 1 or not isinstance(value['runtimeBase'], str)):
            raise ValueError('invalid_local_setup_options')
        runtime_base = Path(value['runtimeBase'])
    return runtime_parent(runtime_base)


def cached_model(root=ROOT):
    """Only reuse the original package's exact model cache after full revalidation."""
    parent = root / 'local-asr-runtime'
    ordinary_path(parent)
    incomplete = False
    for path in sorted(parent.glob('setup-*/' + MODEL_ID + '.zip')):
        ordinary_path(path)
        # Earlier cancelled downloads can coexist with the completed one.
        # Never load them or delete them; only a complete, hash-verified file is usable.
        if path.stat().st_size < MODEL_BYTES:
            incomplete = True
            continue
        verify_archive(path)
        return path
    if incomplete:
        raise ValueError('only_incomplete_model_cache_found')
    return None


def preflight(root=ROOT, runtime_base=None):
    ordinary_path(root)
    if (platform.system() != 'Windows' or platform.python_implementation() != 'CPython'
            or struct.calcsize('P') != 8 or not (3, 10) <= sys.version_info[:2] <= (3, 14)):
        raise ValueError('requires_windows_x64_cpython_310_to_314')
    for name, expected in LOCK_HASHES.items():
        if sha256(root / 'workers' / 'companion' / name) != expected:
            raise ValueError('dependency_lock_changed')
    if (root / 'local-asr-config').exists():
        raise ValueError('config_already_exists_use_START_ASR_or_review_manually')
    parent = setup_runtime(root, runtime_base)
    if shutil.disk_usage(existing_disk_path(parent)).free < 700 * 1024 * 1024:
        raise ValueError('requires_700_MiB_free_disk')
    cache = cached_model(root)
    return {'python': platform.python_version(), 'platform': platform.platform(),
            'modelUrl': MODEL_URL, 'modelBytes': MODEL_BYTES,
            'runtimeBase': str(parent), 'verifiedModelCache': cache is not None,
            'dependencyIndex': 'https://pypi.org/simple',
            'nativeCompatibility': 'requires_actual_install_and_probe',
            'installed': False, 'microphoneEnabled': False, 'paidCalls': False}


def download_model(path):
    # Use default TLS/proxy handling. No certificate or network-policy bypass.
    with urllib.request.urlopen(MODEL_URL, timeout=30) as response, path.open('xb') as out:
        if response.geturl() != MODEL_URL:
            raise ValueError('unexpected_model_redirect')
        total = 0
        while chunk := response.read(1024 * 1024):
            total += len(chunk)
            if total > MODEL_BYTES:
                raise ValueError('model_download_size_limit')
            out.write(chunk)
    verify_archive(path)


def run_step(args, label, **kwargs):
    try:
        return subprocess.run(args, check=True, **kwargs)
    except subprocess.CalledProcessError as error:
        raise ValueError(label + '_exit_' + str(error.returncode)) from error
    except subprocess.TimeoutExpired as error:
        raise ValueError(label + '_timeout') from error
    except OSError as error:
        raise ValueError(label + '_os_error_' + str(getattr(error, 'winerror', None) or error.errno)) from error


def install(root=ROOT, runtime_base=None):
    preflight(root, runtime_base)
    parent = setup_runtime(root, runtime_base)
    cache = cached_model(root)
    parent.mkdir(parents=True, exist_ok=True)
    run = parent / ('r-' + uuid.uuid4().hex[:8])
    run.mkdir()
    temp = run / 'tmp'
    temp.mkdir()
    environment = os.environ.copy()
    environment.update({'TMP': str(temp), 'TEMP': str(temp)})
    print('Setup folder: ' + str(run), flush=True)
    archive = run / (MODEL_ID + '.zip')
    if cache is not None:
        print('1/5 Reusing verified model download; no model network request.', flush=True)
        with cache.open('rb') as source, archive.open('xb') as output:
            shutil.copyfileobj(source, output)
        verify_archive(archive)
    else:
        print('1/5 Downloading official Russian model (46 MB); SHA256 must match.', flush=True)
        download_model(archive)
    model = extract_model(archive, run / 'models')
    print('2/5 Creating isolated Python environment.', flush=True)
    run_step([sys.executable, '-I', '-X', 'utf8', '-m', 'venv', '--without-pip', str(run / 'venv')],
             'venv_create', timeout=120, env=environment)
    python = run / 'venv' / 'Scripts' / 'python.exe'
    # Invoke ensurepip separately: venv otherwise hides its child's useful error.
    run_step([str(python), '-I', '-X', 'utf8', '-m', 'ensurepip', '--upgrade', '--default-pip'],
             'ensurepip', timeout=120, env=environment)
    print('3/5 Installing exact hash-locked dependencies from PyPI.', flush=True)
    base = [str(python), '-I', '-X', 'utf8', '-m', 'pip', '--isolated',
            '--disable-pip-version-check', 'install', '--index-url', 'https://pypi.org/simple',
            '--no-cache-dir', '--require-hashes', '--retries', '0', '--timeout', '30']
    run_step(base + ['--only-binary=:all:', '-r',
                   str(root / 'workers/companion/requirements-asr-build.txt')],
                   'build_dependencies', timeout=600, env=environment)
    run_step(base + ['--only-binary=:all:', '--no-binary=srt', '--no-build-isolation',
                   '-r', str(root / 'workers/companion/requirements-asr.txt')],
                   'runtime_dependencies', timeout=600, env=environment)
    run_step([str(python), '-I', '-X', 'utf8', '-m', 'pip', '--isolated', 'check'],
             'dependency_check', timeout=60, env=environment)
    print('4/5 Inspecting model and testing native engine with one second of silence.', flush=True)
    staged = run / 'staged-config'
    run_step([str(python), '-I', '-X', 'utf8', str(root / 'scripts/companion_asr_setup.py'),
                    '--model-root', str(model), '--python-executable', str(python),
                    '--output-dir', str(staged), '--inspect-local-model'], 'model_inspection', timeout=120)
    config = json.loads((staged / 'asr-config.json').read_text('utf-8'))
    args = [str(python), '-I', '-X', 'utf8', str(root / 'workers/companion/asr_worker.py'),
            '--model-root', str(model), '--manifest', config['manifestPath'],
            '--manifest-sha256', config['manifestSha256']]
    run_step(args + ['--probe'], 'native_probe', capture_output=True, timeout=60)
    check = run_step(args, 'native_model_load', input=bytes(32000), capture_output=True, timeout=60)
    result = json.loads(check.stdout.decode('utf-8'))
    if result.get('durationMs') != 1000 or result.get('executionAllowed') is not False:
        raise ValueError('native_engine_smoke_failed')
    print('5/5 Writing local configuration. No microphone was opened.', flush=True)
    output = root / 'local-asr-config'
    output.mkdir()  # Never replace any previous configuration.
    with (output / 'asr-config.json').open('x', encoding='utf-8') as f:
        json.dump(config, f, ensure_ascii=True, indent=2)
        f.write('\n')
    print('SETUP COMPLETE. Open START-ASR.cmd. Model loading passed; speech quality is untested.')


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--install-local-asr', action='store_true')
    parser.add_argument('--runtime-base', type=Path, help='Optional short absolute runtime directory (default: LOCALAPPDATA/Ywon/ASR)')
    args = parser.parse_args(argv)
    try:
        if args.install_local_asr:
            install(runtime_base=args.runtime_base)
        else:
            print(json.dumps(preflight(runtime_base=args.runtime_base), ensure_ascii=False))
            print('Read-only check. To download/install explicitly: --install-local-asr')
        return 0
    except (Exception, KeyboardInterrupt) as error:
        code = str(error) if isinstance(error, ValueError) else type(error).__name__
        print('SETUP STOPPED: ' + code, file=sys.stderr)
        print('No automatic retry. Partial setup folders are preserved; do not disable checks.', file=sys.stderr)
        return 2


if __name__ == '__main__':
    raise SystemExit(main())
