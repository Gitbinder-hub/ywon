import tempfile
from pathlib import Path
import unittest
import offline

class OfflineTextTests(unittest.TestCase):
    def test_caption_escapes_ass_and_wraps_long_words_without_loss(self):
        value = 'а' * 180
        lines = offline.caption(value).split(r'\N')
        self.assertTrue(all(len(line) <= 36 for line in lines))
        self.assertEqual(''.join(lines), value)
        escaped = offline.caption(r'{\pos(1,2)}text' + '\n')
        self.assertNotIn('{', escaped)
        self.assertNotIn('\\pos', escaped)
    def test_playlist_rejected_before_ffprobe(self):
        from unittest.mock import patch
        with tempfile.TemporaryDirectory() as root:
            file = Path(root) / 'playlist.bin'; file.write_text('#EXTM3U\nfile:///etc/passwd\n')
            with patch('offline.subprocess.run') as run:
                with self.assertRaises(ValueError): offline.probe(file, 'audio')
                run.assert_not_called()
    def test_stamp(self):
        self.assertEqual(offline.stamp(30), '0:00:30.00')
    def test_probe_rejects_symlink_and_nonmedia(self):
        with tempfile.TemporaryDirectory() as root:
            file = Path(root) / 'bad.bin'; file.write_bytes(b'not media')
            link = Path(root) / 'link.bin'; link.symlink_to(file)
            with self.assertRaises(ValueError): offline.probe(link, 'image')
            with self.assertRaises(Exception): offline.probe(file, 'audio')
