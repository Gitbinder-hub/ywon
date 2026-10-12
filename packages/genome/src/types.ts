/** Q-011 types */
export type Language = 'en'|'ru';
export type FactTier = 'confirmed'|'inferred'|'experimental';
export interface GenomeFact { key:string; value:string; tier:FactTier; source:string }
export interface Genome { userId:string; workspaceId:string; language:Language; presentation:string; budgetMinor:number; consentVoice:boolean; consentFace:boolean; manualReview:boolean; storagePolicy:string; completedAt?:string }
export interface SeriesBible { seriesId:string; workspaceId:string; version:number; canonical:string; primaryChannelId:string; language:Language; facts: GenomeFact[] }
