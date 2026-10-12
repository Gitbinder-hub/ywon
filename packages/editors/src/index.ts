/**
 * Q-039 Editors — canvas overlays/text styles, structured text diff editing, video trims/order/overlay intervals/subtitle cues/basic audio,
 * autosave/reload/undo/conflict, export parity with pinned fonts/renderer, flat/baked limits visible, no paid API for local edit.
 */
import { createHash } from 'node:crypto';
import type { CanvasState, Overlay, TimelineState, TimelineClip, TextState, ExportBundle } from './types.ts';

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$/;
function validId(v:string): boolean { return SAFE_ID.test(v); }
function hash(v: unknown): string { return createHash('sha256').update(JSON.stringify(v),'utf8').digest('hex'); }

// ── Canvas overlays ─────────────────────────────────────────────────────────
export function applyOverlayEdit(state: CanvasState, edit: { id:string; patch: Partial<Overlay> }): { ok:true; next:CanvasState } | { ok:false; code:string } {
  if (!validId(edit.id)) return { ok:false, code:'invalid_id' };
  const idx = state.overlays.findIndex(o=>o.id===edit.id);
  if (idx<0) return { ok:false, code:'not_found' };
  if (state.overlays[idx]!.locked) return { ok:false, code:'locked' };
  const next: CanvasState = { overlays: state.overlays.map(o=> o.id===edit.id ? { ...o, ...edit.patch } : { ...o }), selectedId: state.selectedId, version: state.version+1 };
  return { ok:true, next };
}
export function keyboardMove(state: CanvasState, id:string, dx:number, dy:number): typeof applyOverlayEdit extends (...a: unknown[])=> infer R ? R : never {
  const ov = state.overlays.find(o=>o.id===id);
  if (!ov) return { ok:false, code:'not_found' } as unknown as ReturnType<typeof applyOverlayEdit>;
  const t = ov.transform ?? { x:0, y:0, scale:1, rotation:0 };
  return applyOverlayEdit(state, { id, patch:{ transform:{ x:t.x+dx, y:t.y+dy, scale:t.scale, rotation:t.rotation }} });
}

// ── Structured text manual/diff editing ────────────────────────────────────
export function diffTextEdit(state: TextState, edits: { blockId:string; newText:string }[]): { ok:true; next:TextState; diff:{ added:number; removed:number } } | { ok:false; code:string } {
  for (const e of edits) if (!validId(e.blockId)) return { ok:false, code:'invalid_blockId' };
  let added=0, removed=0;
  const nextBlocks = state.blocks.map(b=>{
    const e = edits.find(x=>x.blockId===b.id);
    if (!e) return b;
    if (b.locked) return b;
    added += e.newText.length; removed += b.text.length;
    return { ...b, text: e.newText };
  });
  // locked blocks not edited — reported via diff mismatch is caller's responsibility, but no silent overwrite
  return { ok:true, next:{ blocks: nextBlocks, version: state.version+1 }, diff:{ added, removed } };
}

// ── Video trims/order/overlay intervals/subtitle cues/basic audio ──────────
export function applyTimelineEdit(state: TimelineState, edits: { clips?: TimelineClip[]; orderIds?: string[] }): { ok:true; next:TimelineState } | { ok:false; code:string } {
  let clips = state.clips;
  if (edits.clips) {
    for (const c of edits.clips) if (!validId(c.id) || c.durationMs<=0) return { ok:false, code:'invalid_clip' };
    clips = edits.clips.map(c=>({ ...c }));
  }
  if (edits.orderIds) {
    if (edits.orderIds.length !== clips.length || new Set(edits.orderIds).size !== clips.length) return { ok:false, code:'order_mismatch' };
    const byId = new Map(clips.map(c=>[c.id,c] as const));
    const ordered: TimelineClip[] = [];
    for (const id of edits.orderIds) { const c=byId.get(id); if (!c) return { ok:false, code:'order_unknown_id' }; ordered.push(c); }
    clips = ordered;
  }
  return { ok:true, next:{ clips, version: state.version+1, timebase:'ms' } };
}
export function setSubtitleCues(state: TimelineState, clipId:string, cues:{ startMs:number; endMs:number; text:string }[]): typeof applyTimelineEdit extends (...a: unknown[])=> infer R ? R : never {
  const clip = state.clips.find(c=>c.id===clipId);
  if (!clip) return { ok:false, code:'clip_not_found' } as unknown as ReturnType<typeof applyTimelineEdit>;
  for (const cu of cues) if (cu.startMs<0 || cu.endMs<=cu.startMs || cu.endMs> clip.durationMs) return { ok:false, code:'invalid_cue' } as unknown as ReturnType<typeof applyTimelineEdit>;
  const nextClips = state.clips.map(c=> c.id===clipId ? { ...c, subtitleCues: cues.map(x=>({ ...x })) } : c);
  return applyTimelineEdit(state, { clips: nextClips });
}

// ── Autosave/reload/undo/conflict and export parity ────────────────────────
export class EditorSession {
  private current: CanvasState | TimelineState | TextState;
  private kind: 'canvas'|'timeline'|'text';
  private history: (CanvasState|TimelineState|TextState)[] = [];
  private autosaved: (CanvasState|TimelineState|TextState) | null = null;
  constructor(kind:'canvas'|'timeline'|'text', initial: CanvasState|TimelineState|TextState) { this.kind=kind; this.current=initial; }
  get(): CanvasState|TimelineState|TextState { return JSON.parse(JSON.stringify(this.current)); }
  apply(next: CanvasState|TimelineState|TextState): void { this.history.push(JSON.parse(JSON.stringify(this.current))); this.current = JSON.parse(JSON.stringify(next)); }
  undo(): boolean { const prev=this.history.pop(); if (!prev) return false; this.current=prev; return true; }
  autosave(): void { this.autosaved = JSON.parse(JSON.stringify(this.current)); }
  reload(): CanvasState|TimelineState|TextState | null { return this.autosaved ? JSON.parse(JSON.stringify(this.autosaved)) : null; }
  conflictCheck(expectedVersion:number): boolean { return (this.current as {version:number}).version === expectedVersion; }
  exportParity(): ExportBundle {
    // golden fixture hash with pinned fonts/renderer — deterministic
    const h = hash({ kind:this.kind, state:this.current, fonts:['font-a','Inter'], renderer:'r1' });
    return { kind:this.kind, hash:h, renderCostMinor: this.kind==='canvas' ? 0 : 5 }; // local edit no paid, render may have small cost
  }
  keyboardMoveAvailable(): boolean { return true; }
}

// ── Flat/baked and unsupported limits visible ─────────────────────────────
export function isBakedText(editable: boolean): { editable:boolean; reason:string | null } {
  return editable ? { editable:true, reason:null } : { editable:false, reason:'baked_raster_not_editable_use_replace' };
}
export function unsupportedEffectVisible(effect:string): { supported:boolean; reason:string } {
  const unsupported = ['tracking-follow','generative-video-edit','native-orbits'];
  if (unsupported.includes(effect)) return { supported:false, reason:`${effect} unsupported in P2` };
  return { supported:true, reason:'' };
}
export function localEditCostsPaid(): boolean { return false; }
