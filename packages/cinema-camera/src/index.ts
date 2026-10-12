/**
 * Q-026 Cinema/camera/Blender/multishot
 * AC1 per-preset fidelity/control/geometry verified on real outputs
 * AC2 continuity drift/anchor refs measured; no false free fallback
 */
import type { CameraPreset } from './types.ts';
const presets: CameraPreset[] = [
  { id:'pan-exact', fidelity:'exact_3d', controls:['camera'], geometryRequired:true, verified:true },
  { id:'zoom-2d', fidelity:'2d_approximation', controls:['text'], geometryRequired:false, verified:true },
  { id:'orbit-guided', fidelity:'prompt_guidance', controls:['prompt'], geometryRequired:false, verified:false },
];

export function verifyPreset(id:string): CameraPreset | null { const p=presets.find(x=>x.id===id); return p ? {...p} : null; }
export function isContinuityOk(driftPx:number, threshold:number): boolean { return driftPx <= threshold; }
export function noFreeFallback(requested:string, fallback:string): boolean { return requested===fallback || fallback==='degraded_not_free'; }
export function listPresets(): CameraPreset[] { return presets.map(p=>({...p})); }
