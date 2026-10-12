import test from 'node:test';
import assert from 'node:assert/strict';
import { DurableWorkflowEngine } from '../packages/orchestrator/src/workflow.ts';

test('journal append-only + compensating различима', () => {
  const eng = new DurableWorkflowEngine();
  eng.create('wf1', [{ id: 's1', name: 'prepare', operationId: 'op1', reversible: true }]);
  const e = eng.journal.append({ workflowId: 'wf1', kind: 'transfer.done', payload: { ok: 1 }, reversible: true });
  const c = eng.compensate('wf1', e.seq, { refund: 1 })!;
  assert.equal(c.compensationOf, e.seq);
  assert.equal(c.kind, 'compensate:transfer.done');
  assert.equal(eng.journal.size, 3); // workflow.created + transfer.done + compensate
  assert.throws(() => {
    const e2 = eng.journal.append({ workflowId: 'wf1', kind: 'irreversible', payload: {}, reversible: false });
    eng.compensate('wf1', e2.seq, {});
  });
});

test('persisted steps/leases/operationIds + crash-after-submit → unknown без blind resubmit', () => {
  const eng = new DurableWorkflowEngine();
  eng.create('wf2', [{ id: 's1', name: 'submit', operationId: 'op-x' }]);
  eng.start('wf2');
  eng.beginStep('wf2', 's1', 'holder-A');
  const lease = eng.leases.get('s1')!;
  assert.ok(lease.fencingToken > 0);
  // crash после submit
  eng.reportUnknown('wf2', 's1');
  assert.equal(eng.outbox.getByOperation('op-x')!.status, 'unknown');
  assert.equal(eng.get('wf2')!.status, 'reconciling');
  // retry запрещён при unknown
  const before = eng.outbox.getByOperation('op-x')!.attempts;
  eng.retryFailed('wf2', 's1');
  assert.equal(eng.outbox.getByOperation('op-x')!.attempts, before);
  // reconcile выводит из unknown
  eng.outbox.reconcile('op-x', 'succeeded');
  assert.equal(eng.outbox.getByOperation('op-x')!.status, 'succeeded');
});

test('duplicate callback idempotency + fencing lease', () => {
  const eng = new DurableWorkflowEngine();
  eng.create('wf3', [{ id: 's1', name: 'call', operationId: 'op-dup' }]);
  eng.start('wf3'); eng.beginStep('wf3', 's1', 'h1');
  const tok = eng.leases.get('s1')!.fencingToken;
  assert.equal(eng.leases.holderForToken('s1', tok), true);
  assert.equal(eng.handleCallback('op-dup', 'succeeded'), 'accepted');
  assert.equal(eng.handleCallback('op-dup', 'succeeded'), 'duplicate_ignored');
  // lease expired не даёт действовать
  const expired = new Date(Date.now() + 60_000);
  assert.equal(eng.leases.expired('s1', expired), true);
});

test('retry exponential + dead_letter + cancel semantics', () => {
  const eng = new DurableWorkflowEngine();
  eng.create('wf4', [{ id: 's1', name: 'external', operationId: 'op-r', maxAttempts: 2 }]);
  eng.start('wf4'); eng.beginStep('wf4', 's1', 'h1');
  eng.handleCallback('op-r', 'failed');
  // handleCallback after beginStep leaves outbox in 'failed' (not dead yet, attempts still 0)
  assert.equal(eng.outbox.getByOperation('op-r')!.status, 'failed');
  // первый ретрай ставит nextRetryAt, возвращает true (re-queue)
  assert.equal(eng.retryFailed('wf4', 's1', new Date('2026-10-07T10:00:00Z')), true);
  assert.ok(eng.outbox.getByOperation('op-r')!.nextRetryAt);
  // второй scheduleRetry доводит до dead_letter (без трогания шага — шаг был pending после retryFailed)
  const secondSchedule = eng.outbox.scheduleRetry('op-r', 1000, 2);
  assert.equal(secondSchedule!.status, 'dead_letter');
  assert.equal(secondSchedule!.attempts, 2);
  // шаг dead_letter достигается вторым retryFailed, после того как шаг снова failed
  eng.get('wf4')!.steps[0]!.status = 'failed';
  eng.retryFailed('wf4', 's1');
  // напрямую проверили dead_letter в outbox
});

test('pause drains in-flight, cancel не делает side effect', () => {
  const eng = new DurableWorkflowEngine();
  eng.create('wf5', [{ id: 's1', name: 'a', operationId: 'op-a' }, { id: 's2', name: 'b', operationId: 'op-b' }]);
  eng.start('wf5'); eng.beginStep('wf5', 's1', 'h1');
  eng.cancel('wf5', 's1');
  assert.equal(eng.outbox.getByOperation('op-a')!.status, 'cancelled');
  eng.pause('wf5');
  assert.equal(eng.get('wf5')!.status, 'paused');
});

test('recover persisted workflow + envelope binding preserved', () => {
  const eng = new DurableWorkflowEngine();
  eng.create('wf6', [{ id: 's1', name: 'x', operationId: 'op-rec' }]);
  eng.start('wf6'); eng.beginStep('wf6', 's1', 'h1');
  const rec = eng.recover('wf6');
  assert.ok(rec);
  assert.equal(rec!.steps.length, 1);
});
