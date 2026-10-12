/** Explicit local browser-audio pilot launcher. No auto-install/browser launch/provider call. */
import {realpathSync} from 'node:fs';import {resolve} from 'node:path';import {pathToFileURL} from 'node:url';
import {loadAsrConfig,VoskProcess} from '../packages/companion/src/asr-process.ts';
import {startAudioHost} from '../packages/companion/src/audio-host.ts';
async function startMain(args:string[]):Promise<number>{
 if(Number(process.versions.node.split('.')[0])!==24){console.error('node_24_required');return 2;}
 if(args[0]!=='--local-audio-pilot'||!(args.length===1||(args.length===4&&args[1]==='--asr-config'&&args[3]==='--allow-local-asr'))){console.error('Usage: node scripts/companion_audio.ts --local-audio-pilot');return 2;}
 let asr:VoskProcess|undefined;if(args.length===4){asr=new VoskProcess(loadAsrConfig(resolve(args[2]!)));await asr.probe();}
 const host=await startAudioHost(asr?{asr}:{});console.log(JSON.stringify({name:'Ywon',mode:'local_audio_pilot',url:host.origin,productionReady:false,paidCalls:false,modelConnected:false,asrConnected:!!asr,audioUploaded:false,localAudioTransferRequiresConsent:true}));
 let closing=false;const stop=():void=>{if(closing)return;closing=true;void host.close().then(()=>{process.exitCode=0;}).catch(()=>{process.exitCode=2;});};process.once('SIGINT',stop);process.once('SIGTERM',stop);return 0;
}
export async function main(args:string[]):Promise<number>{try{return await startMain(args);}catch(error){const code=error instanceof Error&&/^asr_[a-z_]+$/.test(error.message)?error.message:'audio_start_failed';console.error(JSON.stringify({ok:false,code}));return 2;}}
if(process.argv[1]&&import.meta.url===pathToFileURL(realpathSync(resolve(process.argv[1]))).href)process.exitCode=await main(process.argv.slice(2));
