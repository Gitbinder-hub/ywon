/** Q-016 types */
export interface EpisodeRun { id:string; qaOk:boolean; costMinor:number; humanMinutes:number; evidenceHash:string; attemptCount:number; failed?:boolean; rootCause?:string }
