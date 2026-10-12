import test from 'node:test';
import assert from 'node:assert/strict';
import { importMetrics, getMetric, perEpisodeReport, fabricatedCause, clear } from '../packages/analytics-import/src/index.ts';

test('AC1: availability/windows/source, missing=NULL', () => {
  clear();
  importMetrics([{ episodeId:'ep1', provider:'yt', metric:'views', value:null, window:'7d', source:'yt-api' }]);
  assert.equal(getMetric('ep1','yt','views','7d')!.value, null);
  assert.equal(getMetric('ep1','yt','views','7d')!.source, 'yt-api');
});

test('AC2: retry/dedup/provenance and descriptive per-episode', () => {
  clear();
  const r1=importMetrics([{ episodeId:'ep1', provider:'yt', metric:'views', value:100, window:'7d', source:'api' }]);
  const r2=importMetrics([{ episodeId:'ep1', provider:'yt', metric:'views', value:100, window:'7d', source:'api' }]);
  assert.equal(r1.imported,1); assert.equal(r2.deduped,1);
  const rep=perEpisodeReport('ep1');
  assert.equal(rep.descriptiveOnly, true);
});

test('AC3: no fabricated cause/CTR-hook equiv; uncertainty visible', () => {
  assert.equal(fabricatedCause('ctr','hook'), false);
  const rep=perEpisodeReport('ep1');
  assert.match(rep.uncertainty, /no causal|descriptive/);
});
