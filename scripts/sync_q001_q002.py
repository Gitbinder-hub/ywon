#!/usr/bin/env python3
"""Apply the exact owner-approved Q001/Q002 registry delta in a genuine clone.
Default: read-only preflight. No network, install, provider call, commit or push.
"""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
CAPSULE = 'reports/patches/Q001_Q002_sync.json'
PATCH = 'reports/patches/Q001_Q002_registry_views.patch'
TARGETS = ('tasks/project.json', 'tasks/BACKLOG.md', 'docs/STATE.md', 'docs/FEATURE_STATUS.md')
BRANCH = 'bootstrap/spec-v04-foundation'

class SyncError(RuntimeError):
    pass

def run(root, command):
    result = subprocess.run(command, cwd=root, text=True, capture_output=True)
    if result.returncode:
        raise SyncError('Command failed: ' + ' '.join(command) + '\n' + result.stderr.strip())
    return result.stdout.strip()

def blob(data):
    return hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()

def safe_file(root, name):
    p = root / name
    if Path(name).is_absolute() or '..' in Path(name).parts:
        raise SyncError('Unsafe relative path')
    if any(x.is_symlink() for x in [p, *p.parents] if x != root.parent):
        raise SyncError('Symlink refused: ' + name)
    if not p.is_file() or not p.resolve().is_relative_to(root.resolve()):
        raise SyncError('Missing or outside-root file: ' + name)
    return p

def synchronize(root, apply=False):
    root = root.resolve()
    if Path(run(root, ['git', 'rev-parse', '--show-toplevel'])).resolve() != root:
        raise SyncError('Run from the genuine repository root')
    if run(root, ['git', 'branch', '--show-current']) != BRANCH:
        raise SyncError('Only the approved bootstrap branch is allowed; main is forbidden')
    c = json.loads(safe_file(root, CAPSULE).read_text())
    if set(c['targets']) != set(TARGETS):
        raise SyncError('Capsule target scope mismatch')
    patch = safe_file(root, PATCH).read_bytes()
    if hashlib.sha256(patch).hexdigest() != c['patch_sha256']:
        raise SyncError('Patch integrity mismatch')
    headers = [line[4:] for line in patch.decode().splitlines() if line.startswith('+++ ')]
    if headers != ['b/' + name for name in TARGETS]:
        raise SyncError('Patch paths/order mismatch')
    for name, sha in c['evidence_blobs'].items():
        if blob(safe_file(root, name).read_bytes()) != sha:
            raise SyncError('Approval/review evidence mismatch: ' + name)
    current = {name: blob(safe_file(root, name).read_bytes()) for name in TARGETS}
    if all(current[name] == c['targets'][name]['after'] for name in TARGETS):
        run(root, ['python3', 'scripts/project.py', 'validate'])
        print('ALREADY_SYNCHRONIZED: no files changed; Q002 is REVIEW, not accepted.')
        return 'already'
    if not all(current[name] == c['targets'][name]['before'] for name in TARGETS):
        raise SyncError('Partial/changed registry or views; stop, do not overwrite')
    run(root, ['git', 'merge-base', '--is-ancestor', c['published_evidence_commit'], 'HEAD'])
    head = run(root, ['git', 'rev-parse', 'HEAD'])
    if run(root, ['git', 'status', '--porcelain']):
        raise SyncError('Worktree/index must be clean; preserve existing changes')
    # Candidate validation is isolated. Only tracked source files are copied.
    with tempfile.TemporaryDirectory(prefix='Ywoom-sync-check-') as tmp:
        candidate = Path(tmp) / 'repo'
        candidate.mkdir()
        files = subprocess.run(['git', 'ls-files', '-z'], cwd=root, capture_output=True, check=True).stdout.decode().split('\0')
        for name in filter(None, files):
            src = safe_file(root, name)
            dst = candidate / name
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dst)
        candidate_patch = Path(tmp) / 'delta.patch'
        candidate_patch.write_bytes(patch)
        run(candidate, ['git', 'apply', '--check', str(candidate_patch)])
        run(candidate, ['git', 'apply', str(candidate_patch)])
        for name in TARGETS:
            if blob(safe_file(candidate, name).read_bytes()) != c['targets'][name]['after']:
                raise SyncError('Candidate result mismatch: ' + name)
        run(candidate, ['python3', 'scripts/project.py', 'validate'])
        if not apply:
            print('PREFLIGHT_PASS: four exact files validated; no repository files changed.')
            print('Explicit local apply: python3 scripts/sync_q001_q002.py --apply')
            return 'preflight'
        if run(root, ['git', 'rev-parse', 'HEAD']) != head or run(root, ['git', 'status', '--porcelain']):
            raise SyncError('Repository changed during preflight; stop')
        for name in TARGETS:
            if blob(safe_file(root, name).read_bytes()) != c['targets'][name]['before']:
                raise SyncError('Concurrent source change; stop')
        git_backup = Path(run(root, ['git', 'rev-parse', '--git-path', 'Ywoom-registry-backups']))
        if not git_backup.is_absolute():
            git_backup = root / git_backup
        git_backup.mkdir(parents=True, exist_ok=True)
        backup = Path(tempfile.mkdtemp(prefix='q001-q002-', dir=git_backup))
        for name in TARGETS:
            dest = backup / name
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(root / name, dest)
        try:
            run(root, ['git', 'apply', str(candidate_patch)])
            for name in TARGETS:
                if blob(safe_file(root, name).read_bytes()) != c['targets'][name]['after']:
                    raise SyncError('Written result mismatch: ' + name)
            run(root, ['python3', 'scripts/project.py', 'validate'])
        except Exception:
            # Never clobber unrelated concurrent edits during rollback.
            for name in TARGETS:
                actual = blob((root / name).read_bytes()) if (root / name).is_file() else None
                if actual == c['targets'][name]['after']:
                    shutil.copy2(backup / name, root / name)
            print('APPLY_FAILED: backup retained at ' + str(backup))
            raise
    print('APPLIED_LOCALLY: Q001 DONE, Q002 REVIEW, Q003 TODO, phase P0.')
    print('No commit/push/main merge/provider execution was performed.')
    print('Inspect the four-file diff and run checks before committing this branch.')
    return 'applied'

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--apply', action='store_true', help='Apply four files after isolated preflight; no commit/push')
    args = parser.parse_args()
    try:
        synchronize(ROOT, args.apply)
    except (SyncError, OSError, ValueError, subprocess.SubprocessError) as exc:
        parser.exit(1, 'STOP: ' + str(exc) + '\n')

if __name__ == '__main__':
    main()
