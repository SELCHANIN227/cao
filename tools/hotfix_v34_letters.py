from pathlib import Path

path = Path(__file__).with_name("build_v34.py")
source = path.read_text(encoding="utf-8")

old_list = '''LETTER_TTS = [
    "a", "e", "i", "o", "u", "j",
    "m", "n", "k", "t", "p", "b",
    "v", "g", "d", "z", "r", "l",
    "č", "ć", "š", "ž", "đ",
    "c", "s", "f", "h", "lj", "nj", "dž",
]'''

new_list = '''LETTER_TTS = [
    "a", "e", "i", "o", "u", "jot",
    "em", "en", "ka", "te", "pe", "be",
    "ve", "ge", "de", "ze", "er", "el",
    "če", "će", "eš", "že", "đe",
    "ce", "es", "ef", "ha", "elj", "enj", "dže",
]'''

old_template = '''        'data-letter-speak="${escapeAttr(letter.latin.toLocaleLowerCase(\\'sr-Latn\\'))}"','''
new_template = '''        'data-letter-speak="${escapeAttr(({\\'A\\':\\'a\\',\\'E\\':\\'e\\',\\'I\\':\\'i\\',\\'O\\':\\'o\\',\\'U\\':\\'u\\',\\'J\\':\\'jot\\',\\'M\\':\\'em\\',\\'N\\':\\'en\\',\\'K\\':\\'ka\\',\\'T\\':\\'te\\',\\'P\\':\\'pe\\',\\'B\\':\\'be\\',\\'V\\':\\'ve\\',\\'G\\':\\'ge\\',\\'D\\':\\'de\\',\\'Z\\':\\'ze\\',\\'R\\':\\'er\\',\\'L\\':\\'el\\',\\'Č\\':\\'če\\',\\'Ć\\':\\'će\\',\\'Š\\':\\'eš\\',\\'Ž\\':\\'že\\',\\'Đ\\':\\'đe\\',\\'C\\':\\'ce\\',\\'S\\':\\'es\\',\\'F\\':\\'ef\\',\\'H\\':\\'ha\\',\\'LJ\\':\\'elj\\',\\'NJ\\':\\'enj\\',\\'DŽ\\':\\'dže\\'}[letter.latin] || letter.latin.toLowerCase())}"','''

if old_list not in source:
    raise SystemExit("LETTER_TTS block not found")
if old_template not in source:
    raise SystemExit("alphabet template replacement not found")

source = source.replace(old_list, new_list)
source = source.replace(old_template, new_template)
path.write_text(source, encoding="utf-8")
print("Applied stable Serbian alphabet pronunciation names")
