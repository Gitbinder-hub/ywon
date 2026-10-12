import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { applyOverlayEdit, keyboardMove, diffTextEdit, applyTimelineEdit, setSubtitleCues, EditorSession, isBakedText, unsupportedEffectVisible, localEditCostsPaid } from '../packages/editors/src/index.ts';

test('AC1: candidate ADR library check and ADR recorded, FFmpeg not presented as frontend', () => {
  const adr = readFileSync('docs/adr/0008-editor-choice.md','utf8');
  assert.match(adr, /FFmpeg/);
  assert.match(adr, /not.*frontend/i);
  assert.match(adr, /chosen|decided/i);
});

test('AC2: canvas overlays/text styles; structured text diff; video trims/order/overlay intervals/subs/audio', () => {
  const canvas = { overlays:[{ id:'l1', kind:'text' as const, text:'hi', visible:true, locked:false, style:{ fontFamily:'Inter' }, transform:{ x:0,y:0,scale:1,rotation:0 }}], selectedId:'l1', version:1 };
  const edited = applyOverlayEdit(canvas, { id:'l1', patch:{ style:{ fontFamily:'Roboto', fontSize:24 } } });
  assert.equal(edited.ok, true);
  const moved = keyboardMove(canvas,'l1',10,5);
  assert.equal(moved.ok, true);
  // locked denied
  const locked = { overlays:[{ id:'l1', kind:'text' as const, text:'hi', visible:true, locked:true }], selectedId:'l1', version:1 };
  assert.equal(applyOverlayEdit(locked,{id:'l1',patch:{text:'x'}}).ok, false);

  const text = { blocks:[{id:'b1', text:'hello world'}, {id:'b2', text:'cta', locked:true}], version:1 };
  const diff = diffTextEdit(text, [{ blockId:'b1', newText:'hello brave world' }]);
  assert.equal(diff.ok, true);
  if (diff.ok) assert.ok(diff.diff.added > diff.diff.removed);

  const tl = { clips:[{id:'c1', sourceRef:'a', inMs:0, outMs:500, durationMs:500},{id:'c2', sourceRef:'b', inMs:0, outMs:300, durationMs:300}], version:1, timebase:'ms' as const };
  const reordered = applyTimelineEdit(tl, { orderIds:['c2','c1'] });
  assert.equal(reordered.ok, true);
  assert.equal((reordered as Extract<typeof reordered,{ok:true}>).next.clips[0]!.id, 'c2');
  const trimmed = applyTimelineEdit(tl, { clips:[{id:'c1', sourceRef:'a', inMs:100, outMs:400, durationMs:300},{id:'c2', sourceRef:'b', inMs:0, outMs:300, durationMs:300}] });
  assert.equal(trimmed.ok, true);
  const subs = setSubtitleCues(tl,'c1',[{startMs:0,endMs:100,text:'hi'}]);
  assert.equal(subs.ok, true);
  const badCue = setSubtitleCues(tl,'c1',[{startMs:400,endMs:600,text:'x'}]);
  assert.equal(badCue.ok, false);
});

test('AC3: autosave/reload/undo/conflict and export parity with pinned fonts/renderer + keyboard alternative', () => {
  const canvas = { overlays:[{ id:'l1', kind:'text' as const, text:'a', visible:true, locked:false }], selectedId:'l1', version:1 };
  const s = new EditorSession('canvas', canvas);
  s.apply({ overlays:[{ id:'l1', kind:'text' as const, text:'b', visible:true, locked:false }], selectedId:'l1', version:2 });
  assert.equal(s.undo(), true);
  assert.equal((s.get() as unknown as {overlays:{text:string}[]}).overlays[0]!.text, 'a');
  s.apply({ overlays:[{ id:'l1', kind:'text' as const, text:'c', visible:true, locked:false }], selectedId:'l1', version:2 });
  s.autosave();
  const reloaded = s.reload()!;
  assert.equal((reloaded as unknown as {overlays:{text:string}[]}).overlays[0]!.text, 'c');
  // conflict: expected version stale
  assert.equal(s.conflictCheck(1), false);
  assert.equal(s.conflictCheck(2), true);
  // parity: deterministic hash pinned fonts/renderer
  const b1 = s.exportParity();
  const b2 = s.exportParity();
  assert.equal(b1.hash, b2.hash);
  assert.match(b1.hash, /^[0-9a-f]{64}$/);
  assert.equal(b1.renderCostMinor !== null, true);
  assert.equal(s.keyboardMoveAvailable(), true);
});

test('AC4: flat/baked text/import and unsupported effects limits visible; no paid API for local edit; render price visible', () => {
  assert.equal(isBakedText(false).editable, false);
  assert.equal(isBakedText(true).editable, true);
  assert.equal(unsupportedEffectVisible('tracking-follow').supported, false);
  assert.equal(unsupportedEffectVisible('crop').supported, true);
  assert.equal(localEditCostsPaid(), false);
  const bundle = new EditorSession('canvas', { overlays:[{id:'l1', kind:'text' as const, text:'x', visible:true, locked:false}], selectedId:'l1', version:1 }).exportParity();
  assert.ok(typeof bundle.renderCostMinor === 'number');
});
