#!/usr/bin/env python3
"""Verify the untouched delivered release snapshot, offline. Not a product test."""
from pathlib import Path
import hashlib
import json
import sys

ROOT = Path(__file__).resolve().parents[1]

def main():
    manifest = json.loads((ROOT / 'PACKAGE_MANIFEST.json').read_text())
    expected = manifest['files']
    actual = {
        path.relative_to(ROOT).as_posix()
        for path in ROOT.rglob('*')
        if path.is_file()
        and path != ROOT / 'PACKAGE_MANIFEST.json'
        and '__pycache__' not in path.parts
        and '.git' not in path.parts
        and path.suffix != '.pyc'
    }
    errors = []
    if actual != set(expected):
        errors.append('File set differs from release manifest')
    for name, sha in expected.items():
        path = (ROOT / name).resolve()
        if not path.is_relative_to(ROOT.resolve()) or not path.is_file():
            errors.append('Missing/unsafe ' + name)
            continue
        if hashlib.sha256(path.read_bytes()).hexdigest() != sha:
            errors.append('SHA-256 mismatch ' + name)
    if errors:
        for error in errors:
            print(error, file=sys.stderr)
        return 1
    print('PASS: delivered release snapshot', manifest['spec_version'], len(expected), 'files; product NOT tested.')
    return 0

if __name__ == '__main__':
    sys.exit(main())
