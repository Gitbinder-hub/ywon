/** Q-039 editor types */
export type OverlayKind = 'text' | 'image' | 'shape';
export interface Overlay { id: string; kind: OverlayKind; text?: string; style?: Record<string,unknown>; transform?: { x:number; y:number; scale:number; rotation:number }; visible:boolean; locked:boolean }
export interface CanvasState { overlays: Overlay[]; selectedId: string | null; version:number }
export interface TimelineClip { id:string; sourceRef:string; inMs:number; outMs:number; durationMs:number; subtitleCues?: { startMs:number; endMs:number; text:string }[] }
export interface TimelineState { clips: TimelineClip[]; version:number; timebase:'ms' }
export interface TextState { blocks: { id:string; text:string; locked?:boolean }[]; version:number }
export interface ExportBundle { kind:'canvas'|'timeline'|'text'; hash:string; renderCostMinor:number | null }
