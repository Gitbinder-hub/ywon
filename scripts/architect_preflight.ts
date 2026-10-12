/** B-004 offline CLI: strict input, exclusive output creation, no side effects beyond report file. */
import { constants, openSync, fstatSync, readSync, closeSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { planProduction, planRecovery } from '../packages/architect/src/index.ts';
export function main(args: string[]): number {
  if(args.length!==3 && args.length!==5){console.error('Usage: node scripts/architect_preflight.ts plan|recover --input FILE [--output NEW_FILE]');return 2;}
  const [mode,flag,input,outputFlag,output]=args;
  if(!['plan','recover'].includes(mode??'')||flag!=='--input'||!input||(args.length===5&&(outputFlag!=='--output'||!output))){console.error('Invalid arguments');return 2;}
  try {
    const limit=256*1024;
    const fd=openSync(input,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);
    let source='';
    try {
      const stat=fstatSync(fd);
      if(!stat.isFile()||stat.size>limit)throw new Error('Input must be a regular file <=256 KiB');
      const buffer=Buffer.alloc(limit+1);let used=0;
      while(used<buffer.length){const n=readSync(fd,buffer,used,buffer.length-used,null);if(n===0)break;used+=n;}
      if(used>limit)throw new Error('Input exceeds 256 KiB');
      source=buffer.subarray(0,used).toString('utf8');
    }finally{closeSync(fd);}
    const value:unknown=JSON.parse(source);
    const result=mode==='plan'?planProduction(value):planRecovery(value);
    const text=JSON.stringify(result,null,2)+'\n';
    if(output)writeFileSync(output,text,{encoding:'utf8',flag:'wx'});else process.stdout.write(text);
    if(!result.ok)return 2;
    return ('status' in result.report?result.report.status==='blocked':result.report.state!=='repair_proposed')?3:0;
  }catch(error){console.error(error instanceof Error?error.message:'Unable to prepare report');return 2;}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))process.exitCode=main(process.argv.slice(2));
