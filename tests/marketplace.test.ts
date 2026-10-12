import test from 'node:test';
import assert from 'node:assert/strict';
import { Marketplace } from '../packages/marketplace/src/index.ts';

// AC1: provenance/licenses/sandbox/moderation/tenant isolation tested
test('AC1: provenance + license + signature verification', () => {
  const mp = new Marketplace();
  assert.equal(mp.registerProvenance({ skillId:'demo', version:'1.0.0', kind:'internal', author:'Ywoom', license:'MIT', signature:null, verified:false }).ok, true);
  assert.equal(mp.registerProvenance({ skillId:'bad', version:'1', kind:'internal', author:'', license:'MIT', signature:null, verified:false }).ok, false);
  // with signature
  const sig = mp.computeSignature('yaml', 'md');
  assert.equal(mp.registerProvenance({ skillId:'signed', version:'1.0.0', kind:'community', author:'Oleg', license:'https://example.com/license', signature: sig, verified:false }).ok, true);
  assert.equal(mp.verifySignature('signed','1.0.0', sig).ok, true);
  assert.equal(mp.verifySignature('signed','1.0.0','0'.repeat(64)).ok, false);
  // already exists
  assert.equal(mp.registerProvenance({ skillId:'demo', version:'1.0.0', kind:'internal', author:'Ywoom', license:'MIT', signature:null, verified:false }).ok, false);
});

test('AC1: supply-chain / sandbox / tenant isolation / moderation gate publish', () => {
  const mp = new Marketplace();
  const sig = mp.computeSignature('yaml','md');
  mp.registerProvenance({ skillId:'pub', version:'1.0.0', kind:'internal', author:'Ywoom', license:'MIT', signature: sig, verified:false });
  mp.verifySignature('pub','1.0.0', sig);
  // supply-chain must pass
  mp.setSupplyChainCheck({ skillId:'pub', version:'1.0.0', dependenciesPinned:true, signaturesPresent:true, passed:false });
  assert.equal(mp.canPublish('pub','1.0.0').allowed, false);
  // sandbox branch must be labs/ or scout/
  assert.equal(mp.setSandboxRun({ skillId:'pub', version:'1.0.0', branch:'main', ciPassed:true, durationMs:100 }).ok, false);
  assert.equal(mp.setSandboxRun({ skillId:'pub', version:'1.0.0', branch:'labs/marketplace-pub', ciPassed:true, durationMs:100 }).ok, true);
  // tenant isolation — leak = fail
  mp.setTenantIsolation({ skillId:'pub', version:'1.0.0', tenantScope:'public', crossTenantLeak:true, passed:false });
  assert.equal(mp.canPublish('pub','1.0.0').allowed, false);
  mp.setTenantIsolation({ skillId:'pub', version:'1.0.0', tenantScope:'public', crossTenantLeak:false, passed:false });
  // moderation pending blocks
  assert.equal(mp.canPublish('pub','1.0.0').allowed, false);
  mp.moderate('pub','1.0.0','approved', null);
  assert.equal(mp.canPublish('pub','1.0.0').allowed, true);
  assert.equal(mp.publish('pub','1.0.0').ok, true);
  assert.equal(mp.isPublished('pub','1.0.0'), true);
  // rejected needs reason
  const sig2 = mp.computeSignature('yaml2','md2');
  mp.registerProvenance({ skillId:'rej', version:'1.0.0', kind:'community', author:'anon', license:'MIT', signature: sig2, verified:false });
  mp.verifySignature('rej','1.0.0', sig2);
  mp.setSupplyChainCheck({ skillId:'rej', version:'1.0.0', dependenciesPinned:true, signaturesPresent:true, passed:false });
  mp.setSandboxRun({ skillId:'rej', version:'1.0.0', branch:'labs/rej', ciPassed:true, durationMs:50 });
  mp.setTenantIsolation({ skillId:'rej', version:'1.0.0', tenantScope:'workspace', crossTenantLeak:false, passed:false });
  assert.equal(mp.moderate('rej','1.0.0','rejected', null).ok, false);
  assert.equal(mp.moderate('rej','1.0.0','rejected','spam').ok, true);
  assert.equal(mp.canPublish('rej','1.0.0').allowed, false);
});

// AC2: demand/economics/support/security acceptance before public rollout
test('AC2: economics — useful script is not market-ready without support/security/owner', () => {
  const mp = new Marketplace();
  const demands = [{ skillId:'pub', requests: 100, estimatedRevenueMinor: 20000 }];
  const report = mp.demandEconomics(demands);
  assert.equal(report.supportScope, 'community');
  // without securityReviewed -> fail
  assert.equal(mp.economicsAccept(report, true).ok, false);
  const okReport = { ...report, securityReviewed: true, supportScope: 'Ywoom support: issues + rollback within 24h' };
  assert.equal(mp.economicsAccept(okReport, false).ok, false); // needs ownerConfirmed
  assert.equal(mp.economicsAccept(okReport, true).ok, true);
  assert.equal(mp.economicsAccept({ ...okReport, supportScope: '' }, true).ok, false);
});
