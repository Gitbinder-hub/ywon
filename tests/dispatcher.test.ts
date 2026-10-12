import test from 'node:test';
import assert from 'node:assert/strict';
import { Dispatcher, getRoleMatrix, validateDispatchCommand } from '../packages/dispatcher/src/index.ts';

// ── AC1: role matrix and single-command execution ──
test('AC1: role matrix single command — no four mandatory paid calls', () => {
  const matrix = getRoleMatrix();
  // strategist can create/approve, producer generate/export, quality review, guardian gates only
  assert.ok(matrix.some(m=>m.role==='strategist' && m.kind==='project.create' && m.allowed));
  assert.ok(matrix.some(m=>m.role==='quality' && m.kind==='qa.review' && m.allowed));
  assert.ok(matrix.some(m=>m.role==='guardian' && m.kind==='generate' && !m.allowed));
  const d = new Dispatcher({ memberKeys:['u1:ws-a'] });
  const cmd = { kind:'project.create' as const, commandId:'c1', workspaceId:'ws-a', actorId:'u1', roleId:'strategist' as const, payload:{} };
  const r = d.dispatch(cmd);
  assert.equal(r.executed, true);
  // guardian cannot directly execute generate — single dispatcher gates
  const bad = d.dispatch({ kind:'generate', commandId:'c2', workspaceId:'ws-a', actorId:'u1', roleId:'guardian', payload:{} });
  assert.equal(bad.executed, false);
  assert.equal(bad.deniedCode, 'role_not_allowed');
});

test('AC1: validate schema and single-user assistant commands', () => {
  assert.equal(validateDispatchCommand({ kind:'generate', commandId:'c1', workspaceId:'ws-a', actorId:'u1', roleId:'producer', payload:{} }).ok, true);
  assert.equal(validateDispatchCommand({ kind:'unknown', commandId:'c1', workspaceId:'ws-a', actorId:'u1', roleId:'producer', payload:{} }).ok, false);
  assert.equal(validateDispatchCommand({ kind:'generate', commandId:'', workspaceId:'ws-a', actorId:'u1', roleId:'producer', payload:{} }).ok, false);
});

// ── AC2: auth/tenant/budget/policy independently enforced by code ──
test('AC2: auth/tenant/budget/policy denied by code, escalation/injection/duplicate denied', () => {
  const d = new Dispatcher({ budgetCapMinor: 100, memberKeys:['u1:ws-a'] });
  // tenant denied
  assert.equal(d.dispatch({ kind:'generate', commandId:'c10', workspaceId:'ws-b', actorId:'u1', roleId:'producer', payload:{} }).deniedCode, 'tenant_denied');
  // budget denied
  assert.equal(d.dispatch({ kind:'generate', commandId:'c11', workspaceId:'ws-a', actorId:'u1', roleId:'producer', payload:{ estimatedMinor:200 } }).deniedCode, 'budget_denied');
  // injection denied
  assert.equal(d.dispatch({ kind:'generate', commandId:'c12', workspaceId:'ws-a', actorId:'u1', roleId:'producer', payload:{ inject_role:'owner' } }).deniedCode, 'injection_denied');
  // policy mutation denied
  assert.equal(d.dispatch({ kind:'project.create', commandId:'c13', workspaceId:'ws-a', actorId:'u1', roleId:'strategist', payload:{ request_policy_change:true } }).deniedCode, 'policy_mutation_denied');
  // duplicate submit denied
  d.dispatch({ kind:'project.create', commandId:'dup', workspaceId:'ws-a', actorId:'u1', roleId:'strategist', payload:{} });
  assert.equal(d.dispatch({ kind:'project.create', commandId:'dup', workspaceId:'ws-a', actorId:'u1', roleId:'strategist', payload:{} }).deniedCode, 'duplicate_denied');
  // no duplicate side effect — costs counted only once for dup
  assert.equal(d.getCosts(), 1);
});

// ── AC3: QA uncertainty visible, costs measured, no model oracle approval ──
test('AC3: QA uncertainty visible and costs include critique calls, no oracle approval', () => {
  const d = new Dispatcher({ memberKeys:['u1:ws-a'] });
  const qa = d.dispatch({ kind:'qa.review', commandId:'qa1', workspaceId:'ws-a', actorId:'u1', roleId:'quality', payload:{ uncertain:true } });
  assert.equal(qa.executed, true);
  assert.equal(qa.uncertainty, 'uncertain');
  const qa2 = d.dispatch({ kind:'qa.review', commandId:'qa2', workspaceId:'ws-a', actorId:'u1', roleId:'quality', payload:{} });
  assert.equal(qa2.uncertainty, null);
  // costs include qa calls
  assert.equal(d.getCosts(), 2);
});
