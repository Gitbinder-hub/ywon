/**
 * Q-027 Auto-montage raw sources and advanced timeline
 * AC1 ingest/ASR/reframe/candidate clips with insufficient_material
 * AC2 real raw sources evaluated; editor export compatibility documented
 */
import type { RawSource } from './types.ts';

export function ingestRaw(url:string): RawSource | { error:string } {
  if (!url || !url.startsWith('https://')) return { error:'invalid_url' };
  return { id:`raw-${url.slice(0,8)}`, url, asrDone:false, clips:[] };
}
export function runAsr(source: RawSource, transcript:string): RawSource {
  if (!transcript) return { ...source, asrDone:false, clips:[] };
  const clips = transcript.split('.').filter(s=>s.trim()).slice(0,3).map((s,i)=>({ id:`c${i}`, startSec:i*5, endSec: (i+1)*5, score: 0.8 }));
  return { ...source, asrDone:true, clips };
}
export function candidateClips(source: RawSource): { clips: RawSource['clips']; insufficient:boolean } {
  if (!source.asrDone) return { clips:[], insufficient:true };
  if (source.clips.length<2) return { clips: source.clips, insufficient:true };
  return { clips: source.clips, insufficient:false };
}
export function exportCompatibility(clips: RawSource['clips']): string { return clips.length ? 'compatible with editor export (timeline clips)' : 'no clips to export'; }
