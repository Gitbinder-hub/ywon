import { createHash } from 'node:crypto';
import type { ContentItem, ContentVariant, EditableDocument, DocumentRevision, AnyDocumentJson } from './types.ts';
import { SCHEMA_VERSION, MAX_JSON_BYTES } from './types.ts';
import { getCapabilities, checkDocumentGrammar, checkBounds } from './renderer.ts';
const HEX64 = /^[0-9a-f]{64}$/;
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$/;
const LOCALE = /^(en|ru)(?:-[A-Z]{2})?$/;
function nowIso(): string { return new Date().toISOString(); }
function hexSha(s: string): string { return createHash('sha256').update(s,'utf8').digest('hex'); }
function sizeBytes(v: unknown): number { return Buffer.byteLength(JSON.stringify(v),'utf8'); }
export type ItemInput = { id:string; workspaceId:string; projectId:string; kind:ContentItem["kind"]; contentLocale:string; state?:ContentItem["state"]; episodeId?:string|null; primaryChannelId?:string|null; retentionPolicyId?:string|null; sourceRefs?:string[]; };
export type VariantInput = { id:string; workspaceId:string; itemId:string; parentVariantId?:string|null; purpose:ContentVariant["purpose"]; platformProfileRef?:string|null; market?:string|null; locale:string; };
export type DocInput = { id:string; workspaceId:string; itemId:string; kind:EditableDocument["kind"]; coordinateSpace?:string; timebase?:string|null; colorProfile?:string|null; };
export type CreateRevisionInput = { documentId:string; workspaceId:string; actor:string; changeReason:string; baseRevision:number|null; newJson:AnyDocumentJson; rendererVersion?:string|null; fontRefs?:string[]; sourceAssetRefs?:string[]; };
export type Result<T> = { ok:true; value:T } | { ok:false; code:string; reason?:string };
export class EditableDocumentStore {
  private items = new Map<string, ContentItem>();
  private variants = new Map<string, ContentVariant>();
  private docs = new Map<string, EditableDocument>();
  private revisions = new Map<string, DocumentRevision[]>();
  private commands = new Map<string, string>();
  private audit: string[] = [];
  private k(ws:string,id:string):string{ return ws+':'+id; }
  getAudit():string[]{ return [...this.audit]; }
  createItem(input:ItemInput):Result<ContentItem>{
    if(!SAFE_ID.test(input.id)) return {ok:false,code:'invalid_id'};
    if(!SAFE_ID.test(input.workspaceId)) return {ok:false,code:'invalid_workspaceId'};
    if(!SAFE_ID.test(input.projectId)) return {ok:false,code:'invalid_projectId'};
    if(!['image','text','video','sequence'].includes(input.kind)) return {ok:false,code:'unsupported_kind'};
    if(!LOCALE.test(input.contentLocale)) return {ok:false,code:'invalid_locale'};
    if(input.episodeId && !SAFE_ID.test(input.episodeId)) return {ok:false,code:'invalid_episodeId'};
    if((input.kind==='text'||input.kind==='image')&&input.episodeId) return {ok:false,code:'fake_episode_forbidden',reason:'text/image must not bind episode'};
    if(input.primaryChannelId && !SAFE_ID.test(input.primaryChannelId)) return {ok:false,code:'invalid_primaryChannelId'};
    if((input.state==='planned'||input.state==='published')&&!input.primaryChannelId) return {ok:false,code:'planned_requires_channel'};
    const state=input.state??'draft';
    if(this.items.has(this.k(input.workspaceId,input.id))) return {ok:false,code:'already_exists'};
    const item:ContentItem={ id:input.id, workspaceId:input.workspaceId, projectId:input.projectId, kind:input.kind, briefVersion:'v1', recipeVersion:'v1', primaryChannelId:input.primaryChannelId??null, contentLocale:input.contentLocale, state, currentRevisionRef:null, episodeId:input.episodeId??null, retentionPolicyId:input.retentionPolicyId??null, sourceRefs:input.sourceRefs??[], createdAt:nowIso(), updatedAt:nowIso(), version:1 };
    this.items.set(this.k(input.workspaceId,input.id),{...item}); this.audit.push('item.create '+this.k(input.workspaceId,input.id)+' kind='+input.kind); return {ok:true,value:{...item}};
  }
  getItem(workspaceId:string,id:string):ContentItem|null{ const v=this.items.get(this.k(workspaceId,id)); return v?{...v}:null; }
  createVariant(input:VariantInput):Result<ContentVariant>{
    if(!SAFE_ID.test(input.id)) return {ok:false,code:'invalid_id'};
    if(!SAFE_ID.test(input.workspaceId)) return {ok:false,code:'invalid_workspaceId'};
    if(!SAFE_ID.test(input.itemId)) return {ok:false,code:'invalid_itemId'};
    if(!LOCALE.test(input.locale)) return {ok:false,code:'invalid_locale'};
    const item=this.items.get(this.k(input.workspaceId,input.itemId)); if(!item) return {ok:false,code:'item_not_found'};
    if(item.workspaceId!==input.workspaceId) return {ok:false,code:'tenant_denied'};
    if(input.parentVariantId){ if(!SAFE_ID.test(input.parentVariantId)) return {ok:false,code:'invalid_parentVariantId'}; const parent=this.variants.get(this.k(input.workspaceId,input.parentVariantId)); if(!parent) return {ok:false,code:'parent_variant_not_found'}; if(parent.itemId!==input.itemId) return {ok:false,code:'parent_item_mismatch'}; if(parent.workspaceId!==input.workspaceId) return {ok:false,code:'tenant_denied'}; }
    if(this.variants.has(this.k(input.workspaceId,input.id))) return {ok:false,code:'already_exists'};
    const v:ContentVariant={ id:input.id, workspaceId:input.workspaceId, itemId:input.itemId, parentVariantId:input.parentVariantId??null, purpose:input.purpose, platformProfileRef:input.platformProfileRef??null, market:input.market??null, locale:input.locale, documentRevisionRef:null, acceptedRevisionRef:null, acceptedHash:null, acceptedExportProfile:null, createdAt:nowIso() };
    this.variants.set(this.k(input.workspaceId,input.id),{...v}); this.audit.push('variant.create '+this.k(input.workspaceId,input.id)+' purpose='+input.purpose); return {ok:true,value:{...v}};
  }
  getVariant(workspaceId:string,id:string):ContentVariant|null{ const v=this.variants.get(this.k(workspaceId,id)); return v?{...v}:null; }

  createDocument(input:DocInput):Result<EditableDocument>{
    if(!SAFE_ID.test(input.id)) return {ok:false,code:'invalid_id'};
    if(!SAFE_ID.test(input.workspaceId)) return {ok:false,code:'invalid_workspaceId'};
    if(!SAFE_ID.test(input.itemId)) return {ok:false,code:'invalid_itemId'};
    const item=this.items.get(this.k(input.workspaceId,input.itemId)); if(!item) return {ok:false,code:'item_not_found'};
    if(item.workspaceId!==input.workspaceId) return {ok:false,code:'tenant_denied'};
    if(this.docs.has(this.k(input.workspaceId,input.id))) return {ok:false,code:'already_exists'};
    const compat:Record<string,string[]>={ image:['canvas'], text:['text'], video:['timeline'], sequence:['sequence'] };
    if(!compat[item.kind]!.includes(input.kind)) return {ok:false,code:'kind_incompatible',reason:item.kind+' not compatible with '+input.kind};
    const doc:EditableDocument={ id:input.id, workspaceId:input.workspaceId, itemId:input.itemId, schemaVersion:SCHEMA_VERSION, kind:input.kind, coordinateSpace:input.coordinateSpace??'canonical', timebase:input.timebase??null, colorProfile:input.colorProfile??null, currentRevisionRef:null, createdAt:nowIso(), updatedAt:nowIso() };
    this.docs.set(this.k(input.workspaceId,input.id),{...doc}); this.audit.push('document.create '+this.k(input.workspaceId,input.id)+' kind='+input.kind); return {ok:true,value:{...doc}};
  }
  getDocument(workspaceId:string,id:string):EditableDocument|null{ const v=this.docs.get(this.k(workspaceId,id)); return v?{...v}:null; }
  private _createRevision(input:CreateRevisionInput):Result<DocumentRevision>{
    const doc=this.docs.get(this.k(input.workspaceId,input.documentId)); if(!doc) return {ok:false,code:'document_not_found'};
    if(input.baseRevision!==null){ if(!Number.isInteger(input.baseRevision)||input.baseRevision<1) return {ok:false,code:'invalid_baseRevision'}; if((doc.currentRevisionRef??0)!==input.baseRevision) return {ok:false,code:'conflict_base_revision'}; } else { if(doc.currentRevisionRef!==null) return {ok:false,code:'conflict_base_revision'}; }
    if(sizeBytes(input.newJson)>MAX_JSON_BYTES) return {ok:false,code:'json_too_large'};
    const g=checkDocumentGrammar(doc.kind, input.newJson as unknown as Record<string,unknown>); if(!g.ok) return {ok:false,code:(g as unknown as {code:string}).code,reason:(g as unknown as {reason:string}).reason};
    const caps=getCapabilities(); const b=checkBounds(input.newJson as unknown as AnyDocumentJson, caps); if(!b.ok) return {ok:false,code:(b as unknown as {code:string}).code};
    if(!input.actor) return {ok:false,code:'missing_actor'};
    const hash=hexSha(JSON.stringify(input.newJson)); if(!HEX64.test(hash)) return {ok:false,code:'hash_internal'};
    const nextRev=(doc.currentRevisionRef??0)+1;
    const rev:DocumentRevision={ documentId:input.documentId, workspaceId:input.workspaceId, revision:nextRev, parentRevision:doc.currentRevisionRef, immutableJson:input.newJson as AnyDocumentJson, hash, rendererVersion:input.rendererVersion??caps.version, fontRefs:input.fontRefs??[], sourceAssetRefs:input.sourceAssetRefs??[], createdBy:input.actor, changeReason:input.changeReason, createdAt:nowIso() };
    const arr=this.revisions.get(input.documentId)??[]; arr.push(rev); this.revisions.set(input.documentId,arr);
    doc.currentRevisionRef=nextRev; doc.updatedAt=nowIso(); this.docs.set(this.k(input.workspaceId,input.documentId),{...doc});
    const item=this.items.get(this.k(input.workspaceId,doc.itemId)); if(item){ item.currentRevisionRef=nextRev; item.updatedAt=nowIso(); this.items.set(this.k(item.workspaceId,item.id),{...item}); }
    for(const v of this.variants.values()){ if(v.itemId===doc.itemId && v.workspaceId===input.workspaceId && v.acceptedRevisionRef!==null && v.acceptedRevisionRef!==nextRev){ v.acceptedRevisionRef=null; v.acceptedHash=null; v.acceptedExportProfile=null; this.variants.set(this.k(v.workspaceId,v.id),{...v}); this.audit.push('approval.invalidated variant='+this.k(v.workspaceId,v.id)+' newRev='+nextRev); } }
    this.audit.push('revision.create '+input.workspaceId+':'+input.documentId+':'+nextRev+' hash='+hash.slice(0,8)); return {ok:true,value:{...rev,immutableJson:rev.immutableJson as AnyDocumentJson}};
  }

  applyCommand(input:{documentId:string; workspaceId:string; baseRevision:number|null; idempotencyKey:string; newJson:AnyDocumentJson; actor:string; changeReason:string; fontRefs?:string[]; sourceAssetRefs?:string[]; rendererVersion?:string|null}):Result<{revision:DocumentRevision; created:boolean}>{
    if(!SAFE_ID.test(input.idempotencyKey)) return {ok:false,code:'invalid_idempotencyKey'};
    const idemKey=input.workspaceId+':'+input.documentId+':'+input.idempotencyKey;
    const existing=this.commands.get(idemKey); if(existing){ const revs=this.revisions.get(input.documentId)??[]; const found=revs.find(r=>String(r.revision)===existing); if(found) return {ok:true,value:{revision:{...found},created:false}}; return {ok:false,code:'idempotency_revisions_lost'}; }
    const docBefore=this.docs.get(this.k(input.workspaceId,input.documentId)); if(!docBefore) return {ok:false,code:'document_not_found'};
    if(input.baseRevision!==null && (docBefore.currentRevisionRef??0)!==input.baseRevision) return {ok:false,code:'conflict_base_revision'};
    if(input.baseRevision===null && docBefore.currentRevisionRef!==null) return {ok:false,code:'conflict_base_revision'};
    if(sizeBytes(input.newJson)>MAX_JSON_BYTES) return {ok:false,code:'json_too_large'};
    const g=checkDocumentGrammar(docBefore.kind, input.newJson as unknown as Record<string,unknown>); if(!g.ok) return {ok:false,code:(g as unknown as {code:string}).code};
    const r=this._createRevision({ documentId:input.documentId, workspaceId:input.workspaceId, actor:input.actor, changeReason:input.changeReason, baseRevision:input.baseRevision, newJson:input.newJson, rendererVersion:input.rendererVersion??null, fontRefs:input.fontRefs??[], sourceAssetRefs:input.sourceAssetRefs??[] });
    if(!r.ok) return r as unknown as Result<{revision:DocumentRevision; created:boolean}>;
    this.commands.set(idemKey,String(r.value.revision)); return {ok:true,value:{revision:r.value,created:true}};
  }

  approveVariant(input:{variantId:string; workspaceId:string; revision:number; hash:string; exportProfile:string; actor:string}):Result<void>{
    if(!SAFE_ID.test(input.variantId)) return {ok:false,code:'invalid_variantId'};
    if(!HEX64.test(input.hash)) return {ok:false,code:'invalid_hash'};
    const v=this.variants.get(this.k(input.workspaceId,input.variantId)); if(!v) return {ok:false,code:'variant_not_found'};
    const docs=[...this.docs.values()].filter(d=>d.itemId===v.itemId && d.workspaceId===v.workspaceId); if(!docs.length) return {ok:false,code:'document_not_found'};
    const doc=docs[0]!; const revs=this.revisions.get(doc.id)??[]; const rev=revs.find(r=>r.revision===input.revision); if(!rev) return {ok:false,code:'revision_not_found'}; if(rev.hash!==input.hash) return {ok:false,code:'hash_mismatch'};
    v.acceptedRevisionRef=input.revision; v.acceptedHash=input.hash; v.acceptedExportProfile=input.exportProfile; v.documentRevisionRef=input.revision; this.variants.set(this.k(input.workspaceId,input.variantId),{...v}); this.audit.push('variant.approve '+this.k(input.workspaceId,input.variantId)+' rev='+input.revision); return {ok:true,value:undefined as unknown as void};
  }
  rollback(documentId:string,workspaceId:string,targetRevision:number,actor:string):Result<DocumentRevision>{
    const doc=this.docs.get(this.k(workspaceId,documentId)); if(!doc) return {ok:false,code:'document_not_found'};
    const revs=this.revisions.get(documentId)??[]; const target=revs.find(r=>r.revision===targetRevision); if(!target) return {ok:false,code:'revision_not_found'};
    const current=doc.currentRevisionRef??0;
    return this._createRevision({ documentId, workspaceId, actor, changeReason:'rollback:'+targetRevision, baseRevision:current, newJson:target.immutableJson as AnyDocumentJson, rendererVersion:target.rendererVersion, fontRefs:[...target.fontRefs], sourceAssetRefs:[...target.sourceAssetRefs] });
  }
  listRevisions(documentId:string,workspaceId:string):DocumentRevision[]{ const doc=this.docs.get(this.k(workspaceId,documentId)); if(!doc||doc.workspaceId!==workspaceId) return []; return (this.revisions.get(documentId)??[]).map(r=>({...r,immutableJson:r.immutableJson as AnyDocumentJson})); }
  getRevision(documentId:string,workspaceId:string,revision:number):DocumentRevision|null{ const doc=this.docs.get(this.k(workspaceId,documentId)); if(!doc||doc.workspaceId!==workspaceId) return null; const r=(this.revisions.get(documentId)??[]).find(x=>x.revision===revision); return r?{...r,immutableJson:r.immutableJson as AnyDocumentJson}:null; }
}
