/** Bootstrap-only preflight. Reads local metadata; never installs or executes packages. */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export function inspectToolchain(root, nodeVersion = process.versions.node) {
  const manifest = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
  const errors = [];
  const installed = {};
  for (const name of ['typescript', '@types/node']) {
    try {
      const data = JSON.parse(readFileSync(resolve(root, 'node_modules', name, 'package.json'), 'utf8'));
      installed[name] = data.version ?? null;
      if (data.name !== name || data.version !== manifest.devDependencies?.[name]) {
        errors.push(`${name}: local metadata does not match the pinned dependency`);
      }
    } catch {
      installed[name] = null;
      errors.push(`${name}: local dependency missing or unreadable; inherited tooling is not accepted`);
    }
  }
  if (nodeVersion.split('.')[0] !== '24') errors.push('Bootstrap requires Node 24');
  if (!existsSync(resolve(root, 'node_modules/typescript/bin/tsc'))) errors.push('Local TypeScript CLI missing');
  return {
    node: nodeVersion,
    typescript: installed.typescript,
    nodeTypes: installed['@types/node'],
    lockfilePresent: existsSync(resolve(root, 'package-lock.json')),
    limitations: ['Node 18 typings on Node 24 remain provisional; no P1 acceptance',
      'Metadata preflight is not an integrity, vulnerability or registry-signature audit'],
    errors,
  };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const report = inspectToolchain(root);
  console.log(JSON.stringify(report, null, 2));
  if (report.errors.length) process.exitCode = 1;
}
