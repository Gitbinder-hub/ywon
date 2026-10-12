/** Q-040 types */
export type Entrance = 'chat'|'guided'|'import';
export interface Brief { id:string; workspaceId:string; projectId:string; language:'en'|'ru'; audience:string; goal:string; budgetMinor:number; risksConfirmed:boolean; savedFrom?: Entrance }
export interface StaticAsset { id:string; version:number; layout:string; overlays: {id:string; kind:string}[]; hash:string }
export interface ProofBundle { asset: StaticAsset; editableRef:string; chatResultSameWorkspace:boolean }
