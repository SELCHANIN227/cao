const fs = require('fs');
const vm = require('vm');
const path = require('path');

const root = path.resolve(__dirname, '..');
const storage = new Map();
const context = {
  console,
  setTimeout,
  clearTimeout,
  Date,
  Math,
  JSON,
  Map,
  Set,
  window: { __CAO_TEST_MODE__: true, CAO_AUDIO_MANIFEST: {} },
  localStorage: {
    getItem: key => storage.get(key) || null,
    setItem: (key, value) => storage.set(key, String(value))
  }
};
context.globalThis = context;
vm.createContext(context);

function run(file) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  new vm.Script(source, { filename: file }).runInContext(context);
}

run('course-a1.js');
run('app-v4-base.js');
run('app-v4-render.js');
run('app-v4-lessons.js');

const api = context.window.__CAO_TEST_API__;
if (!api) throw new Error('Test API was not exposed');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(api.units.length === 39, `Expected 39 units, got ${api.units.length}`);
assert(api.words.length >= 650, `Expected at least 650 A1 entries, got ${api.words.length}`);
assert(api.DATA.placement.questions.length === 24, 'Full placement test must contain 24 questions');

const ids = api.words.map(word => word.id);
const counts = ids.reduce((map, id) => map.set(id, (map.get(id) || 0) + 1), new Map());
const duplicateIds = [...counts.entries()].filter(([, count]) => count > 1).map(([id, count]) => `${id}×${count}`);
assert(duplicateIds.length === 0, `Word IDs must be unique. Duplicates: ${duplicateIds.join(', ')}`);
assert(api.units.every(unit => Number.isInteger(unit.lessons) && unit.lessons > 0), 'Every unit must contain lessons');

const wordIds = new Set(ids);
const missingHints = [];
for (const phrase of api.phraseEntries) {
  for (const hint of phrase.hints) {
    if (!wordIds.has(hint)) missingHints.push(`${phrase.unitId}:${hint}`);
  }
}
assert(missingHints.length === 0, `Unknown hint IDs: ${missingHints.join(', ')}`);

for (const question of api.DATA.placement.questions) {
  assert(question.id && Number.isInteger(question.tier), `Invalid placement question: ${JSON.stringify(question)}`);
  assert(Array.isArray(question.options) && question.options.includes(question.answer), `Placement answer is absent from options: ${question.id}`);
  if (question.type === 'listen') assert(question.audio, `Listening question has no audio: ${question.id}`);
}

const allWrong = api.calculatePlacementResult(api.DATA.placement.questions.slice(0, 8).map(question => ({ tier: question.tier, correct: false })));
assert(allWrong.level === 'A0' && allWrong.startUnit === 1, 'All-wrong placement result must start from A0');

const allCorrect = api.calculatePlacementResult(api.DATA.placement.questions.map(question => ({ tier: question.tier, correct: true })));
assert(allCorrect.level === 'A1+' && allCorrect.startUnit === 39, 'All-correct placement result must reach A1+');

assert(api.toCyr('Dobar dan!') === 'Добар дан!', 'Latin-to-Cyrillic conversion failed');
assert(api.normalizeLoose('račun') === api.normalizeLoose('racun'), 'Loose diacritic matching failed');

const audioValues = Object.values(api.audioManifest);
assert(new Set(audioValues).size === audioValues.length, 'Generated audio file keys must be unique');
assert(api.words.every(word => api.audioManifest[word.sr]), 'Every word must have an audio manifest entry');
assert(api.phraseEntries.every(phrase => api.audioManifest[phrase.sr]), 'Every phrase must have an audio manifest entry');

console.log(`A1 checks passed: ${api.units.length} units, ${api.words.length} entries, ${api.phraseEntries.length} phrases.`);
