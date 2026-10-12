/** B-060 persistent Vosk streaming adapter. One model load, live partial/final via 4-byte LE framing. */
import { spawn } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import type { ChildProcessWithoutNullStreams } from 'node:child_process';
import { exactObject, integer } from '../../companion-protocol/src/index.ts';
export interface AsrStreamConfig { schemaVersion: 1; pythonExecutable: string; modelRoot: string; manifestPath: string; manifestSha256: string; timeoutMs: number; }
export function loadAsrStreamConfig(path: string): AsrStreamConfig {
  if (!isAbsolute(path) || statSync(path).size > 16384) throw Error('asr_config_denied');
  const v = exactObject(JSON.parse(readFileSync(path,'utf8')), ['schemaVersion','pythonExecutable','modelRoot','manifestPath','manifestSha256','timeoutMs']);
  if (v['schemaVersion'] !== 1 || !integer(v['timeoutMs'], 1000, 60_000) || typeof v['manifestSha256'] !== 'string' || !/^[a-f0-9]{64}$/.test(v['manifestSha256'] as string)) throw Error('asr_config_denied');
  for (const k of ['pythonExecutable','modelRoot','manifestPath']) if (typeof v[k] !== 'string' || !isAbsolute(v[k] as string) || (v[k] as string).length > 4096) throw Error('asr_config_denied');
  return v as unknown as AsrStreamConfig;
}
export type StreamEvent = { type: 'partial'; text: string; schemaVersion: 1; engine: 'vosk'; engineVersion: '0.3.45'; modelId: string; modelFingerprint: string; sampleRate: 16000; executionAllowed: false }
| { type: 'final'; text: string; words: Array<{word:string;start:number;end:number;conf:number}>; schemaVersion: 1; engine: 'vosk'; engineVersion: '0.3.45'; modelId: string; modelFingerprint: string; sampleRate: 16000; executionAllowed: false };
export class VoskStreamProcess {
  private config: AsrStreamConfig;
  private child: import('node:child_process').ChildProcessWithoutNullStreams | null = null;
  private buf = Buffer.alloc(0);
  private waiters: Array<(e: StreamEvent|null)=>void> = [];
  private queue: StreamEvent[] = [];
  private error: string | null = null;
  private closed = false;
  constructor(config: AsrStreamConfig){ this.config = {...config}; }
  async start(): Promise<void> {
    if (this.child) return;
    const c = this.config;
    const args = ['-I','-X','utf8', fileURLToPath(new URL('../../../workers/companion/asr_stream_worker.py', import.meta.url)), '--model-root', c.modelRoot, '--manifest', c.manifestPath, '--manifest-sha256', c.manifestSha256];
    const env: Record<string,string> = { OPENBLAS_NUM_THREADS:'1', OMP_NUM_THREADS:'1', MKL_NUM_THREADS:'1' };
    for (const k of ['PATH','SystemRoot','WINDIR','TEMP','TMP','HOME']) if (process.env[k]) env[k]=process.env[k]!;
    const { spawn } = await import('node:child_process');
    this.child = spawn(c.pythonExecutable, args, { shell:false, windowsHide:true, env, stdio:['pipe','pipe','pipe'] }) as any;
    this.child!.stderr.on('data', ()=>{});
    this.child!.stdout.on('data', (chunk: Buffer)=>{ this.onData(chunk); });
    this.child!.on('close', ()=>{ this.closed = true; this.flushError('asr_process_failed'); });
    this.child!.on('error', ()=>{ this.error='asr_process_failed'; this.flushError('asr_process_failed'); });
    await new Promise(r=> setTimeout(r, 300));
    if (this.error) throw Error(this.error);
  }
  async probe(): Promise<void> {
    await this.start();
    const c = this.config;
    const args = ['-I','-X','utf8', fileURLToPath(new URL('../../../workers/companion/asr_stream_worker.py', import.meta.url)), '--model-root', c.modelRoot, '--manifest', c.manifestPath, '--manifest-sha256', c.manifestSha256, '--probe'];
    const env: Record<string,string> = { OPENBLAS_NUM_THREADS:'1', OMP_NUM_THREADS:'1', MKL_NUM_THREADS:'1' };
    for (const k of ['PATH','SystemRoot','WINDIR','TEMP','TMP','HOME']) if (process.env[k]) env[k]=process.env[k]!;
    const { spawn } = await import('node:child_process');
    const child = spawn(c.pythonExecutable, args, { shell:false, windowsHide:true, env, stdio:['pipe','pipe','pipe'] }) as any;
    let out = Buffer.alloc(0); let done=false;
    await new Promise<void>((resolve, reject)=>{
      const timer = setTimeout(()=>{ child.kill(); reject(Error('asr_timeout')); }, c.timeoutMs);
      child.stdout.on('data', (ch: Buffer)=>{ if (out.length+ch.length>65536){ child.kill(); reject(Error('asr_output_limit')); } else out=Buffer.concat([out, ch]); });
      child.on('error', ()=>{ if(done) return; done=true; clearTimeout(timer); reject(Error('asr_process_failed')); });
      child.on('close', (code: number)=>{ if(done) return; done=true; clearTimeout(timer); if(code!==0) reject(Error('asr_worker_denied')); else try{ const v:unknown=JSON.parse(out.toString('utf8')); const o=exactObject(v, ['schemaVersion','engine','engineVersion','modelId','modelFingerprint','sampleRate','ready']); if(o['ready']!==true) throw Error('asr_probe_denied'); resolve(); }catch{ reject(Error('asr_probe_denied')); } });
      child.stdin.end();
    });
  }
  private onData(chunk: Buffer){
    this.buf = Buffer.concat([this.buf, chunk]);
    let idx: number;
    while ((idx = this.buf.indexOf(10)) >= 0){
      const line = this.buf.subarray(0, idx).toString('utf8').trim();
      this.buf = this.buf.subarray(idx+1);
      if (!line) continue;
      try{
        const v: unknown = JSON.parse(line);
        if (typeof v !== 'object' || v===null) continue;
        const obj = v as Record<string,unknown>;
        if (obj['ok']===false) { this.error = String(obj['code']||'asr_worker_failed'); this.flushError(this.error); continue; }
        if (obj['type']==='partial' || obj['type']==='final'){
          const ev = obj as unknown as StreamEvent;
          if (this.waiters.length){ const w=this.waiters.shift()!; w(ev); } else { this.queue.push(ev); }
        }
      }catch{}
    }
  }
  private flushError(code: string){
    while (this.waiters.length){ const w=this.waiters.shift()!; try{ w(null); }catch{} }
    this.error = code;
  }
  async sendChunk(pcm: Uint8Array): Promise<StreamEvent> {
    if (!this.child || this.closed) throw Error('asr_process_failed');
    if (pcm.byteLength===0 || pcm.byteLength>32000 || pcm.byteLength%2===1) throw Error('asr_pcm_limit');
    if (this.queue.length) return this.queue.shift()!;
    const hdr = Buffer.allocUnsafe(4); hdr.writeUInt32LE(pcm.byteLength, 0);
    return await new Promise<StreamEvent>((resolve, reject)=>{
      const onEvent = (ev: StreamEvent|null)=>{
        if (!ev) { reject(Error(this.error||'asr_worker_failed')); return; }
        resolve(ev);
      };
      this.waiters.push(onEvent as any);
      try{
        this.child!.stdin.write(hdr);
        this.child!.stdin.write(Buffer.from(pcm.buffer, pcm.byteOffset, pcm.byteLength));
      }catch{ reject(Error('asr_process_failed')); }
      setTimeout(()=>{ const idx=this.waiters.indexOf(onEvent as any); if(idx>=0){ this.waiters.splice(idx,1); reject(Error('asr_timeout')); } }, this.config.timeoutMs);
    });
  }
  async finalize(): Promise<StreamEvent> {
    if (!this.child || this.closed) throw Error('asr_process_failed');
    const hdr = Buffer.allocUnsafe(4); hdr.writeUInt32LE(0,0);
    return await new Promise<StreamEvent>((resolve, reject)=>{
      const onEvent = (ev: StreamEvent|null)=>{
        if (!ev) { reject(Error(this.error||'asr_worker_failed')); return; }
        if (ev.type!=='final') { reject(Error('asr_result_denied')); return; }
        resolve(ev);
      };
      this.waiters.push(onEvent as any);
      try{ this.child!.stdin.write(hdr); }catch{ reject(Error('asr_process_failed')); }
      setTimeout(()=>{ const idx=this.waiters.indexOf(onEvent as any); if(idx>=0){ this.waiters.splice(idx,1); reject(Error('asr_timeout')); } }, this.config.timeoutMs);
    });
  }
  async close(): Promise<void>{
    if (!this.child) return;
    try{
      const hdr = Buffer.allocUnsafe(4); hdr.writeUInt32LE(0xFFFFFFFF,0);
      this.child.stdin.write(hdr);
      this.child.stdin.end();
    }catch{}
    await new Promise<void>(r=>{ if(!this.child) return r(); this.child!.on('close', ()=>r()); setTimeout(r, 600); });
    this.child = null;
  }
  async recognize(pcm: Uint8Array, signal: AbortSignal): Promise<{text:string;words:any[];modelFingerprint:string;engine:string;engineVersion:string;modelId:string;sampleRate:number;audioSha256:string;durationMs:number;schemaVersion:1;executionAllowed:false}>{
    if (signal.aborted) throw Error('asr_cancelled');
    if (pcm.byteLength<8000 || pcm.byteLength>480000 || pcm.byteLength%2) throw Error('asr_pcm_limit');
    const hash = createHash('sha256').update(pcm).digest('hex');
    const durationMs = Math.floor(pcm.byteLength*1000/32000);
    await this.start();
    let off=0;
    while (off < pcm.byteLength){
      const remaining = pcm.byteLength - off;
      const chunkLen = Math.min(32000, remaining);
      const even = chunkLen %2 ? chunkLen-1 : chunkLen;
      if (even<=0) break;
      const chunk = pcm.subarray(off, off+even);
      const ev = await this.sendChunk(chunk);
      if (signal.aborted) throw Error('asr_cancelled');
      off += even;
      if (ev.type==='final' && off >= pcm.byteLength){
        if (ev.text.length>4096 || ev.words.length>256) throw Error('asr_result_denied');
        return {schemaVersion:1, engine:'vosk', engineVersion:'0.3.45', modelId:'vosk-model-small-ru-0.22', modelFingerprint:this.config.manifestSha256, sampleRate:16000, text:ev.text, words:ev.words, audioSha256:hash, durationMs, executionAllowed:false};
      }
    }
    const fin = await this.finalize();
    if (fin.text.length>4096) throw Error('asr_result_denied');
    const words = (fin as any).words || [];
    return {schemaVersion:1, engine:'vosk', engineVersion:'0.3.45', modelId:'vosk-model-small-ru-0.22', modelFingerprint:this.config.manifestSha256, sampleRate:16000, text:fin.text, words, audioSha256:hash, durationMs, executionAllowed:false};
  }
}
