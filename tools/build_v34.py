from __future__ import annotations

import asyncio
import hashlib
import json
import shutil
import sys
import time
import zipfile
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
BUILD = DIST / "cao-serbian-v3.4"
ZIP_PATH = DIST / "cao-serbian-v3.4-audio-sync-fix.zip"

LETTER_TTS = [
    "a", "e", "i", "o", "u", "j",
    "m", "n", "k", "t", "p", "b",
    "v", "g", "d", "z", "r", "l",
    "č", "ć", "š", "ž", "đ",
    "c", "s", "f", "h", "lj", "nj", "dž",
]

FEMALE_VOICES = ["sr-RS-SophieNeural", "hr-HR-GabrijelaNeural"]
MALE_VOICES = ["sr-RS-NicholasNeural", "hr-HR-SreckoNeural"]


def stable_key(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]


def load_manifest(path: Path) -> dict[str, str]:
    source = path.read_text(encoding="utf-8")
    marker = "window.CAO_AUDIO_MANIFEST ="
    if marker not in source:
        raise RuntimeError("audio-manifest.js has an unknown format")
    payload = source.split(marker, 1)[1].strip()
    if payload.endswith(";"):
        payload = payload[:-1]
    data = json.loads(payload)
    if not isinstance(data, dict):
        raise RuntimeError("Audio manifest must be an object")
    return {str(text): str(key) for text, key in data.items()}


def write_manifest(path: Path, manifest: dict[str, str]) -> None:
    payload = json.dumps(manifest, ensure_ascii=False, separators=(",", ":"))
    path.write_text(f"window.CAO_AUDIO_MANIFEST = {payload};\n", encoding="utf-8")


def patch_text(path: Path, old: str, new: str, label: str) -> None:
    source = path.read_text(encoding="utf-8")
    if old not in source:
        raise RuntimeError(f"Patch target not found: {label}")
    path.write_text(source.replace(old, new), encoding="utf-8")


def prepare_build() -> dict[str, str]:
    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir(parents=True)

    shutil.copytree(
        ROOT,
        BUILD,
        ignore=shutil.ignore_patterns(".git", ".github", "dist", "__pycache__", "*.pyc"),
    )

    app_path = BUILD / "app.js"
    index_path = BUILD / "index.html"
    manifest_path = BUILD / "audio-manifest.js"

    # Alphabet buttons must pronounce the letter itself, not the example word.
    patch_text(
        app_path,
        'data-letter-speak="${escapeAttr(letter.example)}"',
        'data-letter-speak="${escapeAttr(letter.latin.toLocaleLowerCase(\'sr-Latn\'))}"',
        "alphabet letter audio",
    )

    # Keep the public voice id for saved settings, but point it at a clean versioned folder.
    patch_text(
        app_path,
        "srecko: { label: 'Никола', description: 'Спокойный мужской сербский нейроголос', folder: 'srecko' }",
        "srecko: { label: 'Никола', description: 'Спокойный мужской сербский нейроголос · исправленный пакет v2', folder: 'nikola-v2' }",
        "versioned male voice folder",
    )

    # Every section is available from lesson 1. Later lessons inside that section stay sequential.
    patch_text(
        app_path,
        "  function isUnitUnlocked(unit) {\n    if (unit.id === 1) return true;\n    const previous = units[unit.id - 2];\n    return getUnitCompleted(previous) >= previous.lessons;\n  }",
        "  function isUnitUnlocked(unit) {\n    return true;\n  }",
        "free section entry",
    )

    # Force browsers and GitHub Pages to request the new JS/manifest rather than stale cache.
    patch_text(index_path, '<script src="audio-manifest.js"></script>', '<script src="audio-manifest.js?v=3.4"></script>', "manifest cache bust")
    patch_text(index_path, '<script src="app.js"></script>', '<script src="app.js?v=3.4"></script>', "app cache bust")

    manifest = load_manifest(manifest_path)
    for text in LETTER_TTS:
        manifest.setdefault(text, stable_key(text))
    write_manifest(manifest_path, manifest)

    # The old male folder is known to be corrupted and must never ship in this build.
    shutil.rmtree(BUILD / "assets" / "audio" / "srecko", ignore_errors=True)

    readme = """Ćao! v3.4 — исправление озвучки

Что исправлено:
- мужской пакет полностью создан заново и лежит в assets/audio/nikola-v2;
- каждый MP3 создаётся последовательно во временный файл и только после проверки получает окончательное имя;
- имя MP3 жёстко связано с текстом через audio-manifest.js;
- старый повреждённый assets/audio/srecko в сборку не включён;
- в алфавите произносится сама буква, а не примерное слово;
- первый урок каждого раздела доступен сразу;
- последующие уроки выбранного раздела открываются по порядку;
- app.js и audio-manifest.js получили cache-busting v3.4.

Для GitHub Pages загружай содержимое папки как есть. Старую папку assets/audio/srecko можно удалить.
"""
    (BUILD / "ОБНОВЛЕНИЕ-v3.4.txt").write_text(readme, encoding="utf-8")
    return manifest


def is_valid_mp3(path: Path) -> bool:
    if not path.exists() or path.stat().st_size < 700:
        return False
    head = path.read_bytes()[:3]
    return head == b"ID3" or head[:1] == b"\xff"


async def select_voice(candidates: list[str], test_dir: Path) -> str:
    test_dir.mkdir(parents=True, exist_ok=True)
    errors: list[str] = []
    for voice in candidates:
        test_path = test_dir / f"voice-test-{stable_key(voice)}.mp3"
        try:
            await edge_tts.Communicate("Zdravo", voice=voice).save(str(test_path))
            if is_valid_mp3(test_path):
                test_path.unlink(missing_ok=True)
                return voice
            errors.append(f"{voice}: empty or invalid audio")
        except Exception as exc:  # noqa: BLE001
            errors.append(f"{voice}: {exc}")
        finally:
            test_path.unlink(missing_ok=True)
    raise RuntimeError("No working voice found: " + " | ".join(errors))


async def synthesize_one(text: str, voice: str, target: Path, retries: int = 4) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    temp = target.with_suffix(".mp3.part")
    temp.unlink(missing_ok=True)
    last_error: Exception | None = None

    for attempt in range(1, retries + 1):
        try:
            await edge_tts.Communicate(text, voice=voice).save(str(temp))
            if not is_valid_mp3(temp):
                raise RuntimeError("TTS returned an empty or invalid MP3")
            temp.replace(target)
            return
        except Exception as exc:  # noqa: BLE001
            last_error = exc
            temp.unlink(missing_ok=True)
            await asyncio.sleep(min(8, attempt * 2))

    raise RuntimeError(f"Failed to synthesize {text!r} with {voice}: {last_error}")


async def build_pack(
    *,
    manifest: dict[str, str],
    folder: Path,
    voice_candidates: list[str],
    texts: list[str],
    pack_name: str,
) -> None:
    folder.mkdir(parents=True, exist_ok=True)
    voice = await select_voice(voice_candidates, DIST / "voice-tests")
    index_path = folder / "audio-index.json"
    existing_index: dict[str, dict[str, str]] = {}
    if index_path.exists():
        try:
            payload = json.loads(index_path.read_text(encoding="utf-8"))
            existing_index = payload.get("entries", {}) if isinstance(payload, dict) else {}
        except Exception:  # noqa: BLE001
            existing_index = {}

    entries: dict[str, dict[str, str]] = dict(existing_index)
    total = len(texts)
    generated = 0
    skipped = 0

    for position, text in enumerate(texts, 1):
        key = manifest[text]
        target = folder / f"{key}.mp3"
        fingerprint = hashlib.sha256(f"{voice}\0{text}".encode("utf-8")).hexdigest()
        previous = entries.get(key, {})
        if is_valid_mp3(target) and previous.get("fingerprint") == fingerprint and previous.get("text") == text:
            skipped += 1
            print(f"[{pack_name}] {position}/{total} skip {text}", flush=True)
            continue

        await synthesize_one(text, voice, target)
        entries[key] = {
            "text": text,
            "text_sha256": hashlib.sha256(text.encode("utf-8")).hexdigest(),
            "voice": voice,
            "fingerprint": fingerprint,
            "file": target.name,
        }
        generated += 1
        print(f"[{pack_name}] {position}/{total} generated {text}", flush=True)
        # Gentle pacing prevents service throttling and guarantees one in-flight request.
        await asyncio.sleep(0.08)

    index_payload = {
        "format": 2,
        "pack": pack_name,
        "voice": voice,
        "generated_at_unix": int(time.time()),
        "entries": entries,
    }
    index_path.write_text(json.dumps(index_payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[{pack_name}] complete: generated={generated}, skipped={skipped}, total={total}", flush=True)


def make_zip() -> None:
    if ZIP_PATH.exists():
        ZIP_PATH.unlink()
    with zipfile.ZipFile(ZIP_PATH, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
        for path in sorted(BUILD.rglob("*")):
            if path.is_file():
                archive.write(path, path.relative_to(BUILD))
    print(f"ZIP: {ZIP_PATH} ({ZIP_PATH.stat().st_size} bytes)", flush=True)


async def main() -> None:
    manifest = prepare_build()

    # Existing female files are trusted. Only genuinely new alphabet phonemes are generated.
    await build_pack(
        manifest=manifest,
        folder=BUILD / "assets" / "audio" / "gabrijela",
        voice_candidates=FEMALE_VOICES,
        texts=LETTER_TTS,
        pack_name="gabrijela",
    )

    # Male files are deliberately rebuilt into a clean versioned folder, sequentially.
    await build_pack(
        manifest=manifest,
        folder=BUILD / "assets" / "audio" / "nikola-v2",
        voice_candidates=MALE_VOICES,
        texts=list(manifest.keys()),
        pack_name="nikola-v2",
    )

    shutil.rmtree(DIST / "voice-tests", ignore_errors=True)
    make_zip()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        sys.exit(130)
