// Pipe/argv regression, with a fake child only. Does not prove native ASR quality.
import test from 'node:test';
import assert from 'node:assert/strict';
import childProcess from 'node:child_process';
import {syncBuiltinESMExports} from 'node:module';
import {EventEmitter} from 'node:events';
import {PassThrough, Writable} from 'node:stream';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {VoskProcess} from '../packages/companion/src/asr-process.ts';

test('isolated Python worker requests UTF-8 and Russian JSON survives the pipe', async t => {
  const pcm = new Uint8Array(32000);
  const config = {schemaVersion: 1, pythonExecutable: resolve('fixture-python.exe'),
    modelRoot: resolve('fixture-model'), manifestPath: resolve('fixture-manifest.json'),
    manifestSha256: 'a'.repeat(64), timeoutMs: 1000};
  const calls = [];
  t.mock.method(childProcess, 'spawn', (executable, args, options) => {
    calls.push({executable, args, options});
    const child = new EventEmitter();
    child.stdout = new PassThrough();
    child.stderr = new PassThrough();
    child.kill = () => true;
    child.stdin = new Writable({write(_chunk, _encoding, next) { next(); }, final(next) {
      next();
      queueMicrotask(() => {
        child.stdout.write(Buffer.from(JSON.stringify({schemaVersion: 1, engine: 'vosk',
          engineVersion: '0.3.45', modelId: 'vosk-model-small-ru-0.22',
          modelFingerprint: config.manifestSha256, sampleRate: 16000,
          text: 'проверь файлы', audioSha256: createHash('sha256').update(pcm).digest('hex'),
          durationMs: 1000, words: [], executionAllowed: false}), 'utf8'));
        child.emit('close', 0);
      });
    }});
    return child;
  });
  syncBuiltinESMExports();
  try {
    const result = await new VoskProcess(config).recognize(pcm, new AbortController().signal);
    assert.equal(result.text, 'проверь файлы');
    assert.equal(result.executionAllowed, false);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].executable, config.pythonExecutable);
    // -I ignores env-based UTF-8 settings; this interpreter option is required.
    assert.deepEqual(calls[0].args.slice(0, 3), ['-I', '-X', 'utf8']);
    assert.equal(calls[0].options.shell, false);
    assert.equal(calls[0].options.windowsHide, true);
  } finally {
    t.mock.restoreAll();
    syncBuiltinESMExports();
  }
});

test('synchronous OS spawn denial stays redacted and releases the worker lane', async t => {
  t.mock.method(childProcess, 'spawn', () => { throw Error('EPERM private/path'); });
  syncBuiltinESMExports();
  try {
    const engine = new VoskProcess({schemaVersion: 1, pythonExecutable: resolve('fixture-python.exe'),
      modelRoot: resolve('fixture-model'), manifestPath: resolve('fixture-manifest.json'),
      manifestSha256: 'a'.repeat(64), timeoutMs: 1000});
    for (let attempt = 0; attempt < 2; attempt++) {
      await assert.rejects(engine.probe(), {message: 'asr_process_failed'});
    }
  } finally {
    t.mock.restoreAll();
    syncBuiltinESMExports();
  }
});
