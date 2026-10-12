import type { AnyDocumentJson, CanvasDocument, TimelineDocument, SequenceDocument, TextDocument, RendererCapabilities, UnsupportedOutcome } from './types.ts';

const CAPABILITIES: RendererCapabilities = {
  version: 'r1',
  supportedNodeTypes: ['text', 'image', 'shape', 'video_clip', 'audio_clip', 'paragraph', 'heading', 'list', 'sequence_child'],
  maxCanvasWidth: 8192,
  maxCanvasHeight: 8192,
  supportedFonts: ['font-a', 'font-b', 'font-c', 'Inter', 'Roboto'],
  timebase: 'ms',
  colorProfile: 'sRGB',
  officialSource: 'docs/architecture/EDITABLE_DOCUMENT_CONTRACT.md',
};

const GRAMMAR: Record<string, { nodes: string[] }> = {
  canvas: { nodes: ['text', 'image', 'shape'] },
  timeline: { nodes: ['video_clip', 'audio_clip'] },
  text: { nodes: ['paragraph', 'heading', 'list'] },
  sequence: { nodes: ['sequence_child'] },
};

export function getCapabilities(): RendererCapabilities {
  return { ...CAPABILITIES, supportedNodeTypes: [...CAPABILITIES.supportedNodeTypes], supportedFonts: [...CAPABILITIES.supportedFonts] };
}

export type ValidationOutcome =
  | { ok: true }
  | { ok: false; code: string; reason: string };

export function checkDocumentGrammar(kind: string, json: Record<string, unknown>): ValidationOutcome {
  if (kind === 'canvas') {
    const j = json as unknown as Partial<CanvasDocument>;
    if (!Array.isArray(j.layers)) return { ok: false, code: 'missing_layers', reason: 'canvas requires layers[]' };
    if (j.coordinateSpace == null || typeof j.coordinateSpace !== 'string') return { ok: false, code: 'missing_coordinateSpace', reason: 'coordinateSpace required' };
    if (typeof (j as Record<string, unknown>)['units'] !== 'string') return { ok: false, code: 'missing_units', reason: 'units required' };
    for (const layer of j.layers) {
      if (typeof (layer as Record<string, unknown>)['html'] !== 'undefined' || typeof (layer as Record<string, unknown>)['script'] !== 'undefined') return { ok: false, code: 'forbidden_html_script', reason: 'HTML/scripts not allowed in document' };
      if (typeof (layer as Record<string, unknown>)['src'] === 'string') {
        const s = (layer as Record<string, unknown>)['src'] as string;
        if (/^https?:\/\//.test(s) || s.includes('<script')) return { ok: false, code: 'remote_code_denied', reason: 'remote/HTML denied' };
      }
      if (GRAMMAR['canvas'] && !GRAMMAR['canvas'].nodes.includes((layer as Record<string, unknown>)['type'] as string)) return { ok: false, code: 'unsupported_node', reason: 'unsupported node type ' + String((layer as Record<string, unknown>)['type']) };
    }
    return { ok: true };
  }
  if (kind === 'timeline') {
    const j = json as unknown as Partial<TimelineDocument>;
    if (!Array.isArray(j.tracks)) return { ok: false, code: 'missing_tracks', reason: 'timeline requires tracks[]' };
    if (typeof j.timebase !== 'string') return { ok: false, code: 'missing_timebase', reason: 'timebase required' };
    return { ok: true };
  }
  if (kind === 'text') {
    const j = json as unknown as Partial<TextDocument>;
    if (!Array.isArray(j.blocks)) return { ok: false, code: 'missing_blocks', reason: 'text requires blocks[]' };
    return { ok: true };
  }
  if (kind === 'sequence') {
    const j = json as unknown as Partial<SequenceDocument>;
    if (!Array.isArray(j.children)) return { ok: false, code: 'missing_children', reason: 'sequence requires children[]' };
    return { ok: true };
  }
  return { ok: false, code: 'unknown_kind', reason: 'unknown document kind ' + kind };
}

export function resolveUnsupported(nodes: string[], caps: RendererCapabilities = CAPABILITIES): { unsupported: string[]; outcome: UnsupportedOutcome } {
  const unsupported = nodes.filter(n => !caps.supportedNodeTypes.includes(n));
  if (!unsupported.length) return { unsupported: [], outcome: 'read_only' };
  const blocked = unsupported.includes('unknown');
  if (blocked) return { unsupported, outcome: 'blocked' };
  return { unsupported, outcome: 'degraded' };
}

export function checkBounds(json: AnyDocumentJson, caps: RendererCapabilities = CAPABILITIES): ValidationOutcome {
  if ((json as CanvasDocument).layers) {
    for (const layer of (json as CanvasDocument).layers) {
      if (typeof layer.transform?.x === 'number' && Math.abs(layer.transform.x) > caps.maxCanvasWidth) return { ok: false, code: 'bounds_exceeded', reason: 'x out of bounds' };
      if (typeof layer.transform?.y === 'number' && Math.abs(layer.transform.y) > caps.maxCanvasHeight) return { ok: false, code: 'bounds_exceeded', reason: 'y out of bounds' };
    }
  }
  return { ok: true };
}

export function checkFonts(fontRefs: string[], caps: RendererCapabilities = CAPABILITIES): { unsupported: string[]; allSupported: boolean } {
  const unsupported = fontRefs.filter(f => !caps.supportedFonts.includes(f));
  return { unsupported, allSupported: !unsupported.length };
}
