/**
 * Tool Registry — capability-compatible adapter registry (OpenMontage tools/ → Ywon typed adapters)
 * Normative: docs/production/06_MODEL_ROUTER.md, docs/production/15_STUDIO_SKILLS.md,
 *            docs/studio/SCENE_COMPILER.md, docs/architecture/03_ARCHITECTURE.md
 *
 * Mechanism borrowed from OpenMontage BaseTool auto-discovery; code is original.
 * Each adapter declares validateInput / normalizeError / priceEstimate / capability manifest
 * with version/region/limits/provenance. Hard constraints first, then scored fallback.
 */

export type ExecutionFidelity = 'exact_3d' | 'supported_control' | 'prompt_guidance' | '2d_approximation';

export interface CapabilityManifest {
  id: string;
  version: string;
  region: string | null;
  limits: {
    durationsSec: [number, number] | null;
    aspectRatios: string[] | null;
    resolutions: string[] | null;
    maxReferenceImages: number | null;
    maxReferenceVideoSec: number | null;
    cameraControl: 'none' | 'prompt' | 'native' | 'reference_control';
    depthPoseInputs: boolean;
    languages: string[] | null;
  };
  provenance: { officialSource: string; verifiedAt: string | null; license: string | null };
  pricing: { currency: 'USD'; version: string; perSecondMinor: number | null; perImageMinor: number | null } | null;
  requiresConsent: boolean;
  supported: boolean;
}

export interface ToolAdapter {
  id: string;
  version: string;
  fidelity: ExecutionFidelity;
  kind: 'video' | 'audio' | 'graphics' | 'enhancement' | 'analysis' | 'avatar' | 'subtitle';
  manifest: CapabilityManifest;
  validateInput(input: Record<string, unknown>): { ok: true } | { ok: false; code: string; field?: string };
  normalizeError(raw: unknown): { code: string; retryable: boolean; message: string };
  priceEstimate(input: Record<string, unknown>): { estimatedMinor: number; currency: 'USD'; pricingVersion: string } | { estimatedMinor: null; reason: string };
  submit?(input: Record<string, unknown>, idempotencyKey: string): Promise<{ jobId: string }>;
  poll?(jobId: string): Promise<{ status: 'pending' | 'succeeded' | 'failed' | 'unknown'; result?: unknown }>;
  cancel?(jobId: string): Promise<{ ok: boolean }>;
}

export interface RegistryEntry {
  adapter: ToolAdapter;
  registeredAt: string;
}

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$/;

export class ToolRegistry {
  private entries = new Map<string, RegistryEntry>();

  key(id: string, version: string): string { return `${id}@${version}`; }

  register(adapter: ToolAdapter): { ok: true } | { ok: false; code: string } {
    if (!SAFE_ID.test(adapter.id)) return { ok: false, code: 'invalid_id' };
    if (!SAFE_ID.test(adapter.version)) return { ok: false, code: 'invalid_version' };
    if (!adapter.manifest || typeof adapter.manifest !== 'object') return { ok: false, code: 'manifest_required' };
    if (!adapter.manifest.provenance?.officialSource?.startsWith('https://')) return { ok: false, code: 'official_source_required' };
    const k = this.key(adapter.id, adapter.version);
    if (this.entries.has(k)) return { ok: false, code: 'already_exists' };
    this.entries.set(k, { adapter, registeredAt: new Date().toISOString() });
    return { ok: true };
  }

  get(id: string, version: string): ToolAdapter | null {
    const e = this.entries.get(this.key(id, version));
    return e ? e.adapter : null;
  }

  list(): ToolAdapter[] { return [...this.entries.values()].map(e => e.adapter); }

  /** Hard-constraint filtering per 06_MODEL_ROUTER.md — inputs/consent/region/fidelity */
  filterByConstraints(input: {
    requiredFidelity?: ExecutionFidelity;
    requiredLanguages?: string[];
    hasConsent?: boolean;
    durationSec?: number;
  }): ToolAdapter[] {
    return this.list().filter(a => {
      if (!a.manifest.supported) return false;
      if (input.requiredFidelity && a.fidelity !== input.requiredFidelity) {
        // 2d_approximation never satisfies exact_3d
        if (input.requiredFidelity === 'exact_3d' && a.fidelity !== 'exact_3d') return false;
        if (input.requiredFidelity === 'supported_control' && a.fidelity === 'prompt_guidance') return false;
      }
      if (input.hasConsent === false && a.manifest.requiresConsent) return false;
      if (input.requiredLanguages?.length) {
        const langs = a.manifest.limits.languages;
        if (langs && !input.requiredLanguages.every(l => langs.includes(l))) return false;
      }
      if (input.durationSec !== undefined) {
        const d = a.manifest.limits.durationsSec;
        if (d && (input.durationSec < d[0] || input.durationSec > d[1])) return false;
      }
      return true;
    });
  }

  /** Cheapest supported after hard constraints — scored selection placeholder */
  cheapestSupported(constraints: Parameters<ToolRegistry['filterByConstraints']>[0]): ToolAdapter | null {
    const filtered = this.filterByConstraints(constraints);
    if (!filtered.length) return null;
    const priced = filtered.map(a => ({ adapter: a, estimate: a.priceEstimate({}) }));
    priced.sort((x, y) => {
      const xm = x.estimate.estimatedMinor ?? Number.MAX_SAFE_INTEGER;
      const ym = y.estimate.estimatedMinor ?? Number.MAX_SAFE_INTEGER;
      return xm - ym;
    });
    return priced[0]!.adapter;
  }
}

export function isToolRegistryWired(): boolean { return true; }

/** No-key fallback envelope for CI/offline (Piper/TTS + archive + canvas) → T0 degraded */
export const NO_KEY_FALLBACK: CapabilityManifest = {
  id: 'no-key-fallback',
  version: '1',
  region: null,
  limits: {
    durationsSec: [1, 60],
    aspectRatios: ['16:9', '9:16', '1:1'],
    resolutions: ['1280x720'],
    maxReferenceImages: 4,
    maxReferenceVideoSec: null,
    cameraControl: 'none',
    depthPoseInputs: false,
    languages: ['en', 'ru'],
  },
  provenance: { officialSource: 'https://ywoom.local/fallback', verifiedAt: null, license: null },
  pricing: { currency: 'USD', version: 'fallback-1', perSecondMinor: 0, perImageMinor: 0 },
  requiresConsent: false,
  supported: true,
};
