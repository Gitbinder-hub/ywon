import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

interface ToolchainReport {
  node: string;
  typescript: string | null;
  nodeTypes: string | null;
  lockfilePresent: boolean;
  limitations: string[];
  errors: string[];
}

function inspect(packages: Record<string, string>, runtime = '24.14.1'): ToolchainReport {
  const root = mkdtempSync(join(tmpdir(), 'Ywoom-toolchain-'));
  try {
    writeFileSync(join(root, 'package.json'), JSON.stringify({ devDependencies: { typescript: '7.0.2', '@types/node': '18.19.130' } }));
    for (const [name, version] of Object.entries(packages)) {
      const dir = join(root, 'node_modules', name);
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, 'package.json'), JSON.stringify({ name, version }));
      if (name === 'typescript') {
        mkdirSync(join(dir, 'bin')); writeFileSync(join(dir, 'bin/tsc'), '');
      }
    }
    const script = new URL('../scripts/check_toolchain.mjs', import.meta.url).href;
    const child = spawnSync(process.execPath, ['--input-type=module', '-e',
      `import { inspectToolchain } from ${JSON.stringify(script)}; console.log(JSON.stringify(inspectToolchain(process.argv[1], process.argv[2])));`,
      root, runtime], { encoding: 'utf8', timeout: 5000 });
    assert.equal(child.status, 0, child.stderr);
    return JSON.parse(child.stdout);
  } finally { rmSync(root, { recursive: true, force: true }); }
}

test('toolchain preflight reports pinned local versions and honest limitations', () => {
  const report = inspect({ typescript: '7.0.2', '@types/node': '18.19.130' });
  assert.deepEqual(report.errors, []);
  assert.equal(report.typescript, '7.0.2');
  assert.equal(report.nodeTypes, '18.19.130');
  assert.equal(report.lockfilePresent, false);
  assert.equal(report.limitations.length, 2);
});
test('toolchain preflight rejects missing local types instead of inherited fallback', () => {
  const report = inspect({ typescript: '7.0.2' });
  assert.equal(report.nodeTypes, null);
  assert.match(report.errors.join('; '), /local dependency missing/);
});
test('toolchain preflight rejects dependency drift and unsupported Node major', () => {
  const report = inspect({ typescript: '7.0.1', '@types/node': '22.20.4' }, '22.20.0');
  assert.equal(report.errors.length, 3);
  assert.match(report.errors.join('; '), /Bootstrap requires Node 24/);
});
