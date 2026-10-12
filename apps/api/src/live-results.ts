/** B-044 localhost-only read API for sanitized verified-artifact receipts. Never serves media. */
import type {IncomingMessage,ServerResponse} from 'node:http';
import {lstatSync} from 'node:fs';
import {getVerifiedGoogleLiveResult} from '../../../packages/architect/src/live-result-store.ts';
import {isAllowedPreviewRequest} from './local-request.ts';
const id=/^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$/;
function json(res:ServerResponse,status:number,value:unknown):void{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value));}
export function createLiveResults(database?:string){
 function available():boolean{if(!database)return false;try{const stat=lstatSync(database);return stat.isFile()&&!stat.isSymbolicLink();}catch{return false;}}
 async function handle(req:IncomingMessage,res:ServerResponse,url:URL):Promise<boolean>{
  if(!url.pathname.startsWith('/api/live-results'))return false;
  if(!isAllowedPreviewRequest(req)){json(res,403,{error:'local_or_codespaces_same_origin_required'});return true;}
  const parts=url.pathname.split('/').filter(Boolean);if(parts.length!==3||parts[0]!=='api'||parts[1]!=='live-results'||!id.test(parts[2]!)){json(res,404,{error:'result_not_found'});return true;}
  if(req.method!=='GET'){res.setHeader('Allow','GET');json(res,405,{error:'read_only_endpoint'});return true;}
  if(!available()){json(res,503,{error:'result_store_unavailable'});return true;}
  const result=getVerifiedGoogleLiveResult(database!,parts[2]!);if(!result.ok){if(result.code==='result_not_found')json(res,404,{error:'result_not_found'});else if(result.code==='integrity_failure')json(res,409,{error:'result_integrity_failure'});else json(res,503,{error:'result_store_unavailable'});return true;}
  json(res,200,{schemaVersion:1,mode:'verified_live_artifact_metadata',receipt:result.receipt,mediaAvailable:false,productionReady:false,executionAllowed:false,publicationAllowed:false});return true;
 }
 return {handle};
}
