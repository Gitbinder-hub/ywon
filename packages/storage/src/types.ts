export type AssetKind = 'image' | 'audio' | 'video';
export type AssetState = 'quarantined' | 'verified' | 'blocked' | 'deletion_pending' | 'deleted';
export type ScanStatus = 'pending' | 'clean' | 'infected' | 'error';
export type RightsStatus = 'pending' | 'approved' | 'revoked';

export interface RetentionPolicy {
  id: string;
  ttlDays: number | null;
  retainUntil: string | null; // ISO 8601 or null = forever per policy
}

export interface StoredAsset {
  assetId: string;
  workspaceId: string;
  projectId: string;
  kind: AssetKind;
  sha256: string;
  bytes: number;
  mime: string;
  retentionPolicyId: string;
  objectKey: string;
  version: number;
  state: AssetState;
  scanStatus: ScanStatus;
  rightsStatus: RightsStatus;
  consentIds: string[];
  rendererVersion: string | null;
  fontRefs: string[];
  manifestHash: string | null;
  sourceRef: string | null;
  licenseRef: string | null;
  createdAt: string;
  verifiedAt: string | null;
  deletedAt: string | null;
  deletedReason: string | null;
  checksumVerified: boolean;
  provenanceVerified: boolean;
}

export interface RemountEntry {
  assetId: string;
  version?: number;
  reason: string;
}

export interface RemountResult {
  available: RemountEntry[];
  unavailable: RemountEntry[];
}

export const MAX_BYTES_BY_KIND: Record<AssetKind, number> = {
  image: 20 * 1024 * 1024,
  audio: 50 * 1024 * 1024,
  video: 500 * 1024 * 1024,
};

export const MIME_BY_KIND: Record<AssetKind, Set<string>> = {
  image: new Set(['image/png', 'image/jpeg']),
  audio: new Set(['audio/wav', 'audio/mpeg', 'audio/mp4']),
  video: new Set(['video/mp4']),
};
