#!/usr/bin/env node
import {readFileSync} from 'node:fs';
import {verifyGoogleLiveResult} from '../packages/architect/src/live-result.ts';
function option(args:string[],name:string):string|undefined{const i=args.indexOf(name);return i>=0?args[i+1]:undefined;}
export function main(args:string[]):number{const input=option(args,'--input'),runDir=option(args,'--run-dir');if(args[0]!=='verify'||!input||!runDir)return 2;try{const value:unknown=JSON.parse(readFileSync(input,'utf8')),result=verifyGoogleLiveResult(value,runDir);process.stdout.write(JSON.stringify(result,null,2)+'\n');return result.ok?0:3;}catch{process.stdout.write(JSON.stringify({ok:false,code:'verification_input_unavailable',productionReady:false,executionAllowed:false},null,2)+'\n');return 2;}}
if(process.argv[1]&&import.meta.url===new URL(`file://${process.argv[1]}`).href)process.exitCode=main(process.argv.slice(2));
