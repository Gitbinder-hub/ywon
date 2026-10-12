/** Q-015 types */
export interface MediaItem { id:string; workspaceId:string; kind:'image'|'video'; sha256:string; rightsApproved:boolean; availability:'available'|'quarantined'|'deleted'; provenanceHash:string }
export interface PublishPackage { itemId:string; workspaceId:string; metadata:Record<string,unknown>; rightsHash:string; manifestHash:string }
export type YoutubeState = { apiEnabled:boolean; auditNote:string; quotaChecked:boolean; oauthVerified:boolean; disclosureOk:boolean; duplicateGuard:boolean } | null;
