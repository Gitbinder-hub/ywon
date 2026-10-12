/** Model Switch types */
export type ProviderKind = 'official' | 'aggregator' | 'local';
export type ProviderHealth = 'healthy' | 'degraded' | 'down';
export interface ProviderEntry {
  id: string; version: string; kind: ProviderKind; officialSource: string; checkedAt: string;
  pricingVersion: string; costPer1kMinor: number; capabilityFidelity: string[]; health: ProviderHealth;
}
export interface RadarSnapshot { at: string; entries: ProviderEntry[]; deltaPercent: number | null }
