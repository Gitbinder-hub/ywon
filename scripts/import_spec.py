"""Import the approved v0.4 ZIP on a branch, preserving code. No API/network calls."""
import argparse
import hashlib
import json
import shutil
import tempfile
import zipfile
from pathlib import Path, PurePosixPath

EXPECTED_SHA256 = "13a7e15d52aa38f994f81049c2e67be506d1c7b10be2daaa1c5d9b7f5d7b85fb"
ROOT = Path(__file__).resolve().parents[1]

def import_spec(archive: Path, replace: bool = False) -> int:
    if hashlib.sha256(archive.read_bytes()).hexdigest() != EXPECTED_SHA256:
        raise ValueError("ZIP SHA-256 mismatch: use the approved Ywoom-Spec-v0.4.zip")
    with zipfile.ZipFile(archive) as bundle, tempfile.TemporaryDirectory() as folder:
        staging = Path(folder)
        files = {}
        for info in bundle.infolist():
            if info.is_dir(): continue
            path = PurePosixPath(info.filename)
            if path.parts[0] != 'Ywoom-spec-v0.4' or '..' in path.parts or path.is_absolute():
                raise ValueError('Unsafe ZIP path')
            rel = Path(*path.parts[1:])
            if not rel.parts or info.file_size > 2 * 1024 * 1024:
                raise ValueError('Invalid ZIP entry')
            files[rel] = bundle.read(info)
        manifest = json.loads(files[Path('PACKAGE_MANIFEST.json')])
        for name, expected in manifest['files'].items():
            if hashlib.sha256(files[Path(name)]).hexdigest() != expected:
                raise ValueError('Source manifest mismatch: ' + name)
        writes = {}
        for rel, data in files.items():
            if rel == Path('PACKAGE_MANIFEST.json'): continue
            if rel == Path('Makefile') and (ROOT / rel).exists() and 'bootstrap-check' in (ROOT / rel).read_text():
                writes[Path('bootstrap/source-spec-Makefile.txt')] = data
                continue
            target = ROOT / rel
            if not target.resolve().is_relative_to(ROOT.resolve()): raise ValueError('Unsafe destination')
            if target.is_symlink(): raise ValueError('Symlink destination rejected: ' + str(rel))
            if target.exists() and target.read_bytes() != data and not replace:
                raise ValueError('Spec conflict: ' + str(rel) + '; back up/branch before --replace-old-spec')
            writes[rel] = data
        # Validate every destination first; writes are not a repository-wide transaction.
        for rel, data in writes.items():
            target = ROOT / rel
            if not target.resolve().is_relative_to(ROOT.resolve()): raise ValueError('Unsafe destination')
            staged = staging / rel
            staged.parent.mkdir(parents=True, exist_ok=True); staged.write_bytes(data)
        for rel in writes:
            target = ROOT / rel; target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(staging / rel, target)
        status = ROOT / 'bootstrap/STATUS.md'
        status.write_text('# Bootstrap status\n\nSpec import: COMPLETE (source ZIP verified).\n'
                          'B-001: REVIEW; Q-001/P0 and product tasks NOT accepted.\n'
                          'See bootstrap/HANDOFF.md for tested scope and limitations.\n')
        snapshot = {p.relative_to(ROOT).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest()
                    for p in sorted(ROOT.rglob('*')) if p.is_file() and p != ROOT / 'PACKAGE_MANIFEST.json'
                    and '__pycache__' not in p.parts and '.git' not in p.parts and 'node_modules' not in p.parts
                    and p.suffix != '.pyc'}
        (ROOT / 'PACKAGE_MANIFEST.json').write_text(json.dumps({
            'spec_version':'0.4.0','purpose':'Spec v0.4 plus B-001 bootstrap; not accepted production',
            'source_zip_sha256':EXPECTED_SHA256,'files':snapshot},ensure_ascii=False,indent=2)+'\n')
        return len(writes)

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('archive',type=Path)
    parser.add_argument('--replace-old-spec',action='store_true')
    args = parser.parse_args()
    print('Imported',import_spec(args.archive,args.replace_old_spec),'spec files; code preserved.')
    print('Run make check, review bootstrap/HANDOFF.md and actual git diff before acceptance.')

if __name__ == '__main__': main()
