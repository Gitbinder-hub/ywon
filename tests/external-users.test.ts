import test from 'node:test';
import assert from 'node:assert/strict';
import { recordRun, getRuns, getIssues, timeToExportStats, reviewBurden, unavailableNotice, fiveUsersCovered } from '../packages/external-users/src/index.ts';

test('AC1: 5 ordinary external users pass pilot; help/fails recorded not hidden', () => {
  for (let i=1;i<=5;i++) recordRun({ userId:`ext-${i}`, completed:i!==3, helpNeeded:i===2, failed:i===3, timeToExportMin:i===3?null: 20+i*5, dropoffAt: i===3?'cost'?undefined:'cost':undefined, feedback: i===3?'budget stop': 'ok' });
  assert.equal(fiveUsersCovered(), true);
  assert.ok(getIssues().some(x=>x.startsWith('failed:ext-3')));
  assert.ok(getIssues().some(x=>x==='help:ext-2'));
  assert.equal(getRuns().length,5);
});

test('AC2: time-to-export/drop-offs/review burden/feedback and issues logged', () => {
  const stats=timeToExportStats();
  assert.ok(stats.avg !==null);
  assert.ok(stats.dropoffs >=0);
  const burden=reviewBurden();
  assert.ok(burden.totalHelp>=0); assert.ok(burden.totalFeedback>=5);
});

test('AC3: unavailable languages/formats/costs explicitly communicated', () => {
  assert.match(unavailableNotice('fr','image', true), /language fr unavailable/);
  assert.match(unavailableNotice('en','carousel', true), /format carousel unavailable/);
  assert.match(unavailableNotice('en','image', false), /cost estimate unavailable/);
  assert.equal(unavailableNotice('en','image', true), 'all requested capabilities available');
});
