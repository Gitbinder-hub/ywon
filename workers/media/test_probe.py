import shutil
import tempfile
import unittest
import wave
from pathlib import Path
from probe import inspect_media

class ProbeTests(unittest.TestCase):
    @unittest.skipUnless(shutil.which("ffprobe"), "ffprobe not installed; install ffmpeg to run media evidence")
    def test_real_local_wav(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "fixture.wav"
            with wave.open(str(path), "wb") as output:
                output.setnchannels(1); output.setsampwidth(2); output.setframerate(8000)
                output.writeframes(b"\0\0" * 800)
            info = inspect_media(str(path))
            self.assertEqual(info["mode"], "local_probe")
            self.assertEqual(info["streams"][0]["codec_type"], "audio")
            self.assertAlmostEqual(float(info["duration"]), .1, places=2)
    def test_url_is_not_local_media(self):
        with self.assertRaises(FileNotFoundError): inspect_media("https://example.com/private.mp4")
    def test_directory_is_rejected(self):
        with tempfile.TemporaryDirectory() as folder:
            with self.assertRaises(ValueError): inspect_media(folder)

if __name__ == "__main__": unittest.main()
