/** B-051 shared bounded local-task contract. No new money/policy engine or cloud authority. */
import {createHash} from 'node:crypto';
export const PROTOCOL_VERSION=1 as const;
export const LOCAL_SKILL={id:'local.file-inventory',version:'1'} as const;
export interface FileRef {path:string;sha256:string;}
export interface LocalTask {
 schemaVersion:1;protocolVersion:1;taskId:string;operationId:string;deviceId:string;workspaceId:string;
 grantId:string;revision:1;skillId:'local.file-inventory';skillVersion:'1';files:FileRef[];costMinor:0;
}
export interface LocalGrantInput {
 schemaVersion:1;grantId:string;deviceId:string;workspaceId:string;root:string;expiresAt:string;
 maxTasks:number;maxFiles:number;maxTotalBytes:number;
}
const identifier=/^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$/;
export function validId(v:unknown):v is string{return typeof v==='string'&&identifier.test(v);}
export function canonical(v:unknown):string{
 if(v===null||typeof v!=='object')return JSON.stringify(v)??'null';
 if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';
 const o=v as Record<string,unknown>;return '{'+Object.keys(o).sort().map(k=>JSON.stringify(k)+':'+canonical(o[k])).join(',')+'}';
}
export function digest(v:unknown):string{return createHash('sha256').update(canonical(v)).digest('hex');}
export function exactObject(v:unknown,keys:readonly string[]):Record<string,unknown>{
 if(typeof v!=='object'||v===null||Array.isArray(v))throw Error('invalid_contract');
 const o=v as Record<string,unknown>;
 if(Object.keys(o).length!==keys.length||keys.some(k=>!Object.hasOwn(o,k)))throw Error('invalid_contract');return o;
}
export function integer(v:unknown,min:number,max:number):v is number{return typeof v==='number'&&Number.isSafeInteger(v)&&v>=min&&v<=max;}
export function validRelativeFile(v:unknown):v is string{
 if(typeof v!=='string'||v.length<1||v.length>240||v.includes('\\')||/[\x00-\x1f:\x7f]/.test(v))return false;
 const parts=v.split('/');
 if(parts.length>8||parts.some(p=>!p||p.startsWith('.')||/[. ]$/.test(p)||/[<>"|?*]/.test(p)||/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(p)))return false;
 return /\.(txt|md|csv|json)$/i.test(v);
}
export function parseTask(value:unknown):LocalTask{
 const v=exactObject(value,['schemaVersion','protocolVersion','taskId','operationId','deviceId','workspaceId','grantId','revision','skillId','skillVersion','files','costMinor']);
 if(v['schemaVersion']!==1||v['protocolVersion']!==1||v['revision']!==1||v['skillId']!==LOCAL_SKILL.id||v['skillVersion']!==LOCAL_SKILL.version||v['costMinor']!==0)throw Error('unsupported_task');
 for(const k of ['taskId','operationId','deviceId','workspaceId','grantId'])if(!validId(v[k]))throw Error('invalid_id');
 if(!Array.isArray(v['files'])||v['files'].length<1||v['files'].length>32)throw Error('file_limit');
 const files:FileRef[]=v['files'].map(x=>{const f=exactObject(x,['path','sha256']);if(!validRelativeFile(f['path'])||typeof f['sha256']!=='string'||!/^[a-f0-9]{64}$/.test(f['sha256']))throw Error('invalid_file_ref');return {path:f['path'],sha256:f['sha256']};});
 if(new Set(files.map(f=>f.path.toLowerCase())).size!==files.length)throw Error('duplicate_file');
 return {...v,files} as unknown as LocalTask;
}
export function parseGrant(value:unknown):LocalGrantInput{
 const v=exactObject(value,['schemaVersion','grantId','deviceId','workspaceId','root','expiresAt','maxTasks','maxFiles','maxTotalBytes']);
 if(v['schemaVersion']!==1||!validId(v['grantId'])||!validId(v['deviceId'])||!validId(v['workspaceId'])||typeof v['root']!=='string'||!v['root']||v['root'].length>4096||typeof v['expiresAt']!=='string'||!/^\d{4}-\d{2}-\d{2}T/.test(v['expiresAt'])||!Number.isFinite(Date.parse(v['expiresAt']))||!integer(v['maxTasks'],1,10)||!integer(v['maxFiles'],1,32)||!integer(v['maxTotalBytes'],1,8*1024*1024))throw Error('invalid_grant');
 return v as unknown as LocalGrantInput;
}
