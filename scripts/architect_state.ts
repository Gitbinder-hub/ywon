/** Local B-005 CLI. Inputs are trusted local command files, not an HTTP interface. */
import { constants, openSync, fstatSync, readSync, closeSync } from 'node:fs';
import { runStoreCommand } from '../packages/architect/src/store.ts';
const args=process.argv.slice(2);
if(args.length!==4||args[0]!=='--db'||args[2]!=='--input'||!args[1]||!args[3]){
  console.error('Usage: node scripts/architect_state.ts --db LOCAL_DB --input COMMAND_JSON');process.exitCode=2;
}else{
  try{
    const fd=openSync(args[3],constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);let text='';
    try{
      if(!fstatSync(fd).isFile())throw new Error('Regular input file required');
      const b=Buffer.alloc(256*1024+1);let used=0;
      while(used<b.length){const n=readSync(fd,b,used,b.length-used,null);if(!n)break;used+=n;}
      if(used>256*1024)throw new Error('Input too large');text=b.subarray(0,used).toString('utf8');
    }finally{closeSync(fd);}
    const result=runStoreCommand(args[1],JSON.parse(text));process.stdout.write(JSON.stringify(result,null,2)+'\n');
    if(!result.ok)process.exitCode=3;
  }catch(error){console.error(error instanceof Error?error.message:'Invalid input');process.exitCode=2;}
}
