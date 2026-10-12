"""B-002 local renderer. Existing FFmpeg/ffprobe only; no network, TTS or model API."""
import hashlib
import json
import math
from pathlib import Path
import struct
import subprocess
import sys
import time
import textwrap
import uuid
import wave
import zlib


def probe(file, kind=None):
    file = Path(file)
    if file.is_symlink() or not file.is_file() or file.stat().st_size > 12 * 1024 * 1024:
        raise ValueError('Expected a regular local file <=12 MiB')
    header = file.read_bytes()[:16]
    if kind == 'image' and not (header.startswith(b'\x89PNG\r\n\x1a\n') or header.startswith(b'\xff\xd8\xff')):
        raise ValueError('Expected PNG/JPEG file signature, not playlist or URL')
    if kind == 'audio' and not ((header[:4] == b'RIFF' and header[8:12] == b'WAVE') or header.startswith(b'ID3') or (len(header) >= 2 and header[0] == 255 and header[1] & 0xe0 == 0xe0) or header[4:8] == b'ftyp'):
        raise ValueError('Expected WAV/MP3/M4A signature, not playlist or URL')
    result = subprocess.run(['ffprobe', '-v', 'error', '-protocol_whitelist', 'file,pipe',
        '-show_format', '-show_streams', '-of', 'json', str(file.resolve())], capture_output=True, text=True, check=True, timeout=15)
    data = json.loads(result.stdout)
    streams = data.get('streams', [])
    if kind == 'image':
        if len(streams) != 1 or streams[0].get('codec_name') not in ['png', 'mjpeg']:
            raise ValueError('Only PNG/JPEG still images are supported')
        if not 1 <= int(streams[0].get('width', 0)) <= 4096 or not 1 <= int(streams[0].get('height', 0)) <= 4096:
            raise ValueError('Image dimensions must be <=4096')
        return {'mime': 'image/png' if streams[0]['codec_name'] == 'png' else 'image/jpeg', 'duration': None}
    if kind == 'audio':
        if not set(data.get('format', {}).get('format_name', '').split(',')) & {'wav', 'mp3', 'mov', 'mp4', 'm4a'}:
            raise ValueError('Only WAV/MP3/M4A containers supported')
        if len(streams) != 1 or streams[0].get('codec_type') != 'audio' or streams[0].get('codec_name') not in ['pcm_s16le', 'pcm_s24le', 'pcm_f32le', 'mp3', 'aac']:
            raise ValueError('Use PCM WAV, MP3 or M4A/AAC without embedded video/cover stream')
        duration = float(data.get('format', {}).get('duration', 0))
        if not 0 < duration <= 120 or not math.isfinite(duration):
            raise ValueError('Audio duration must be 0..120 seconds')
        return {'mime': 'audio/wav' if streams[0]['codec_name'].startswith('pcm') else 'audio/mpeg' if streams[0]['codec_name'] == 'mp3' else 'audio/mp4', 'duration': duration}
    return data


def png(file, color):
    width, height = 320, 480
    rows = b''.join(b'\0' + bytes([min(255, color[0] + y // 8), color[1], color[2]]) * width for y in range(height))
    def chunk(name, data):
        return struct.pack('>I', len(data)) + name + data + struct.pack('>I', zlib.crc32(name + data) & 0xffffffff)
    Path(file).write_bytes(b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(rows)) + chunk(b'IEND', b''))


def demo(root, ids):
    if len(ids) != 3 or any(str(uuid.UUID(i)) != i for i in ids):
        raise ValueError('Three UUIDs required')
    assets = Path(root) / 'assets'
    assets.mkdir(parents=True, exist_ok=True)
    png(assets / (ids[0] + '.bin'), (15, 60, 110))
    png(assets / (ids[1] + '.bin'), (35, 100, 70))
    with wave.open(str(assets / (ids[2] + '.bin')), 'wb') as output:
        output.setnchannels(1); output.setsampwidth(2); output.setframerate(8000)
        output.writeframes(b''.join(struct.pack('<h', int(2000 * math.sin(2 * math.pi * 440 * i / 8000))) for i in range(30 * 8000)))
    print(json.dumps({'fixture': True, 'speech': False, 'note': 'Diagnostic tone, not TTS or P0 evidence'}))


def stamp(seconds):
    c = round(seconds * 100)
    return f'{c // 360000}:{c // 6000 % 60:02}:{c // 100 % 60:02}.{c % 100:02}'


def caption(text):
    # ASS user text cannot inject override tags or control sequences.
    text = str(text).replace('\\', '／').replace('{', '（').replace('}', '）')
    text = ''.join(c if ord(c) >= 32 else ' ' for c in text).strip()
    return r'\N'.join(textwrap.wrap(text, width=36, break_long_words=True, break_on_hyphens=False))


def emit(progress, message):
    print(json.dumps({'progress': progress, 'message': message}, ensure_ascii=False), flush=True)


def render(root, job_id):
    if str(uuid.UUID(job_id)) != job_id:
        raise ValueError('Invalid job ID')
    root = Path(root).resolve(); folder = root / 'jobs' / job_id
    data = json.loads((folder / 'input.json').read_text())
    p = data['project']; duration = p['duration']; scenes = p['scenes']
    if not isinstance(duration, int) or not 30 <= duration <= 60 or not 1 <= len(scenes) <= 6:
        raise ValueError('Invalid bounded render plan')
    emit(.05, 'Проверка сохранённых материалов')
    assets = {a['id']: a for a in data['assets']}
    paths = {}
    for asset_id, meta in assets.items():
        if str(uuid.UUID(asset_id)) != asset_id: raise ValueError('Invalid asset ID')
        path = root / 'assets' / (asset_id + '.bin')
        if path.is_symlink() or hashlib.sha256(path.read_bytes()).hexdigest() != meta['sha256']:
            raise ValueError('Asset changed or missing: ' + asset_id)
        paths[asset_id] = path
        probe(path, meta['kind'])
    audio = probe(paths[p['audioId']], 'audio')
    if audio['duration'] < duration - .08 or (audio['duration'] > duration + .25 and not p['trimAudio']):
        raise ValueError('Audio duration/trim approval mismatch')
    width, height = (720, 1280) if p['aspect'] == 'portrait' else (1280, 720)
    headers = f'''[Script Info]\nScriptType: v4.00+\nPlayResX: {width}\nPlayResY: {height}\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Default,Noto Sans,36,&H00FFFFFF,&H00FFFFFF,&H00101010,&H80000000,0,0,0,0,100,100,0,0,1,2,1,2,35,35,50,1\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n'''
    part = duration / len(scenes)
    lines = [f'Dialogue: 0,{stamp(i * part)},{stamp((i + 1) * part)},Default,,0,0,0,,{caption(s["text"])}' for i, s in enumerate(scenes)]
    (folder / 'subtitles.ass').write_text(headers + '\n'.join(lines) + '\n', encoding='utf-8')
    args = ['ffmpeg', '-nostdin', '-y', '-v', 'error', '-threads', '2']
    for scene in scenes:
        args += ['-protocol_whitelist', 'file,pipe', '-loop', '1', '-framerate', '24', '-t', str(part), '-i', str(paths[scene['imageId']])]
    args += ['-protocol_whitelist', 'file,pipe', '-i', str(paths[p['audioId']])]
    filters = [f'[{i}:v]scale={width}:{height}:force_original_aspect_ratio=decrease,pad={width}:{height}:(ow-iw)/2:(oh-ih)/2:color=0x111827,setsar=1,fps=24,format=yuv420p[v{i}]' for i in range(len(scenes))]
    filters.append(''.join(f'[v{i}]' for i in range(len(scenes))) + f'concat=n={len(scenes)}:v=1:a=0,subtitles=subtitles.ass[out]')
    args += ['-filter_complex_threads', '1', '-filter_complex', ';'.join(filters), '-map', '[out]', '-map', f'{len(scenes)}:a:0', '-t', str(duration), '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '28', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', 'output.mp4']
    emit(.2, 'FFmpeg собирает MP4. Это локальный монтаж, не AI-генерация.')
    with (folder / 'ffmpeg.log').open('wb') as log:
        process = subprocess.Popen(args, cwd=folder, stdout=subprocess.DEVNULL, stderr=log)
        deadline = time.monotonic() + 300
        try:
            while process.poll() is None:
                if (folder / 'cancel').exists(): raise ValueError('Сборка отменена')
                if time.monotonic() > deadline: raise ValueError('Превышен лимит сборки 300 секунд')
                time.sleep(.2)
            if process.returncode: raise ValueError('Ошибка FFmpeg: проверь форматы и поддержку libass/libx264')
        finally:
            if process.poll() is None:
                process.terminate()
                try: process.wait(timeout=5)
                except subprocess.TimeoutExpired: process.kill(); process.wait()
    emit(.9, 'Проверка MP4 и сохранение отчёта')
    out = folder / 'output.mp4'
    # Output may be >12MiB; ffprobe uses the same local-only protocol rule.
    result = subprocess.run(['ffprobe', '-v', 'error', '-protocol_whitelist', 'file,pipe', '-show_format', '-show_streams', '-of', 'json', str(out)], check=True, capture_output=True, text=True, timeout=20)
    info = json.loads(result.stdout)
    actual = float(info['format']['duration']); streams = info['streams']
    video = next(s for s in streams if s['codec_type'] == 'video')
    if abs(actual - duration) > .2 or video['width'] != width or video['height'] != height or not any(s['codec_type'] == 'audio' for s in streams):
        raise ValueError('Выходной MP4 не прошёл техническую проверку')
    report = {'mode': 'offline_assembly', 'ai_generation': False, 'diagnostic_fixture': p['diagnostic'],
        'projectId': p['id'], 'revision': p['revision'], 'duration': actual, 'width': width, 'height': height,
        'assets': list(assets.values()), 'output_sha256': hashlib.sha256(out.read_bytes()).hexdigest(),
        'technical_checks': 'duration/dimensions/audio_stream pass; subjective quality/silence/meaning not assessed',
        'human_review': 'not_run', 'paid_provider_calls': 0, 'estimated_total_cost_usd': None,
        'cost_note': 'Local compute/assistant cost unknown, not zero; no paid API', 'p0_p1_acceptance': False,
        'ffmpeg_version': subprocess.check_output(['ffmpeg', '-version'], text=True).splitlines()[0]}
    (folder / 'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    emit(1, 'MP4 готов')


if __name__ == '__main__':
    try:
        if sys.argv[1] == 'probe': print(json.dumps(probe(sys.argv[2], sys.argv[3])))
        elif sys.argv[1] == 'demo': demo(sys.argv[2], sys.argv[3:])
        elif sys.argv[1] == 'render': render(sys.argv[2], sys.argv[3])
        else: raise ValueError('Unknown command')
    except Exception as error:
        emit(0, str(error)); sys.exit(1)
