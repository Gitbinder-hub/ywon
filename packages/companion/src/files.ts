/** B-051 bounded read-only inventory. Trusted local workspace, not OS sandbox. */
import {constants,lstatSync,realpathSync,openSync,fstatSync,readSync,closeSync} from 'node:fs';
import {resolve,relative,isAbsolute,parse,join,sep} from 'node:path';
import {createHash} from 'node:crypto';
import {TextDecoder} from 'node:util';
import {validRelativeFile} from '../../companion-protocol/src/index.ts';
export interface FileObservation {path:string;sha256:string;bytes:number;characters:number;lines:number;}
export function samePath(a:string,b:string):boolean{return process.platform==='win32'?a.toLowerCase()===b.toLowerCase():a===b;}
export function inside(root:string,path:string):boolean{const r=relative(root,path);return !r.startsWith('..'+sep)&&r!=='..'&&!isAbsolute(r);}
export function plainPath(path:string,directory:boolean):string{
 const absolute=resolve(path);if(process.platform==='win32'&&absolute.startsWith('\\\\'))throw Error('network_or_device_path_denied');let current=parse(absolute).root;
 for(const part of absolute.slice(current.length).split(sep).filter(Boolean)){
  current=join(current,part);const s=lstatSync(current);if(s.isSymbolicLink())throw Error('linked_path_denied');
 }
 const stat=lstatSync(absolute);if(directory?!stat.isDirectory():!stat.isFile())throw Error('wrong_path_kind');
 const real=realpathSync(absolute);if(!samePath(real,absolute))throw Error('redirected_path_denied');return real;
}
export function rootIdentity(root:string):string{const s=lstatSync(plainPath(root,true));return `${s.dev}:${s.ino}`;}
export function observeFile(root:string,path:string):FileObservation{
 if(!validRelativeFile(path))throw Error('invalid_file_ref');
 const file=resolve(root,...path.split('/'));if(!inside(root,file))throw Error('outside_root');
 plainPath(root,true);plainPath(file,false);
 const before=lstatSync(file);if(before.nlink>1)throw Error('hardlink_denied');if(before.size>1024*1024)throw Error('file_too_large');
 const fd=openSync(file,constants.O_RDONLY|(constants.O_NOFOLLOW??0)|(constants.O_NONBLOCK??0));
 try{
  const s=fstatSync(fd);if(!s.isFile()||s.nlink>1||s.dev!==before.dev||s.ino!==before.ino)throw Error('file_changed');
  const buffer=Buffer.alloc(1024*1024+1);let n=0;
  while(n<buffer.length){const count=readSync(fd,buffer,n,buffer.length-n,null);if(!count)break;n+=count;}
  if(n>1024*1024)throw Error('file_too_large');
  const after=fstatSync(fd),pathAfter=lstatSync(file);
  if(after.size!==n||after.size!==s.size||after.mtimeMs!==s.mtimeMs||after.ctimeMs!==s.ctimeMs||pathAfter.isSymbolicLink()||pathAfter.dev!==s.dev||pathAfter.ino!==s.ino)throw Error('file_changed');
  plainPath(file,false);const bytes=buffer.subarray(0,n);let text:string;
  try{text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{throw Error('invalid_utf8');}
  return {path,sha256:createHash('sha256').update(bytes).digest('hex'),bytes:n,characters:[...text].length,lines:text?text.split(/\r\n|\r|\n/).length-(/[\r\n]$/.test(text)?1:0):0};
 }finally{closeSync(fd);}
}
