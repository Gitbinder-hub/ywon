#!/usr/bin/env node
/** Local synthetic-material demonstration; explicitly creates its own folders, no private files. */
import {mkdirSync,writeFileSync,realpathSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {randomUUID} from 'node:crypto';
import {LocalRunner} from '../packages/companion/src/runner.ts';
import {plainPath} from '../packages/companion/src/files.ts';
export async function main(args:string[]):Promise<number>{
 let runner:LocalRunner|undefined;
 try{
  if(args.length!==3||args[0]!=='--data-dir'||!args[1]||args[2]!=='--confirm-demo')throw Error('usage: --data-dir DIRECTORY --confirm-demo');
  if(Number(process.versions.node.split('.')[0])!==24)throw Error('Node 24 required');
  const base=resolve(args[1]);mkdirSync(base,{recursive:true,mode:0o700});plainPath(base,true);
  const run=join(base,'demo-'+randomUUID());mkdirSync(run,{mode:0o700});const materials=join(run,'materials');mkdirSync(materials);
  writeFileSync(join(materials,'brief.md'),'# Demo brief\nCreate a structured material inventory.\n',{flag:'wx'});
  writeFileSync(join(materials,'notes.txt'),'These are synthetic demo materials, not personal files.\n',{flag:'wx'});
  runner=new LocalRunner({dataDir:join(run,'state'),deviceId:'local-demo-device',workspaceId:'local-demo-workspace'});
  const grant={schemaVersion:1,grantId:'demo-grant',deviceId:'local-demo-device',workspaceId:'local-demo-workspace',root:materials,expiresAt:new Date(Date.now()+60_000).toISOString(),maxTasks:1,maxFiles:2,maxTotalBytes:65536};runner.approve(grant,true);
  const task=runner.plan('demo-grant','demo-task','demo-operation',['brief.md','notes.txt']);runner.enqueue(task);const outcome=await runner.run(task.taskId);if(outcome.state!=='succeeded'||!outcome.result)throw Error('demo_failed');
  const resultPath=join(run,'result.json');writeFileSync(resultPath,JSON.stringify(outcome.result,null,2)+'\n',{flag:'wx'});runner.revoke('demo-grant');
  process.stdout.write(JSON.stringify({ok:true,mode:'offline_local_companion_demo',productionReady:false,paidCalls:false,networkCalls:false,filesChecked:outcome.checkpoint,resultPath,grantRevokedAfterDemo:true,cloudPairingImplemented:false},null,2)+'\n');return 0;
 }catch(error){process.stdout.write(JSON.stringify({ok:false,message:error instanceof Error?error.message:'demo failed',productionReady:false,paidCalls:false})+'\n');return 2;}finally{runner?.close();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(realpathSync(resolve(process.argv[1]))).href)process.exitCode=await main(process.argv.slice(2));
