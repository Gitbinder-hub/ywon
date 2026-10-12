"""Local-only ffprobe adapter. Not a production media ingest sandbox or render worker."""
import argparse
import json
import subprocess
from pathlib import Path

def inspect_media(path: str) -> dict:
    source = Path(path).resolve(strict=True)
    if not source.is_file() or source.stat().st_size > 100 * 1024 * 1024:
        raise ValueError("Expected a local file no larger than 100 MiB")
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration:stream=codec_type,width,height,sample_rate", "-of", "json", str(source)],
        check=True, capture_output=True, text=True, timeout=20,
    )
    info = json.loads(result.stdout)
    return {"schemaVersion": 1, "mode": "local_probe", "streams": info.get("streams", []), "duration": info.get("format", {}).get("duration")}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("path", help="Existing local media file; URLs are not supported")
    args = parser.parse_args()
    print(json.dumps(inspect_media(args.path)))

if __name__ == "__main__":
    main()
