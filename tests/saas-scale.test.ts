import test from 'node:test';
import assert from 'node:assert/strict';
import { createPlan, getPlan, defineLoadTests, getLoadTests, createScaleTasks, getScaleTasks, isMillionReady, gateDependsCorrect } from '../packages/saas-scale/src/index.ts';
test('AC1: demand/capacity/billing/quotas/support and acceptance plan', () => {
  createPlan({ demand:'pilot 100 users', capacity:'1 VPS + pg-boss', billing:'credits per video', quotas:'10 videos/day', support:'email 48h', acceptancePlan:'load+restore tests' });
  assert.ok(getPlan()!.demand);
});
test('AC2: no million-ready claim, tests defined', () => {
  assert.equal(isMillionReady(), false);
  defineLoadTests(['load 100rps','security scan','restore drill','payment reconciliation']);
  assert.ok(getLoadTests().length>=4);
});
test('AC3: tasks for scale features created; gate deps', () => {
  createScaleTasks(['Q-045','Q-046']);
  assert.ok(getScaleTasks().length>0);
  assert.equal(gateDependsCorrect(), true);
});
