#!/usr/bin/env node
/** B-051 local owner CLI; no browser/API key/cloud/purchase/install side effects. */
import {readFileSync,lstatSync,realpathSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {LocalRunner} from '../packages/companion/src/runner.ts';
function readJson(path:string):unknown{const stat=lstatSync(path);if(!stat.isFile()||stat.isSymbolicLink()||stat.size>64*1024)throw Error('invalid_input_file');return JSON.parse(readFileSync(path,'utf8').replace(/^\uFEFF/,''));}
export async function main(args:string[]):Promise<number>{
 let runner:LocalRunner|undefined;
 try{
  const command=args[0];const allowed=new Set(['--data-dir','--device-id','--workspace-id','--input','--grant-id','--task-id','--operation-id','--files','--confirm-local-folder']);const options=new Map<string,string>();
  for(let i=1;i<args.length;i++){const key=args[i]!;if(!allowed.has(key)||options.has(key))throw Error('invalid_arguments');if(key==='--confirm-local-folder')options.set(key,'true');else{const value=args[++i];if(!value||value.startsWith('--'))throw Error('invalid_arguments');options.set(key,value);}}
  const required=(key:string):string=>{const value=options.get(key);if(!value)throw Error('missing_argument');return value;};
  if(!['info','approve','plan','enqueue','run','status','stop','revoke','events'].includes(command??''))throw Error('invalid_command');
  const specific:Record<string,string[]>={info:[],approve:['--input','--confirm-local-folder'],plan:['--grant-id','--task-id','--operation-id','--files'],enqueue:['--input'],run:['--task-id'],status:['--task-id'],stop:['--task-id'],revoke:['--grant-id'],events:[]};
  const common=['--data-dir','--device-id','--workspace-id'];for(const key of options.keys())if(!common.includes(key)&&!specific[command!]!.includes(key))throw Error('invalid_arguments');
  runner=new LocalRunner({dataDir:required('--data-dir'),deviceId:required('--device-id'),workspaceId:required('--workspace-id')});let value:unknown;
  switch(command){
   case 'info':value=runner.info();break;
   case 'approve':value=runner.approve(readJson(required('--input')),options.get('--confirm-local-folder')==='true');break;
   case 'plan':value=runner.plan(required('--grant-id'),required('--task-id'),required('--operation-id'),readJson(required('--files')));break;
   case 'enqueue':value=runner.enqueue(readJson(required('--input')));break;
   case 'run':value=await runner.run(required('--task-id'));break;
   case 'status':value=runner.status(required('--task-id'));break;
   case 'stop':value=runner.stop(required('--task-id'));break;
   case 'revoke':runner.revoke(required('--grant-id'));value={grantId:required('--grant-id'),revoked:true};break;
   case 'events':value=runner.events();break;
  }
  process.stdout.write(JSON.stringify({ok:true,mode:'offline_local_companion',productionReady:false,paidCalls:false,networkCalls:false,value},null,2)+'\n');
  if(command==='run'&&typeof value==='object'&&value!==null&&'state'in value&&(value as {state:string}).state!=='succeeded')return 3;return 0;
 }catch(error){const message=error instanceof Error?error.message:'local_runner_failed';const code=/^[a-z][a-z0-9_]{1,63}$/.test(message)?message:'local_io_failure';process.stdout.write(JSON.stringify({ok:false,code,productionReady:false,paidCalls:false})+'\n');return 2;}finally{runner?.close();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(realpathSync(resolve(process.argv[1]))).href)process.exitCode=await main(process.argv.slice(2));
