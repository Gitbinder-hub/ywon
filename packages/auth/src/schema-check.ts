// Offline проверка что миграция соблюдает tenant правила — без подключения к БД
export interface SchemaCheck { ok: boolean; issues: string[] }
export function checkTenantSchema(sqlText: string): SchemaCheck {
  const issues: string[] = [];
  for (const [needle, label] of [['workspaces','workspaces'], ['memberships','memberships'], ['workspace_id','workspace_id'], ['FOREIGN KEY','FK'], ['CHECK','CHECK'], ['UNIQUE','UNIQUE']] as const) {
    if (!sqlText.includes(needle)) issues.push(`missing:${label}`);
  }
  if (!/workspace_id\s+(TEXT|UUID)\s+NOT\s+NULL/i.test(sqlText)) issues.push('workspace_id must be NOT NULL');
  return { ok: issues.length === 0, issues };
}
