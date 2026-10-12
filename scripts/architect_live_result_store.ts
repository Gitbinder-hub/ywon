#!/usr/bin/env node
import {readFileSync} from 'node:fs';
import {getVerifiedGoogleLiveResult,importVerifiedGoogleLiveResult} from '../packages/architect/src/live-result-store.ts';
function option(args:string[],name:string):string|undefined{const i=args.indexOf(name);return i>=0?args[i+1]:undefined;}
export function main(args:string[]):number{const mode=args[0],database=option(args,'--db');if(!database)return 2;let result;if(mode==='import'){const input=option(args,'--input'),runDir=option(args,'--run-dir'),commandId=option(args,'--command-id');if(!input||!runDir||!commandId)return 2;try{result=importVerifiedGoogleLiveResult(database,JSON.parse(readFileSync(input,'utf8')),runDir,commandId);}catch{result={ok:false,code:'verification_input_unavailable'};}}else if(mode==='get'){const runId=option(args,'--run-id');if(!runId)return 2;result=getVerifiedGoogleLiveResult(database,runId);}else return 2;process.stdout.write(JSON.stringify(result,null,2)+'\n');return result.ok?0:3;}
if(process.argv[1]&&import.meta.url===new URL(`file://${process.argv[1]}`).href)process.exitCode=main(process.argv.slice(2));
