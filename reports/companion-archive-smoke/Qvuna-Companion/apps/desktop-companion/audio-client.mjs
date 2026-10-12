import {UtteranceCapture} from './utterance-capture.mjs';
import {LocalAudioDevice} from './audio-device.mjs';
const capture=new UtteranceCapture();let asrAbort=null,recordStarting=false,visibleDraftId=null,visibleDraft=null;
const audio=new LocalAudioDevice(),csrf=document.querySelector('meta[name="Ywon-csrf"]').content;
const $=id=>document.getElementById(id);let state=null,lastRevision=-1,commands=0,hardTimer=null,failed=false,disposed=false,sequence=0,messageText=null;
function cleanup(){capture.cancel();asrAbort?.abort();asrAbort=null;recordStarting=false;visibleDraftId=null;visibleDraft=null;if($('transcript')){$('transcript').value='';$('selected-files').value='';$('asr-consent').checked=false;$('intent').textContent='Речь сама по себе ничего не запускает.';}clearTimeout(hardTimer);hardTimer=null;audio.stop();$('level').value=0;}
function render(message){
 if(message!==undefined)messageText=message;
 const facts=audio.facts(),active=state?.snapshot.state==='active';
 document.querySelector('.status-panel').dataset.capturing=String(facts.capturing);
 $('status-title').textContent=facts.capturing?'Микрофон включён':facts.pending?'Ожидаю разрешение':'Микрофон выключен';
 $('detail').textContent=messageText??(facts.capturing?(state?.localAsr?.enabled?'Фразы передаются только локальному распознавателю.':'Микрофон локально. Распознавание выключено.'):state?.snapshot.state==='muted'?'Mute активен. Нужна кнопка для включения.':'Ничего не слушаю.');
 $('activate').disabled=failed||disposed||active||facts.pending||!$('consent').checked;
 $('mute').disabled=!active&&!facts.pending;$('close').disabled=!active&&!facts.pending;$('diagnostic').disabled=!facts.capturing;$('interrupt').disabled=!facts.capturing;
 if(!failed&&!disposed)$('connection').textContent=connectionLabel();
 renderSpeech();
 $('session-info').textContent=active?'Ограниченная сессия · автоотключение по паузе':'Сессия не открыта';
 }
function renderSpeech(){
 const lane=state?.localAsr,open=audio.facts().capturing,enabled=!!lane?.enabled;
 $('asr-consent').disabled=!lane?.available||!open;$('record').disabled=!open||!enabled||!$('asr-consent').checked||recordStarting||!!asrAbort;
 $('record').textContent=capture.recording?'Закончить фразу и распознать':'Начать фразу · до 15 секунд';
 $('asr-status').textContent=!lane?.available?'Офлайн-распознавание не подключено. Нужна отдельная локальная настройка.':asrAbort?'Распознаю локально…':capture.recording?'Запись в оперативную память, максимум 15 секунд.':enabled?'Vosk · русский · аудио только в локальный процесс':'Движок готов. Передача аудио выключена до согласия.';
 const draft=lane?.draft;if(draft&&draft.draftId!==visibleDraftId){visibleDraftId=draft.draftId;visibleDraft=draft;$('transcript').value=draft.text;$('intent').textContent=draft.text?'Проверь текст: голос и confidence не дают разрешения на действия.':'Речь не обнаружена. Ничего не передано Архитектору.';}
 if(!draft&&visibleDraftId){visibleDraftId=null;visibleDraft=null;$('transcript').value='';}
 $('transcript').disabled=!draft;$('selected-files').disabled=!draft;$('review').disabled=!draft||!$('transcript').value.trim();
}
function connectionLabel(){return state?.localAsr?.enabled?'Локальный процесс · фразы передаются только ему':'Локальный процесс · передача аудио выключена';}
function failure(){failed=true;cleanup();state=null;render('Связь с локальным процессом потеряна. Микрофон отключён. Обнови окно.');$('connection').textContent='Нет связи · аудио остановлено';}
async function request(command){
 const response=await fetch(command?'/api/audio/command':'/api/audio/state',{method:command?'POST':'GET',credentials:'same-origin',cache:'no-store',headers:{'X-Ywon-CSRF':csrf,...(command?{'Content-Type':'application/json'}:{})},...(command?{body:JSON.stringify({command,sequence:++sequence})}:{})});
 if(response.status===409)return request();if(!response.ok)throw Error('local_audio_denied');return response.json();
}
async function apply(next){
 if(next.revision<lastRevision||disposed)return;lastRevision=next.revision;state=next;
 if(next.snapshot.state!=='active'){cleanup();render();return;}
 clearTimeout(hardTimer);hardTimer=setTimeout(()=>{cleanup();void command('close');},Math.max(0,next.remainingMs));
 for(const effect of next.effects){
  if(effect.kind==='stop_capture'||effect.kind==='close_transport'){cleanup();}
  else if(effect.kind==='cancel_response'||effect.kind==='flush_playback'){audio.flush();}
  else if(effect.kind==='start_capture'){
   const capture=audio.start(effect.sessionId);render();
   try{await capture;}catch{if(disposed||state?.snapshot.sessionId!==effect.sessionId)return;cleanup();await command('capture-failed');render('Не удалось открыть микрофон. Проверь разрешение браузера и устройство.');return;}
   // Permission resolution may race mute/close/new session/navigation. Do not resurrect stale capture.
   if(disposed||state?.snapshot.sessionId!==effect.sessionId)return;
  }else if(effect.kind==='play_chunk'&&state.snapshot.responseId===effect.responseId){audio.playTone();}
 }
 render();
}
async function command(name){
 if(disposed)return;messageText=null;if(['mute','close','capture-failed'].includes(name))cleanup();commands++;
 try{await apply(await request(name));$('connection').textContent=connectionLabel();}catch{failure();}finally{commands--;}
}
$('consent').addEventListener('change',()=>{if(!$('consent').checked)void command('mute');render();});
for(const id of ['activate','mute','close','diagnostic','interrupt'])$(id).addEventListener('click',()=>void command(id));
function leave(){cleanup();void command('mute');}
document.addEventListener('visibilitychange',()=>{if(document.hidden)leave();});window.addEventListener('pagehide',()=>{leave();disposed=true;});window.addEventListener('blur',()=>{if(audio.facts().capturing||audio.facts().pending)leave();});
setInterval(()=>{if(audio.facts().capturing){if(audio.stream.getAudioTracks().some(t=>t.readyState==='ended')){cleanup();void command('capture-failed');}else $('level').value=audio.level();}render();},100);
setInterval(()=>{if(commands||disposed||failed)return;void request().then(apply).catch(failure);},1000);
void request().then(next=>{state=next;lastRevision=next.revision;render();$('connection').textContent=connectionLabel();}).catch(failure);
// Read-only diagnostics for local QA, no captured samples, grants, device IDs, cookies or CSRF.
Object.defineProperty(window,'YwonAudioFacts',{value:()=>audio.facts(),writable:false});

$('transcript').addEventListener('input',renderSpeech);
$('asr-consent').addEventListener('change',()=>{if(!$('asr-consent').checked){capture.cancel();asrAbort?.abort();}void command($('asr-consent').checked?'asr-enable':'asr-disable');});
async function finishPhrase(done){
 const clip=await done;if(!clip)return;const {pcm,clipId}=clip;
 if(!state?.localAsr?.enabled||!$('asr-consent').checked||!audio.facts().capturing){pcm.fill(0);return;}
 const sid=state.snapshot.sessionId,abort=new AbortController();asrAbort=abort;render();
 try{
  const res=await fetch('/api/audio/asr',{method:'POST',credentials:'same-origin',headers:{'X-Ywon-CSRF':csrf,'Content-Type':'application/octet-stream','X-Ywon-Sample-Rate':'16000','X-Ywon-Session':sid,'X-Ywon-Clip':clipId,'X-Ywon-Sequence':String(++sequence)},body:pcm,signal:abort.signal});
  const next=await res.json();if(!res.ok){if(!abort.signal.aborted)$('intent').textContent='Распознавание не завершено: '+next.code;return;}if(!abort.signal.aborted&&state?.snapshot.sessionId===sid)await apply(next);
 }catch{if(!abort.signal.aborted)failure();}finally{pcm.fill(0);if(asrAbort===abort)asrAbort=null;render();}
}
$('record').addEventListener('click',async()=>{
 if(capture.recording){void capture.finish();return;}recordStarting=true;render();
 try{
  await command('utterance-start');if(!state?.localAsr?.enabled||!audio.facts().capturing||!$('asr-consent').checked)return;
  if(await capture.start(audio.context,audio.source)){const done=capture.done;void finishPhrase(done);}
 }catch{capture.cancel();$('intent').textContent='Не удалось подготовить локальный PCM-захват. Облачного fallback нет.';}finally{recordStarting=false;render();}
});
$('review').addEventListener('click',async()=>{
 const draft=visibleDraft;if(!draft)return;commands++;$('review').disabled=true;
 try{
  const res=await fetch('/api/audio/review',{method:'POST',credentials:'same-origin',headers:{'X-Ywon-CSRF':csrf,'Content-Type':'application/json','X-Ywon-Sequence':String(++sequence)},body:JSON.stringify({sessionId:draft.sessionId,draftId:draft.draftId,fingerprint:draft.fingerprint,text:$('transcript').value,selectedFiles:$('selected-files').value.split('\n').map(x=>x.trim()).filter(Boolean)})});
  const next=await res.json();if(!res.ok){$('intent').textContent='Черновик устарел или параметры не подходят. Запиши фразу заново.';return;}await apply(next);
  if(next.intent.status==='proposal')$('intent').textContent='Предложение подготовлено: проверить '+next.intent.files.length+' файлов. Выполнение и доступ к папке ещё не разрешены.';
  else if(next.intent.status==='needs_context')$('intent').textContent='Для предложения нужны явно выбранные относительные пути файлов.';
  else $('intent').textContent='Для этого запроса нужен языковой модуль. Он пока не подключён; платных вызовов нет.';
 }catch{failure();}finally{commands--;render();}
});

window.addEventListener('keydown',event=>{if(event.key==='Escape'&&(audio.facts().capturing||audio.facts().pending||capture.recording)){event.preventDefault();void command('mute');}});
