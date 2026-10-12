/** Router proxy — single hop via model-switch + cost-visibility */
export type RouteMode = 'fixture'|'live';
export interface RouteInput { fidelity: string; estimatedMinor: number; baselineMinor: number }
