#!/usr/bin/env node
// Validates skills/*/*.yaml against skills/_schema/skill.schema.json + file presence checks
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const SKILLS_DIR = join(ROOT, 'skills');
const SCHEMA_PATH = join(SKILLS_DIR, '_schema', 'skill.schema.json');
const RECIPES_DIR = join(ROOT, 'recipes');

function yamlParse(text) {
  // minimal YAML for our constrained skill files (no anchors, no multi-docs)
  const lines = text.split(/\r?\n/);
  const out = {};
  const stack = [{ obj: out, indent: -1, key: null }];
  let pendingListKey = null;
  let listStack = [];
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    if (!raw.trim() || raw.trimStart().startsWith('#')) continue;
    const indent = raw.length - raw.trimStart().length;
    const trimmed = raw.trim();
    if (trimmed.startsWith('- ')) {
      const val = trimmed.slice(2).trim();
      // find list owner
      let owner = stack[stack.length - 1];
      while (owner && indent <= owner.indent) { stack.pop(); owner = stack[stack.length - 1]; }
      // pendingListKey tells which key holds the list
      if (pendingListKey && owner) {
        if (!Array.isArray(owner.obj[pendingListKey])) owner.obj[pendingListKey] = [];
        if (val.includes(':')) {
          const m = val.match(/^([^:]+):\s*(.*)$/);
          if (m) { const o = {}; const k = m[1].trim(); let v = m[2].trim(); if (v.startsWith('"') || v.startsWith("'")) v = v.slice(1, -1); o[k] = coerce(v); owner.obj[pendingListKey].push(o); listStack.push({ arr: owner.obj[pendingListKey], idx: owner.obj[pendingListKey].length - 1, indent }); }
          else owner.obj[pendingListKey].push(coerce(val));
        } else owner.obj[pendingListKey].push(coerce(val));
      }
      continue;
    }
    const m = trimmed.match(/^([^:]+):\s*(.*)$/);
    if (!m) continue;
    let key = m[1].trim();
    let val = m[2].trim();
    // pop to parent by indent
    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) { stack.pop(); }
    // handle list-item continuation (object inside list)
    if (listStack.length && indent > listStack[listStack.length - 1].indent) {
      const top = listStack[listStack.length - 1];
      const arr = top.arr;
      const obj = arr[top.idx];
      if (val === '' || val === undefined) { obj[key] = {}; stack.push({ obj: obj[key], indent, key }); pendingListKey = null; }
      else { if (val.startsWith('"') || val.startsWith("'")) val = val.slice(1, -1); obj[key] = coerce(val); }
      continue;
    }
    let parent = stack[stack.length - 1].obj;
    if (val === '' ) {
      // look ahead: block scalar with | or list
      const next = lines[i + 1] ?? '';
      if (next.trimStart().startsWith('- ')) {
        parent[key] = [];
        pendingListKey = key;
        stack.push({ obj: parent, indent, key });
        listStack.push({ arr: parent[key], idx: -1, indent });
      } else {
        parent[key] = {};
        stack.push({ obj: parent[key], indent, key });
        pendingListKey = null;
      }
    } else {
      if (val === '|' ) { // block literal — collect indented lines
        let j = i + 1; let block = [];
        const base = lines[j]?.length - (lines[j]?.trimStart().length) ?? 0;
        while (j < lines.length && (lines[j].trim() === '' || (lines[j].length - lines[j].trimStart().length) > indent)) { block.push(lines[j].slice(base)); j++; }
        parent[key] = block.join('\n');
        i = j - 1;
      } else {
        if (val.startsWith('"') || val.startsWith("'")) val = val.slice(1, -1);
        parent[key] = coerce(val);
      }
      pendingListKey = null;
    }
  }
  return out;
}
function coerce(v) {
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (v === 'null') return null;
  if (/^-?\d+$/.test(v)) return Number(v);
  if (/^-?\d+\.\d+$/.test(v)) return Number(v);
  return v;
}

let errors = [];
const schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf8'));

function validateAgainstSchema(obj, schema, path = '$') {
  const errs = [];
  for (const req of (schema.required ?? [])) if (!(req in obj)) errs.push(`${path}: missing required '${req}'`);
  for (const [k, prop] of Object.entries(schema.properties ?? {})) {
    if (!(k in obj)) continue;
    const v = obj[k];
    if (prop.enum && !prop.enum.includes(v)) errs.push(`${path}.${k}: value '${v}' not in enum ${prop.enum.join('|')}`);
    if (prop.type === 'string' && prop.pattern && typeof v === 'string') {
      const re = new RegExp(prop.pattern);
      if (!re.test(v)) errs.push(`${path}.${k}: '${v}' fails pattern ${prop.pattern}`);
    }
    if (prop.type === 'integer' && typeof v === 'number' && !Number.isInteger(v)) errs.push(`${path}.${k}: not integer`);
    if (prop.type === 'integer' && typeof v === 'number' && prop.minimum !== undefined && v < prop.minimum) errs.push(`${path}.${k}: ${v} < minimum ${prop.minimum}`);
  }
  return errs;
}

const skillDirs = readdirSync(SKILLS_DIR, { withFileTypes: true }).filter(d => d.isDirectory() && !d.name.startsWith('_') && !d.name.startsWith('.')).map(d => d.name).sort();
if (!skillDirs.length) errors.push('no skill dirs found');

for (const dir of skillDirs) {
  const yamlPath = join(SKILLS_DIR, dir, 'skill.yaml');
  const mdPath = join(SKILLS_DIR, dir, 'SKILL.md');
  if (!existsSync(yamlPath)) { errors.push(`${dir}: missing skill.yaml`); continue; }
  if (!existsSync(mdPath)) errors.push(`${dir}: missing SKILL.md`);
  const raw = readFileSync(yamlPath, 'utf8');
  const parsed = yamlParse(raw);
  const errs = validateAgainstSchema(parsed, schema, dir);
  if (errs.length) errors.push(...errs);
  // presets honesty: 2d_approximation must not CLAIM orbit — "not orbit" is honest denial
  const presets = parsed.presets ?? [];
  for (const p of presets) {
    const desc = p.description ?? '';
    const claimsOrbit = /orbit/i.test(desc) && !/not orbit/i.test(desc);
    if (p.fidelity === '2d_approximation' && claimsOrbit) errors.push(`${dir} preset ${p.id}: 2d_approximation must not claim orbit in description (use 'not orbit')`);
    if (p.fidelity === '2d_approximation' && /orbit/i.test(p.id ?? '')) errors.push(`${dir} preset ${p.id}: 2d_approximation id must not contain orbit`);
  }
  // SKILL.md must mention fidelity/limits/budget
  if (existsSync(mdPath)) {
    const md = readFileSync(mdPath, 'utf8');
    if (!/fidelity/i.test(md)) errors.push(`${dir}/SKILL.md: must mention fidelity`);
    if (!/budget/i.test(md)) errors.push(`${dir}/SKILL.md: must mention budget`);
  }
}

if (existsSync(RECIPES_DIR)) {
  const recipes = readdirSync(RECIPES_DIR).filter(f => f.endsWith('.yaml')).sort();
  for (const f of recipes) {
    const p = join(RECIPES_DIR, f);
    const txt = readFileSync(p, 'utf8');
    const obj = yamlParse(txt);
    if (!obj.id) errors.push(`recipes/${f}: missing id`);
    if (!obj.steps || !Array.isArray(obj.steps) || obj.steps.length === 0) errors.push(`recipes/${f}: steps required`);
  }
}

if (errors.length) {
  console.error('check_skills FAILED:');
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}
console.log(`check_skills PASS: ${skillDirs.length} skills, validated`);
