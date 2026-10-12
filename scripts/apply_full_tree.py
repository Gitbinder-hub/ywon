"""Offline reviewed full-tree transfer. Default is preflight only; never commits or pushes."""
import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import stat
import subprocess
import tempfile
import zipfile


def git(root, *args):
    return subprocess.check_output(['git', '-C', str(root), *args], text=True).strip()


def safe_path(root, name):
    path = PurePosixPath(name)
    if (not path.parts or path.is_absolute() or '..' in path.parts or '\\' in name
            or path.as_posix() != name or '.git' in path.parts or 'node_modules' in path.parts
            or '__pycache__' in path.parts or any(p == '.env' or p.startswith('.env.') for p in path.parts)):
        raise ValueError('Unsafe/reserved payload path: ' + name)
    target = root.joinpath(*path.parts)
    if not target.resolve().is_relative_to(root.resolve()):
        raise ValueError('Destination outside repository: ' + name)
    for parent in [target, *target.parents]:
        if parent == root:
            break
        if parent.is_symlink():
            raise ValueError('Symlink destination: ' + name)
        if parent != target and parent.exists() and not parent.is_dir():
            raise ValueError('Non-directory parent: ' + name)
    if target.exists() and not target.is_file():
        raise ValueError('Non-file destination: ' + name)
    return target


def preflight(repository, archive, manifest):
    root = repository.resolve(strict=True)
    if Path(git(root, 'rev-parse', '--show-toplevel')).resolve() != root:
        raise ValueError('Use the Git repository root')
    branch = git(root, 'branch', '--show-current')
    if not branch or branch in {'main', 'master'}:
        raise ValueError('Use an explicit work branch, not main/master/detached HEAD')
    if git(root, 'rev-parse', 'HEAD') != manifest['expected_head']:
        raise ValueError('HEAD changed; refresh remote verification before transfer')
    if git(root, 'status', '--porcelain', '--untracked-files=all'):
        raise ValueError('Dirty repository; preserve changes before transfer')
    if hashlib.sha256(archive.read_bytes()).hexdigest() != manifest['archive_sha256']:
        raise ValueError('Archive SHA-256 mismatch')
    prefix = manifest['archive_prefix']
    if prefix != 'Ywoom-foundation/':
        raise ValueError('Unsupported archive prefix')
    expected = manifest['files']
    if not expected or len(expected) > 1000:
        raise ValueError('Invalid manifest size')
    payload = {}
    total = 0
    with zipfile.ZipFile(archive) as bundle:
        seen = set()
        for info in bundle.infolist():
            if info.filename in seen:
                raise ValueError('Duplicate ZIP entry')
            seen.add(info.filename)
            if info.is_dir():
                continue
            if not info.filename.startswith(prefix):
                raise ValueError('Wrong ZIP root')
            name = info.filename[len(prefix):]
            safe_path(root, name)
            mode = info.external_attr >> 16
            if stat.S_ISLNK(mode):
                raise ValueError('ZIP symlinks are not allowed')
            total += info.file_size
            if info.file_size > 2 * 1024 * 1024 or total > 20 * 1024 * 1024:
                raise ValueError('ZIP size limit exceeded')
            data = bundle.read(info)
            if name not in expected or hashlib.sha256(data).hexdigest() != expected[name]:
                raise ValueError('Manifest file mismatch: ' + name)
            payload[name] = data
    if set(payload) != set(expected):
        raise ValueError('Manifest file set mismatch')
    for name, sha in manifest.get('unchanged_runtime_blobs', {}).items():
        target = safe_path(root, name)
        data = payload[name]
        blob = hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()
        if not target.is_file() or git(root, 'hash-object', str(target)) != sha or blob != sha:
            raise ValueError('Reviewed runtime differs: ' + name)
    changes = {name: data for name, data in payload.items()
               if not safe_path(root, name).exists() or safe_path(root, name).read_bytes() != data}
    return root, branch, changes


def transfer(repository, archive, manifest, backup_directory=None):
    root, branch, changes = preflight(repository, archive, manifest)
    result = {'branch': branch, 'expected_head': manifest['expected_head'],
              'payload_files': len(manifest['files']), 'changed_files': sorted(changes),
              'mode': 'preflight', 'remote_import': 'not_performed', 'deletions': 0}
    if backup_directory is None:
        return result
    backup = backup_directory.resolve()
    if backup.is_relative_to(root) or backup.exists():
        raise ValueError('Backup must be a new directory outside the repository')
    # Recheck immediately before writes. This is not a distributed/concurrent-write lock.
    if git(root, 'rev-parse', 'HEAD') != manifest['expected_head'] or git(root, 'status', '--porcelain', '--untracked-files=all'):
        raise ValueError('Repository changed after preflight')
    backup.mkdir(parents=True)
    subprocess.run(['git', '-C', str(root), 'bundle', 'create', str(backup / 'history.bundle'), '--all'], check=True)
    with zipfile.ZipFile(backup / 'before-files.zip', 'w', zipfile.ZIP_DEFLATED) as before:
        for name in changes:
            target = safe_path(root, name)
            if target.exists():
                before.write(target, name)
    (backup / 'plan.json').write_text(json.dumps(result, indent=2) + '\n')
    # Individually atomic writes, NOT a repository-wide transaction. On I/O error stop and use the backup;
    # do not reset/clean automatically or discard concurrent work. No removals, staging, commit or push.
    for name, data in changes.items():
        target = safe_path(root, name)
        target.parent.mkdir(parents=True, exist_ok=True)
        fd, temp = tempfile.mkstemp(prefix='.Ywoom-transfer-', dir=target.parent)
        try:
            with os.fdopen(fd, 'wb') as output:
                output.write(data)
            if target.exists():
                os.chmod(temp, stat.S_IMODE(target.stat().st_mode))
            else:
                os.chmod(temp, 0o644)
            os.replace(temp, target)
        finally:
            if os.path.exists(temp):
                os.unlink(temp)
    for name, expected in manifest['files'].items():
        if hashlib.sha256(safe_path(root, name).read_bytes()).hexdigest() != expected:
            raise ValueError('Post-write verification failed: ' + name)
    result.update({'mode': 'applied_locally', 'backup': str(backup),
                   'next': 'Inspect diff; npm ci with scripts disabled; make check; owner reviews before commit/push/merge'})
    (backup / 'result.json').write_text(json.dumps(result, indent=2) + '\n')
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('archive', type=Path)
    parser.add_argument('--manifest', type=Path, required=True)
    parser.add_argument('--repository', type=Path, required=True)
    parser.add_argument('--backup-directory', type=Path, help='Supplying this opts into local writes')
    args = parser.parse_args()
    manifest = json.loads(args.manifest.read_text())
    print(json.dumps(transfer(args.repository, args.archive, manifest, args.backup_directory), indent=2))


if __name__ == '__main__':
    main()
