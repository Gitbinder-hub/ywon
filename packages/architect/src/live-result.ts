/** B-042 keyless verification of a completed Google live-spike artifact. */
import {createHash} from 'node:crypto';
import {lstatSync,readFileSync} from 'node:fs';
import {basename,join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {GOOGLE_LIVE_MODELS,planGoogleLiveSpike,googleLiveRequestHash} from './google-live.ts';

type JsonObject=Record<string,unknown>;
export type LiveResultVerification=
 | {ok:true;schemaVersion:1;mode:'google_live_result_verification';runId:string;status:'verified_local_artifact';artifactName:string;sha256:string;bytes:number;durationMs:number;width:number;height:number;videoCodec:'h264';audioCodec:'aac';paidCallEvidenceCount:number;productionReady:false;executionAllowed:false;qualityReviewRequired:true;limitations:string[]}
 | {ok:false;code:string;productionReady:false;executionAllowed:false};

function sha(data:Buffer|string):string{return createHash('sha256').update(data).digest('hex');}
function object(value:unknown):JsonObject|null{return typeof value==='object'&&value!==null&&!Array.isArray(value)?value as JsonObject:null;}
function safeFile(path:string,maxBytes:number):Buffer|null{try{const stat=lstatSync(path);if(!stat.isFile()||stat.isSymbolicLink()||stat.size<1||stat.size>maxBytes)return null;return readFileSync(path);}catch{return null;}}
function fail(code:string):LiveResultVerification{return {ok:false,code,productionReady:false,executionAllowed:false};}

export function verifyGoogleLiveResult(input:unknown,runDirectory:string,ffprobePath='ffprobe'):LiveResultVerification{
 const planned=planGoogleLiveSpike(input),expected=object(input);if(!planned.ok||!expected||expected['schemaVersion']!==1||typeof expected['runId']!=='string'||!Number.isSafeInteger(expected['sceneCount'])||!Number.isSafeInteger(expected['durationSec'])||(expected['aspectRatio']!=='16:9'&&expected['aspectRatio']!=='9:16'))return fail('invalid_google_live_input');
 const runId=expected['runId'],sceneCount=expected['sceneCount'] as number,durationSec=expected['durationSec'] as number,dir=resolve(runDirectory);
 let manifest:JsonObject;const manifestData=safeFile(join(dir,'manifest.json'),1024*1024);if(!manifestData)return fail('invalid_or_missing_manifest');try{const parsed=object(JSON.parse(manifestData.toString('utf8')));if(!parsed)return fail('invalid_or_missing_manifest');manifest=parsed;}catch{return fail('invalid_or_missing_manifest');}
 if(manifest['schemaVersion']!==1||manifest['mode']!=='google_live_spike_manifest'||manifest['runId']!==runId||manifest['status']!=='completed'||manifest['paidCalls']!==true)return fail('manifest_not_completed');
 if(manifest['inputHash']===undefined)return fail('request_binding_missing');
 if(manifest['inputHash']!==googleLiveRequestHash(input))return fail('request_binding_mismatch');
 if(JSON.stringify(manifest['models'])!==JSON.stringify(GOOGLE_LIVE_MODELS))return fail('model_route_mismatch');
 const calls=manifest['completedCalls'];if(!Array.isArray(calls)||calls.length!==sceneCount+2)return fail('paid_call_evidence_incomplete');
 const records=calls.map(object);if(records.some(x=>!x))return fail('paid_call_evidence_invalid');const callRecords=records as JsonObject[];
 const textCalls=callRecords.filter(x=>x['kind']==='text'),imageCalls=callRecords.filter(x=>x['kind']==='image'),ttsCalls=callRecords.filter(x=>x['kind']==='tts');if(textCalls.length!==1||imageCalls.length!==sceneCount||ttsCalls.length!==1)return fail('paid_call_evidence_incomplete');
 const scriptData=safeFile(join(dir,'script.json'),1024*1024);if(!scriptData)return fail('unsafe_or_missing_local_asset');let script:unknown;try{script=JSON.parse(scriptData.toString('utf8'));}catch{return fail('script_invalid');}if(textCalls[0]!['sha256']!==sha(JSON.stringify(script)))return fail('script_hash_mismatch');
 for(let i=1;i<=sceneCount;i++){const image=safeFile(join(dir,`scene-${String(i).padStart(2,'0')}.png`),20*1024*1024),record=imageCalls.find(x=>x['index']===i);if(!image||!record)return fail('unsafe_or_missing_local_asset');if(record['sha256']!==sha(image))return fail('image_hash_mismatch');}
 const narration=safeFile(join(dir,'narration.wav'),30*1024*1024);if(!narration)return fail('unsafe_or_missing_local_asset');if(ttsCalls[0]!['sha256']!==sha(narration))return fail('audio_hash_mismatch');
 const mp4Record=object(manifest['mp4']);if(!mp4Record||typeof mp4Record['path']!=='string'||!['result.mp4','result-recovered.mp4'].includes(mp4Record['path'])||basename(mp4Record['path'])!==mp4Record['path'])return fail('invalid_mp4_record');
 const mp4=safeFile(join(dir,mp4Record['path']),200*1024*1024);if(!mp4)return fail('unsafe_or_missing_local_artifact');if(mp4Record['sha256']!==sha(mp4)||mp4Record['bytes']!==mp4.length)return fail('mp4_hash_mismatch');
 const probe=spawnSync(ffprobePath,['-v','error','-show_entries','format=format_name,duration,size:stream=codec_type,codec_name,width,height,duration','-of','json',join(dir,mp4Record['path'])],{encoding:'utf8',timeout:15000,maxBuffer:1024*1024});if(probe.error||probe.status!==0)return fail('ffprobe_failed');let metadata:JsonObject;try{const parsed=object(JSON.parse(probe.stdout));if(!parsed)return fail('ffprobe_invalid');metadata=parsed;}catch{return fail('ffprobe_invalid');}
 const format=object(metadata['format']),streams=Array.isArray(metadata['streams'])?metadata['streams'].map(object).filter((x):x is JsonObject=>x!==null):[];const video=streams.find(x=>x['codec_type']==='video'),audio=streams.find(x=>x['codec_type']==='audio');const duration=Number(format?.['duration']),size=Number(format?.['size']);if(!format||typeof format['format_name']!=='string'||!format['format_name'].includes('mp4')||!Number.isFinite(duration)||duration<=0||duration>durationSec+2||size!==mp4.length||video?.['codec_name']!=='h264'||audio?.['codec_name']!=='aac')return fail('media_contract_mismatch');
 // B-052 strict predeclared +/-2s spike contract; no silent adaptive downgrade.
 if(duration<durationSec-2)return fail('media_duration_too_short');
 const narrationProbe=spawnSync(ffprobePath,['-v','error','-show_entries','format=duration','-of','json',join(dir,'narration.wav')],{encoding:'utf8',timeout:15000,maxBuffer:1024*1024});
 if(narrationProbe.error||narrationProbe.status!==0)return fail('narration_probe_failed');
 let sourceDuration:number;try{const source=object(JSON.parse(narrationProbe.stdout));sourceDuration=Number(object(source?.['format'])?.['duration']);}catch{return fail('narration_probe_invalid');}
 const deliveredAudioDuration=Number(audio['duration']);
 if(!Number.isFinite(sourceDuration)||sourceDuration<=0||!Number.isFinite(deliveredAudioDuration)||deliveredAudioDuration<=0)return fail('narration_duration_unknown');
 // Allow bounded AAC/container timing tolerance, not several seconds of dropped narration.
 if(deliveredAudioDuration+0.25<sourceDuration||duration+0.25<sourceDuration)return fail('narration_truncated');
 const width=Number(video['width']),height=Number(video['height']),expectedSize=expected['aspectRatio']==='16:9'?[1280,720]:[720,1280];if(width!==expectedSize[0]||height!==expectedSize[1])return fail('media_dimensions_mismatch');
 return {ok:true,schemaVersion:1,mode:'google_live_result_verification',runId,status:'verified_local_artifact',artifactName:mp4Record['path'],sha256:sha(mp4),bytes:mp4.length,durationMs:Math.round(duration*1000),width,height,videoCodec:'h264',audioCodec:'aac',paidCallEvidenceCount:calls.length,productionReady:false,executionAllowed:false,qualityReviewRequired:true,limitations:['Strict requested duration +/-2s and technical source-audio preservation checked; speech meaning/quality still needs review.','Local hash and media-contract verification only; provider invoice is not verified.','A verified local artifact is not production authentication, durable storage or publication approval.','Human content, rights and quality review remain required.']};
}
