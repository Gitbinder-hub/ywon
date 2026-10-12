import test from 'node:test';
import assert from 'node:assert/strict';
import { ingestRaw, runAsr, candidateClips, exportCompatibility } from '../packages/auto-montage/src/index.ts';
test('AC1: ingest/ASR/reframe/candidate with insufficient', () => {
  const raw=ingestRaw('https://example.com/video.mp4') as import('../packages/auto-montage/src/types.ts').RawSource;
  assert.equal(raw.clips.length,0);
  const withAsr=runAsr(raw,'Hello world. Second sentence. Third one.');
  assert.equal(withAsr.asrDone, true);
  const cand=candidateClips(withAsr);
  assert.equal(cand.insufficient, false);
  assert.equal(candidateClips({ ...withAsr, clips:[] }).insufficient, true);
});
test('AC2: real raw sources evaluated; export compatibility', () => {
  const raw=ingestRaw('https://example.com/a.mp4') as import('../packages/auto-montage/src/types.ts').RawSource;
  const withAsr=runAsr(raw,'One. Two. Three.');
  const cand=candidateClips(withAsr);
  assert.match(exportCompatibility(cand.clips), /compatible/);
  assert.match(exportCompatibility([]), /no clips/);
  assert.equal((ingestRaw('file:///x') as {error:string}).error, 'invalid_url');
});
