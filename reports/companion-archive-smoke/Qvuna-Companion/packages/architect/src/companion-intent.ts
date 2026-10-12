/** B-056 shared offline intake recipe, NOT an LLM/authorizer/mission executor. */
import {fingerprint} from './index.ts';import {exactObject,validRelativeFile} from '../../companion-protocol/src/index.ts';
export interface CompanionIntent {schemaVersion:1;module:'desktop-companion';source:'reviewed-transcript';status:'proposal'|'needs_context'|'needs_model';recipeId:'local.file-inventory.v1'|null;files:string[];inputHash:string;executionAllowed:false;requiresLocalGrant:true;budgetReserved:false;modelCallAllowed:false;}
export function reviewCompanionIntent(value:unknown):CompanionIntent{
 const v=exactObject(value,['schemaVersion','text','selectedFiles']);
 if(v['schemaVersion']!==1||typeof v['text']!=='string'||!v['text'].trim()||v['text'].length>4096||!Array.isArray(v['selectedFiles'])||v['selectedFiles'].length>32||!v['selectedFiles'].every(validRelativeFile)||new Set(v['selectedFiles'].map((s:string)=>s.toLowerCase())).size!==v['selectedFiles'].length)throw Error('invalid_companion_intent');
 const text=v['text'].toLowerCase().trim().replace(/[.!?]+$/,'').replace(/\s+/g,' ');
 const recipe=['проверь файлы','проверить файлы','проверь выбранные файлы','составь список файлов'].includes(text);
 const files=[...v['selectedFiles']] as string[];
 return {schemaVersion:1,module:'desktop-companion',source:'reviewed-transcript',status:recipe?(files.length?'proposal':'needs_context'):'needs_model',recipeId:recipe?'local.file-inventory.v1':null,files:recipe?files:[],inputHash:fingerprint(v),executionAllowed:false,requiresLocalGrant:true,budgetReserved:false,modelCallAllowed:false};
}
