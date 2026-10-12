#!/usr/bin/env python3
"""Offline amendment links/schema examples; not runtime or full spec validation."""
import argparse, json
from decimal import Decimal
from pathlib import Path

def validate(root, full_links=False):
    overlay=json.loads((root/'tasks/architect_acceptance_overlay.json').read_text())
    assert overlay['schema_version']==1 and overlay['spec_version']=='0.4.0'
    assert overlay['amendment_id']=='A-20261003'
    seen=set()
    for task in overlay['task_overlays']:
        assert task['task_id'] not in seen; seen.add(task['task_id'])
        assert 'status' not in task and 'depends_on' not in task
        assert task['additional_ac'] and task['context_additions']
        for path in task['context_additions']:
            p=(root/path).resolve(); assert p.is_relative_to(root.resolve()) and p.is_file(),path
    assert (root/'AGENTS.md').read_bytes()==(root/'CLAUDE.md').read_bytes()
    for path in ['README.md','docs/INDEX.md','AGENTS.md']:
        text=(root/path).read_text(); assert 'Qevunara' in text and 'ARCHITECT_AMENDMENT_2026-10-03.md' in text,path
    if full_links:
        project=json.loads((root/'tasks/project.json').read_text())
        ids={t['id'] for t in project['tasks']}; assert seen<=ids
        req=json.loads((root/'docs/requirements.json').read_text())
        features={f['id'] for f in json.loads((root/'tasks/features.json').read_text())['features']}
        for r in req['requirements']:
            assert set(r['tasks'])<=ids and set(r['features'])<=features
            assert (root/r['document']).is_file(),r['document']
    # Arithmetic/invariant examples only; do not certify production enforcement.
    B=Decimal('2.00'); R=(B*Decimal('0.20')).quantize(Decimal('0.01')); C=B+R
    assert R==Decimal('0.40') and C==Decimal('2.40')
    assert Decimal('2.40')<=C and not Decimal('2.41')<=C
    def may_submit(total,unsuccessful,unknown=False,extra_attempt_approval=False):
        return total<=C and not unknown and (unsuccessful<2 or extra_attempt_approval)
    assert may_submit(Decimal('2.30'),1)
    assert not may_submit(Decimal('2.30'),2)
    assert not may_submit(Decimal('2.10'),0,unknown=True)
    assert not may_submit(Decimal('2.41'),0,extra_attempt_approval=True)
    print('PASS: scoped amendment paths/overlay/entrypoint parity and arithmetic examples. Runtime/media/full spec NOT tested.')

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[1]);p.add_argument('--full-links',action='store_true')
    a=p.parse_args();validate(a.root.resolve(),a.full_links)
