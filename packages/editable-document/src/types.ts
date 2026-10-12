export type ContentKind = 'image' | 'text' | 'video' | 'sequence';
export type ContentState = 'draft' | 'planned' | 'published' | 'archived';
export type DocumentKind = 'canvas' | 'timeline' | 'sequence' | 'text';
export type VariantPurpose = 'original' | 'localization' | 'platform_adaptation' | 'draft';

export interface ContentItem {
  id: string;
  workspaceId: string;
  projectId: string;
  kind: ContentKind;
  briefVersion: string;
  recipeVersion: string;
  primaryChannelId: string | null;
  contentLocale: string;
  state: ContentState;
  currentRevisionRef: number | null;
  episodeId: string | null;
  retentionPolicyId: string | null;
  sourceRefs: string[];
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface ContentVariant {
  id: string;
  workspaceId: string;
  itemId: string;
  parentVariantId: string | null;
  purpose: VariantPurpose;
  platformProfileRef: string | null;
  market: string | null;
  locale: string;
  documentRevisionRef: number | null;
  acceptedRevisionRef: number | null;
  acceptedHash: string | null;
  acceptedExportProfile: string | null;
  createdAt: string;
}

export interface EditableDocument {
  id: string;
  workspaceId: string;
  itemId: string;
  schemaVersion: number;
  kind: DocumentKind;
  coordinateSpace: string;
  timebase: string | null;
  colorProfile: string | null;
  currentRevisionRef: number | null;
  createdAt: string;
  updatedAt: string;
}

// Canvas layers
export type CanvasLayerType = 'text' | 'image' | 'shape';
export interface CanvasLayer {
  id: string;
  type: CanvasLayerType;
  assetRef?: string | null;
  text?: string;
  style?: Record<string, unknown>;
  transform?: { x: number; y: number; scale: number; rotation: number };
  z: number;
  visible: boolean;
  locked: boolean;
}
export interface CanvasDocument { layers: CanvasLayer[]; coordinateSpace: string; units: string; origin: string; }

// Timeline
export interface TimelineClip {
  id: string;
  sourceRef: string;
  inMs: number;
  outMs: number;
  placementMs: number;
  durationMs: number;
  subtitleCues?: { startMs: number; endMs: number; text: string }[];
  keyframes?: unknown[];
}
export interface TimelineTrack { id: string; kind: 'video' | 'audio'; clips: TimelineClip[]; }
export interface TimelineDocument { tracks: TimelineTrack[]; timebase: string; }

// Sequence
export interface SequenceDocument { children: { revisionRef: number; durationMs: number; documentId: string }[]; theme?: string; }

// Text
export interface TextBlock { id: string; kind: 'paragraph' | 'heading' | 'list'; text: string; claimRefs?: string[]; style?: Record<string, unknown>; }
export interface TextDocument { blocks: TextBlock[]; }

export type AnyDocumentJson = CanvasDocument | TimelineDocument | SequenceDocument | TextDocument;

export interface DocumentRevision {
  documentId: string;
  workspaceId: string;
  revision: number;
  parentRevision: number | null;
  immutableJson: AnyDocumentJson;
  hash: string; // sha256 hex 64
  rendererVersion: string | null;
  fontRefs: string[];
  sourceAssetRefs: string[];
  createdBy: string;
  changeReason: string;
  createdAt: string;
}

export interface EditorCommand {
  documentId: string;
  workspaceId: string;
  baseRevision: number;
  idempotencyKey: string;
  validatedIntent: { newJson: AnyDocumentJson; changeReason: string };
  actor: string;
  resultRevision: number;
}

export interface VariantApproval {
  variantId: string;
  workspaceId: string;
  revisionHash: string;
  exportProfile: string;
  approvedAt: string;
  actor: string;
}

export interface RendererCapabilities {
  version: string;
  supportedNodeTypes: string[];
  maxCanvasWidth: number;
  maxCanvasHeight: number;
  supportedFonts: string[];
  timebase: string;
  colorProfile: string;
  officialSource: string;
}

export type UnsupportedOutcome = 'read_only' | 'degraded' | 'blocked';

export interface RegionEditRequest {
  id: string;
  workspaceId: string;
  documentRevisionRef: string;
  region: unknown;
  maskAssetRef: string | null;
  protectedRefs: string[];
  comment: string | null;
  operationId: string;
  candidateRevisionRef: number | null;
  driftReportRef: string | null;
}

export const MAX_JSON_BYTES = 2 * 1024 * 1024;
export const SCHEMA_VERSION = 1;
