"""Explicit local inspected-model manifest/config builder. No install, download, audio or grant."""
import argparse, hashlib, json, pathlib, stat, sys
MODEL_ID="vosk-model-small-ru-0.22"
def main():
    p=argparse.ArgumentParser();p.add_argument("--model-root",required=True);p.add_argument("--python-executable",required=True);p.add_argument("--output-dir",required=True);p.add_argument("--inspect-local-model",action="store_true");a=p.parse_args()
    if not a.inspect_local_model: raise ValueError("explicit_model_inspection_required")
    root=pathlib.Path(a.model_root).resolve(strict=True);python=pathlib.Path(a.python_executable).absolute();out=pathlib.Path(a.output_dir).resolve()
    if not root.is_dir() or not python.is_file() or root.name!=MODEL_ID:raise ValueError("asr_setup_denied")
    if out==root or root in out.parents:raise ValueError("asr_state_model_overlap")
    files={};total=0
    for f in root.rglob("*"):
        st=f.lstat()
        if stat.S_ISLNK(st.st_mode):raise ValueError("asr_unsafe_model")
        if f.is_dir():continue
        if not stat.S_ISREG(st.st_mode) or st.st_nlink!=1:raise ValueError("asr_unsafe_model")
        total+=st.st_size
        if len(files)>=64 or total>100*1024*1024:raise ValueError("asr_model_limit")
        files[f.relative_to(root).as_posix()]=hashlib.sha256(f.read_bytes()).hexdigest()
    if not all(k in files for k in ["am/final.mdl","conf/model.conf","conf/mfcc.conf"]):raise ValueError("asr_model_incomplete")
    out.mkdir(parents=True,exist_ok=True);manifest=out/"model-manifest.json";config=out/"asr-config.json"
    if manifest.exists() or config.exists():raise ValueError("asr_setup_output_exists")
    raw=(json.dumps({"schemaVersion":1,"modelId":MODEL_ID,"files":files},sort_keys=True,separators=(",",":"))+"\n").encode()
    manifest.write_bytes(raw);config.write_text(json.dumps({"schemaVersion":1,"pythonExecutable":str(python),"modelRoot":str(root),"manifestPath":str(manifest),"manifestSha256":hashlib.sha256(raw).hexdigest(),"timeoutMs":30000},indent=2)+"\n")
    print(json.dumps({"ok":True,"config":str(config),"filesInspected":len(files),"bytesInspected":total,"modelFingerprint":hashlib.sha256(raw).hexdigest(),"productionReady":False}))
if __name__=="__main__":
    try:main()
    except Exception as e:print(json.dumps({"ok":False,"code":str(e) if isinstance(e,ValueError) else "asr_setup_failed"}));sys.exit(2)
