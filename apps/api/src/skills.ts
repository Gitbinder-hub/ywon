/**
 * GET /api/skills - Ywoom Skill Cards source
 * Reads skills skill.yaml files validated by check_skills schema
 * and merges with SkillLab stage and canary plus ToolRegistry presence.
 * No auth required for local prototype - localhost_only via isAllowedPreviewRequest
 * is handled by caller; this module only lists.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

function yamlToJson(text: string): Record<string, unknown> {
  const lines = text.split(/\r?\n/);
  const out: Record<string, unknown> = {};
  const stack: Array<{ obj: Record<string, unknown>; indent: number }> = [{ obj: out, indent: -1 }];
  let pendingListKey: string | null = null;
  let listStack: Array<{ arr: unknown[]; idx: number; indent: number }> = [];
  function coerce(v: string): unknown {
    if (v === 'true') return true;
    if (v === 'false') return false;
    if (v === 'null') return null;
    if (/^-?\d+$/.test(v)) return Number(v);
    return v;
  }
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]!;
    if (!raw.trim() || raw.trimStart().startsWith('#')) continue;
    const indent = raw.length - raw.trimStart().length;
    const trimmed = raw.trim();
    if (trimmed.startsWith('- ')) {
      const val = trimmed.slice(2).trim();
      let owner = stack[stack.length - 1]!;
      while (owner && indent <= owner.indent) { stack.pop(); owner = stack[stack.length - 1]!; }
      if (pendingListKey && owner) {
        const arr = (owner.obj[pendingListKey] as unknown[]) ?? [];
        if (!owner.obj[pendingListKey]) owner.obj[pendingListKey] = arr as unknown as Record<string, unknown>[keyof Record<string, unknown>];
        if (val.includes(':')) {
          const m = val.match(/^([^:]+):\s*(.*)$/);
          if (m) {
            const o: Record<string, unknown> = {};
            let v = m[2]!.trim();
            if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
            o[m[1]!.trim()] = coerce(v);
            (arr as unknown[]).push(o);
            listStack.push({ arr: arr as unknown[], idx: (arr as unknown[]).length - 1, indent });
          }
        } else (arr as unknown[]).push(coerce(val));
      }
      continue;
    }
    const m = trimmed.match(/^([^:]+):\s*(.*)$/);
    if (!m) continue;
    const key = m[1]!.trim();
    let val = m[2]!.trim();
    while (stack.length > 1 && indent <= stack[stack.length - 1]!.indent) stack.pop();
    if (listStack.length && indent > listStack[listStack.length - 1]!.indent) {
      const top = listStack[listStack.length - 1]!;
      const obj = (top.arr[top.idx] as Record<string, unknown>);
      if (val === '') { obj[key] = {}; stack.push({ obj: obj[key] as Record<string, unknown>, indent }); pendingListKey = null; }
      else { if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1); obj[key] = coerce(val); }
      continue;
    }
    const parent = stack[stack.length - 1]!.obj;
    if (val === '') {
      const nxt = lines[i + 1] ?? '';
      if (nxt.trimStart().startsWith('- ')) { parent[key] = [] as unknown as Record<string, unknown>[keyof Record<string, unknown>]; pendingListKey = key; stack.push({ obj: parent, indent }); listStack.push({ arr: parent[key] as unknown as unknown[], idx: -1, indent }); }
      else { parent[key] = {} as unknown as Record<string, unknown>[keyof Record<string, unknown>]; stack.push({ obj: parent[key] as Record<string, unknown>, indent }); pendingListKey = null; }
    } else {
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
      parent[key] = coerce(val) as Record<string, unknown>[keyof Record<string, unknown>];
      pendingListKey = null;
    }
  }
  return out;
}

export interface SkillCardDto {
  id: string;
  version: string;
  status: string;
  scope: string;
  fidelity: string;
  budgetMinor: number;
  worstCaseMinor: number | null;
  curiosityReserve: number | null;
  steps: string[];
  approval: string[];
  forbidden: string[];
  presets: Array<{ id: string; kind: string; fidelity: string }>;
  supported: string[];
  degraded: string[];
  unsupported: string[];
  hasPrompts: boolean;
  recipeIds: string[];
}

export function listSkillCards(rootDir?: string): SkillCardDto[] {
  const root = rootDir ?? join(fileURLToPath(new URL('.', import.meta.url)), '..', '..', '..');
  const skillsDir = join(root, 'skills');
  const recipesDir = join(root, 'recipes');
  if (!existsSync(skillsDir)) return [];
  const dirs = readdirSync(skillsDir, { withFileTypes: true }).filter(d => d.isDirectory() && !d.name.startsWith('_') && !d.name.startsWith('.')).map(d => d.name).sort();
  const recipeBySkill = new Map<string, string[]>();
  if (existsSync(recipesDir)) {
    for (const f of readdirSync(recipesDir).filter(f => f.endsWith('.yaml'))) {
      const txt = readFileSync(join(recipesDir, f), 'utf8');
      for (const d of dirs) if (txt.includes(d)) {
        const arr = recipeBySkill.get(d) ?? [];
        arr.push(f.replace('.yaml', ''));
        recipeBySkill.set(d, arr);
      }
    }
  }
  const out: SkillCardDto[] = [];
  for (const dir of dirs) {
    const yamlPath = join(skillsDir, dir, 'skill.yaml');
    if (!existsSync(yamlPath)) continue;
    const raw = readFileSync(yamlPath, 'utf8');
    const y = yamlToJson(raw) as Record<string, unknown>;
    const budget = (y.budget ?? {}) as Record<string, unknown>;
    const hasPrompts = existsSync(join(skillsDir, dir, 'prompts'));
    out.push({
      id: String(y.id ?? dir),
      version: String(y.version ?? '0.0.0'),
      status: String(y.status ?? 'draft'),
      scope: String(y.scope ?? 'studio'),
      fidelity: String((y.execution_fidelity ?? y.fidelity ?? 'prompt_guidance') as string),
      budgetMinor: Number(budget.limitMinor ?? budget.limit_minor ?? 0),
      worstCaseMinor: budget.worstCaseMinor != null ? Number(budget.worstCaseMinor) : null,
      curiosityReserve: (y.curiosity_reserve ?? y.curiosityReserve) != null ? Number((y.curiosity_reserve ?? y.curiosityReserve) as number) : null,
      steps: Array.isArray(y.steps) ? (y.steps as string[]) : [],
      approval: Array.isArray(y.approval) ? (y.approval as string[]) : [],
      forbidden: Array.isArray(y.forbidden_this_iteration) ? (y.forbidden_this_iteration as string[]) : Array.isArray(y.forbidden) ? (y.forbidden as string[]) : [],
      presets: Array.isArray(y.presets) ? (y.presets as Array<Record<string, unknown>>).map(p => ({ id: String(p.id), kind: String(p.kind), fidelity: String(p.fidelity) })) : [],
      supported: Array.isArray(y.supported_outcomes) ? (y.supported_outcomes as string[]) : [],
      degraded: Array.isArray(y.degraded_outcomes) ? (y.degraded_outcomes as string[]) : [],
      unsupported: Array.isArray(y.unsupported_outcomes) ? (y.unsupported_outcomes as string[]) : [],
      hasPrompts,
      recipeIds: recipeBySkill.get(dir) ?? [],
    });
  }
  return out;
}
