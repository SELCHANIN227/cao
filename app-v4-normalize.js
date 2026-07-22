(() => {
  'use strict';
  const A = window.CAO;
  if (!A) throw new Error('app-v4-base.js is not loaded');

  const seen = new Set();
  for (const unit of A.units) {
    if (!unit.wordObjects) continue;
    const localAliases = new Map();
    for (const word of unit.wordObjects) {
      const originalId = word.id;
      if (seen.has(originalId)) {
        const uniqueId = `${originalId}_u${unit.id}`;
        word.id = uniqueId;
        localAliases.set(originalId, uniqueId);
      }
      seen.add(word.id);
    }
    unit.lessonSets = A.chunk(unit.wordObjects.map(word => word.id), 4);
    if (localAliases.size && unit.phrases) {
      unit.phrases = unit.phrases.map(phrase => [
        phrase[0],
        phrase[1],
        (phrase[2] || []).map(id => localAliases.get(id) || id)
      ]);
    }
  }

  A.words = A.units.flatMap(unit => unit.wordObjects || []);
  A.wordMap = new Map(A.words.map(word => [word.id, word]));
  A.phraseEntries = A.units.flatMap(unit => (unit.phrases || []).map((phrase, index) => ({
    unitId: unit.id,
    index,
    sr: phrase[0],
    ru: phrase[1],
    hints: phrase[2] || []
  })));

  A.words.forEach(word => {
    if (!A.audioManifest[word.sr]) A.audioManifest[word.sr] = `a1w_${word.id}`;
  });
  A.phraseEntries.forEach(phrase => {
    if (!A.audioManifest[phrase.sr]) A.audioManifest[phrase.sr] = `a1p_${phrase.unitId}_${phrase.index + 1}`;
  });
  window.CAO_AUDIO_MANIFEST = A.audioManifest;
})();
