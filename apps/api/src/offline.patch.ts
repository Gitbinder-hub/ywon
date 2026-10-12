import * as fs from 'node:fs';
const p = 'apps/api/src/offline.ts';
let s = fs.readFileSync(p, 'utf8');
let n = 0;
// 1) keep tenant field on Project for cloud sharing (backward compatible: old projects keep without owner)
s = s.replace(
  "interface Project extends Plan { id: string; revision: number; updatedAt: string; diagnostic: boolean; verifiedResultReference?: VerifiedResultReference; tags: string[]; deletedAt?: string | null; pinned?: boolean }",
  "interface Project extends Plan { id: string; revision: number; updatedAt: string; diagnostic: boolean; verifiedResultReference?: VerifiedResultReference; tags: string[]; deletedAt?: string | null; pinned?: boolean; ownerId?: string | null }",
  ) && (n++, s) || s;
// 2) count only non-deleted projects for limits (so trash doesn't block creation)
s = s.replace(
  "const cnt = readdirSync(join(root, 'projects')).filter((n) => n.endsWith('.json')).length;",
  "const _allCnt = readdirSync(join(root, 'projects')).filter((n) => n.endsWith('.json')).length;\n        const cnt = (()=>{ try{ return readdirSync(join(root,'projects')).filter((n)=>n.endsWith('.json')).map((n)=>{ try{ return JSON.parse(fs.readFileSync(join(root,'projects',n),'utf8')) as Project; }catch{ return null; } }).filter((p):p is Project=>!!p && !p.deletedAt).length; }catch{ return _allCnt; } })();",
) && (n++, s) || s;
console.log('patched', n);
fs.writeFileSync(p, s);
