import pathlib
p=pathlib.Path('packages/architect/src/google-live.ts')
t=p.read_text(encoding='utf-8')
# restore correct ffmpegBin resolution
old = "const ffBin=options.ffmpegPath??'C:\\Users\\Marina\\AppData\\Local\\Microsoft\\WinGet\\Links\\ffmpeg.exe';const ffProbeBin='C:\\Users\\Marina\\AppData\\Local\\Microsoft\\WinGet\\Links\\ffprobe.exe';"
new = "function ffmpegBin(ex:string|undefined){if(ex&&ex!=='ffmpeg')return ex;return 'C:\\Users\\Marina\\AppData\\Local\\Microsoft\\WinGet\\Links\\ffmpeg.exe';}const ffBin=ffmpegBin(options.ffmpegPath);"
if old in t:
    t=t.replace(old,new)
    p.write_text(t,encoding='utf-8')
    print('restored ffmpegBin')
else:
    print('not found old')
    idx=t.find('WinGet')
    print(repr(t[idx-400:idx+400]))
