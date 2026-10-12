import test from 'node:test';
import assert from 'node:assert/strict';
import { registerExchange, isWhitelisted, createSandbox, getSandbox, startCoReg, approveCoReg, canAutonomouslyExecute, isToolAllowed, canCreateWallet, requestWallet, payoutMode, needsOwnerCard } from '../packages/exchange-sandbox/src/index.ts';

test('registry whitelist + isolated sandbox', () => {
  registerExchange({ id:'kwork', url:'https://kwork.ru', kind:'api', payout:'crypto', automation:'co_reg', tos:'allow_api', health:'healthy', whitelisted:true, officialSource:'https://kwork.ru/api', checkedAt:new Date().toISOString() });
  registerExchange({ id:'fl', url:'https://fl.ru', kind:'browser', payout:'card', automation:'manual', tos:'browser_only', health:'healthy', whitelisted:false, officialSource:'https://fl.ru', checkedAt:new Date().toISOString() });
  assert.equal(isWhitelisted('kwork'), true);
  assert.equal(isWhitelisted('fl'), false);
  const s=createSandbox('ws-1','kwork');
  assert.equal(s.isolatedCookies, true);
  assert.ok(getSandbox(s.sessionId)!.workspaceId==='ws-1');
});

test('co_reg + autonomous gate', () => {
  assert.equal(canAutonomouslyExecute('kwork','ws-1'), false); // not yet approved
  startCoReg('kwork','ws-1');
  approveCoReg('kwork','ws-1');
  assert.equal(canAutonomouslyExecute('kwork','ws-1'), true);
  assert.equal(canAutonomouslyExecute('fl','ws-1'), false); // manual never auto
});

test('wallet whitelist gate + payout modes', () => {
  assert.equal(isToolAllowed('tron-usdt'), true);
  assert.equal(isToolAllowed('random-wallet'), false);
  assert.equal(canCreateWallet('tron-usdt', { allowed:true, budgetMinor:1000, purpose:'pay provider' }), true);
  assert.equal(requestWallet({ purpose:'pay', amountMinor:1000, toolId:'tron-usdt', workspaceId:'ws-1' }, { allowed:true, budgetMinor:1000, purpose:'pay' }).ok, true);
  assert.equal(requestWallet({ purpose:'pay', amountMinor:1000, toolId:'random-wallet', workspaceId:'ws-1' }, { allowed:true, budgetMinor:1000, purpose:'pay' }).ok, false);
  assert.equal(payoutMode('kwork'), 'crypto');
  assert.equal(needsOwnerCard('fl'), true);
});
