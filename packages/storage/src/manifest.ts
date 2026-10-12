import { createHash } from 'node:crypto';
import type { StoredAsset } from './types.ts';
export type PinManifest = {
  schemaVersion: 1; assetId: string; version: number; sha256: string; bytes: number;
  objectKey: string; rendererVersion: string | null; fontRefs: string[]; sourceAssetRefs: string[];
  manifestHash: string;
};
export function pinManifest(asset: StoredAsset, sourceAssetRefs: string[]): PinManifest {
  const base = {
    schemaVersion: 1 as const, assetId: asset.assetId, version: asset.version,
    sha256: asset.sha256, bytes: asset.bytes, objectKey: asset.objectKey,
    rendererVersion: asset.rendererVersion, fontRefs: [...asset.fontRefs], sourceAssetRefs: [...sourceAssetRefs],
  };
  const json = JSON.stringify(base);
  const hash = createHash('sha256').update(json, 'utf8').digest('hex');
  return { ...base, manifestHash: hash };
}
export function verifyManifest(m: PinManifest): boolean {
  const { manifestHash, ...rest } = m;
  const json = JSON.stringify(rest);
  const comp = createHash('sha256').update(json, 'utf8').digest('hex');
  return comp === manifestHash;
}
