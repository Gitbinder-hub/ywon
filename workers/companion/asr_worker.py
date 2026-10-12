"""B-056 fixed offline Vosk subprocess. PCM stdin/JSON stdout only; no downloads/files with audio."""
import argparse, hashlib, importlib.metadata, json, os, pathlib, stat, sys
MAX_BYTES=480000
MODEL_ID="vosk-model-small-ru-0.22"
def plain(path):
    p=pathlib.Path(path)
    if not p.is_absolute(): raise ValueError("asr_path_required")
    for part in [p,*p.parents]:
        st=part.lstat()
        if stat.S_ISLNK(st.st_mode): raise ValueError("asr_unsafe_path")
    return p

def inspect_model(root, manifest, expected):
    root=plain(root); manifest=plain(manifest)
    if not root.is_dir() or not manifest.is_file() or manifest.stat().st_size>32768: raise ValueError("asr_manifest_denied")
    raw=manifest.read_bytes()
    if hashlib.sha256(raw).hexdigest()!=expected: raise ValueError("asr_manifest_changed")
    data=json.loads(raw)
    if set(data)!={"schemaVersion","modelId","files"} or data["schemaVersion"]!=1 or data["modelId"]!=MODEL_ID or not isinstance(data["files"],dict) or not 1<=len(data["files"])<=64: raise ValueError("asr_manifest_denied")
    actual={}; total=0
    for path in root.rglob("*"):
        st=path.lstat()
        if stat.S_ISLNK(st.st_mode): raise ValueError("asr_unsafe_path")
        if path.is_dir(): continue
        if not stat.S_ISREG(st.st_mode) or st.st_nlink!=1: raise ValueError("asr_unsafe_path")
        total+=st.st_size
        if total>100*1024*1024 or len(actual)>=64: raise ValueError("asr_model_limit")
        actual[path.relative_to(root).as_posix()]=hashlib.sha256(path.read_bytes()).hexdigest()
    if actual!=data["files"]: raise ValueError("asr_model_changed")
    for needed in ["am/final.mdl","conf/model.conf","conf/mfcc.conf"]:
        if needed not in actual: raise ValueError("asr_model_incomplete")
    return root

def main():
    parser=argparse.ArgumentParser();parser.add_argument("--model-root",required=True);parser.add_argument("--manifest",required=True);parser.add_argument("--manifest-sha256",required=True);parser.add_argument("--probe",action="store_true");args=parser.parse_args()
    try:
        root=inspect_model(args.model_root,args.manifest,args.manifest_sha256)
        if importlib.metadata.version("vosk")!="0.3.45": raise ValueError("asr_engine_version")
        import vosk
        vosk.SetLogLevel(-1)
        info={"schemaVersion":1,"engine":"vosk","engineVersion":"0.3.45","modelId":MODEL_ID,"modelFingerprint":args.manifest_sha256,"sampleRate":16000}
        if args.probe:
            print(json.dumps({**info,"ready":True}));return 0
        pcm=sys.stdin.buffer.read(MAX_BYTES+1)
        if len(pcm)<8000 or len(pcm)>MAX_BYTES or len(pcm)%2: raise ValueError("asr_pcm_limit")
        model=vosk.Model(str(root));recognizer=vosk.KaldiRecognizer(model,16000);recognizer.SetWords(True)
        words=[];texts=[]
        for offset in range(0,len(pcm),8000):
            if recognizer.AcceptWaveform(pcm[offset:offset+8000]):
                result=json.loads(recognizer.Result());texts.append(result.get("text",""));words.extend(result.get("result",[]))
        result=json.loads(recognizer.FinalResult());texts.append(result.get("text",""));words.extend(result.get("result",[]))
        text=" ".join(t for t in texts if t).strip()
        if len(text)>4096 or len(words)>256: raise ValueError("asr_output_limit")
        print(json.dumps({**info,"text":text,"audioSha256":hashlib.sha256(pcm).hexdigest(),"durationMs":len(pcm)*1000//32000,"words":words,"executionAllowed":False},ensure_ascii=False));return 0
    except Exception as error:
        code=str(error) if isinstance(error,ValueError) and str(error).startswith("asr_") else "asr_worker_failed"
        print(json.dumps({"ok":False,"code":code}));return 2
if __name__=="__main__":sys.exit(main())
