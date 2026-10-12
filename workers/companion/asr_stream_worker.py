"""B-060 persistent Vosk streaming worker. One model load, many chunks until EOF. No downloads."""
import argparse, hashlib, importlib.metadata, json, os, pathlib, stat, struct, sys
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
    parser=argparse.ArgumentParser()
    parser.add_argument("--model-root",required=True)
    parser.add_argument("--manifest",required=True)
    parser.add_argument("--manifest-sha256",required=True)
    parser.add_argument("--probe",action="store_true")
    args=parser.parse_args()
    try:
        root=inspect_model(args.model_root,args.manifest,args.manifest_sha256)
        if importlib.metadata.version("vosk")!="0.3.45": raise ValueError("asr_engine_version")
        import vosk
        vosk.SetLogLevel(-1)
        info={"schemaVersion":1,"engine":"vosk","engineVersion":"0.3.45","modelId":MODEL_ID,"modelFingerprint":args.manifest_sha256,"sampleRate":16000}
        if args.probe:
            print(json.dumps({**info,"ready":True}),flush=True)
            return 0
        model=vosk.Model(str(root))
        rec=vosk.KaldiRecognizer(model,16000)
        rec.SetWords(True)
        stdin=sys.stdin.buffer
        stdout=sys.stdout
        stdout.reconfigure(encoding='utf-8')
        # protocol: 4-byte LE length, then bytes. 0 => finalize utterance, 0xFFFFFFFF => exit
        while True:
            hdr=stdin.read(4)
            if not hdr: break
            if len(hdr)<4: raise ValueError("asr_stream_incomplete")
            (n,)=struct.unpack('<I',hdr)
            if n==0xFFFFFFFF:
                break
            if n==0:
                # end of utterance -> final result and reset
                j=json.loads(rec.FinalResult())
                text=(j.get("text") or "").strip()
                words=j.get("result") or []
                if len(text)>4096 or len(words)>256: raise ValueError("asr_output_limit")
                out={**info,"type":"final","text":text,"words":words,"executionAllowed":False}
                print(json.dumps(out,ensure_ascii=False),flush=True)
                # reset recognizer for next utterance
                rec=vosk.KaldiRecognizer(model,16000)
                rec.SetWords(True)
                continue
            if n>32000 or n%2==1: raise ValueError("asr_pcm_limit")
            pcm=stdin.read(n)
            if len(pcm)!=n: raise ValueError("asr_stream_incomplete")
            is_final=rec.AcceptWaveform(pcm)
            if is_final:
                j=json.loads(rec.Result())
                text=(j.get("text") or "").strip()
                words=j.get("result") or []
                if len(text)>4096 or len(words)>256: raise ValueError("asr_output_limit")
                out={**info,"type":"final","text":text,"words":words,"executionAllowed":False}
                print(json.dumps(out,ensure_ascii=False),flush=True)
                rec=vosk.KaldiRecognizer(model,16000)
                rec.SetWords(True)
            else:
                j=json.loads(rec.PartialResult())
                text=(j.get("partial") or "").strip()
                if len(text)>4096: raise ValueError("asr_output_limit")
                out={**info,"type":"partial","text":text,"executionAllowed":False}
                print(json.dumps(out,ensure_ascii=False),flush=True)
        return 0
    except Exception as error:
        code=str(error) if isinstance(error,ValueError) and str(error).startswith("asr_") else "asr_worker_failed"
        try:
            print(json.dumps({"ok":False,"code":code}),flush=True)
        except: pass
        return 2
if __name__=="__main__": sys.exit(main())
