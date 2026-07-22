#!/usr/bin/env python3
from __future__ import annotations
import hashlib, json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
source = (ROOT / 'app.js').read_text(encoding='utf-8')
pattern = re.compile(r"\b(?:sr|example):\s*'((?:\\.|[^'])*)'")
texts: list[str] = []
for raw in pattern.findall(source):
    text = raw.replace("\\'", "'").replace('\\n', '\n').strip()
    if text and text not in texts:
        texts.append(text)
for text in ['Zdravo! Kako si?', 'Zdravo! Kako si? Hvala.', 'Dobar dan!']:
    if text not in texts:
        texts.append(text)
manifest = {
    'version': 1,
    'language': 'sr-Latn-RS',
    'voices': {
        'gabrijela': 'hr-HR-GabrijelaNeural',
        'srecko': 'hr-HR-SreckoNeural',
    },
    'texts': {text: hashlib.sha1(text.encode('utf-8')).hexdigest()[:16] for text in texts},
}
(ROOT / 'audio-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
(ROOT / 'audio-manifest.js').write_text('window.CAO_AUDIO_MANIFEST = ' + json.dumps(manifest['texts'], ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8')
print(f"Audio manifest: {len(texts)} unique Serbian clips")
