#!/usr/bin/env node
import {readFileSync} from 'node:fs';
import {evaluatePrivateMediaDelivery,planPrivateMediaIngest} from '../packages/architect/src/media-boundary.ts';
function option(args:string[],name:string):string|undefined{const i=args.indexOf(name);return i>=0?args[i+1]:undefined;}
export function main(args:string[]):number{const input=option(args,'--input');if(!input||!['ingest','delivery'].includes(args[0]??''))return 2;try{const value:unknown=JSON.parse(readFileSync(input,'utf8')),result=args[0]==='ingest'?planPrivateMediaIngest(value):evaluatePrivateMediaDelivery(value);process.stdout.write(JSON.stringify(result,null,2)+'\n');return result.ok?0:3;}catch{process.stdout.write(JSON.stringify({ok:false,code:'media_boundary_input_unavailable',executionAllowed:false,uploadAuthorized:false,deliveryAllowed:false,publicationAllowed:false},null,2)+'\n');return 2;}}
if(process.argv[1]&&import.meta.url===new URL(`file://${process.argv[1]}`).href)process.exitCode=main(process.argv.slice(2));
