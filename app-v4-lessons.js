(() => {
  'use strict';
  const A = window.CAO;
  if (!A) throw new Error('app-v4-base.js is not loaded');

  A.grammarNotes = {
    3: ['В сербском личное местоимение часто можно опустить, если форма глагола уже понятна.', 'sam — я есть, si — ты есть, je — он/она/оно есть.'],
    6: ['После 2, 3 и 4 форма существительного меняется: dve kafe, tri karte.', 'На старте запоминай числительные целиком и слушай готовые сочетания.'],
    8: ['«U pola tri» буквально означает «в половине третьего», то есть 2:30.', 'Для вопроса о времени используется «Koliko je sati?»'],
    19: ['У глаголов настоящего времени меняется окончание: radim, radiš, radi.', 'Сначала закрепляем форму «я», затем узнаём остальные формы в контексте.'],
    20: ['После mogu, želim, moram часто используется «da + настоящее время»: mogu da pomognem.', 'Отрицание ne ставится перед глаголом: ne razumem, ne mogu.'],
    36: ['i соединяет, ali противопоставляет, jer объясняет причину.', 'Вопросительные слова обычно стоят в начале вопроса.'],
    37: ['u + винительный отвечает на «куда?», u + местный — на «где?».', 'На A1 важнее запоминать готовые модели: u prodavnicu, u Srbiji, kod kuće.'],
    38: ['Прошедшее время: sam + форма на -o/-la. Будущее: ću + инфинитив или da-конструкция.', 'Пол говорящего влияет на прошедшую форму: radio / radila, bio / bila.']
  };

  A.questionDistractors = (word, count = 3) => {
    const sameCategory = A.words.filter(candidate => candidate.id !== word.id && candidate.cat === word.cat);
    const pool = sameCategory.length >= count ? sameCategory : A.words.filter(candidate => candidate.id !== word.id);
    return A.shuffle(pool).slice(0, count);
  };

  A.buildAlphabetQuestions = group => {
    const sampled = A.shuffle(group.letters).slice(0, Math.min(5, group.letters.length));
    const questions = [{ type: 'alphabetIntro', group }];
    sampled.forEach((letter, index) => {
      const options = A.shuffle([letter, ...A.shuffle(group.letters.filter(item => item.latin !== letter.latin)).slice(0, 2)]);
      questions.push(index % 2 === 0
        ? { type: 'letterChoice', prompt: `Найди букву со звуком «${letter.sound}»`, answer: letter.latin, options: options.map(item => item.latin), letter }
        : { type: 'letterChoice', prompt: `Какая кириллическая буква соответствует «${letter.latin}»?`, answer: letter.cyr, options: options.map(item => item.cyr), letter });
    });
    return questions;
  };

  A.buildWordQuestions = (unit, lessonNum) => {
    const ids = unit.lessonSets[lessonNum - 1] || [];
    const selectedWords = ids.map(A.wordById).filter(Boolean);
    const questions = [];
    const note = A.grammarNotes[unit.id];
    if (note && lessonNum === 1) questions.push({ type: 'grammarIntro', title: unit.title, points: note });

    selectedWords.forEach((word, index) => {
      questions.push({ type: 'teachWord', word, hints: [word.id] });
      const distractors = A.questionDistractors(word, unit.id <= 5 ? 2 : 3);
      const mode = (unit.id + lessonNum + index) % 4;
      if (unit.id <= 5 || mode === 0) {
        questions.push({ type: 'choice', word, prompt: `Что означает «${A.displayWord(word)}»?`, hints: [word.id], answer: word.ru, options: A.shuffle([word, ...distractors]).map(item => item.ru) });
      } else if (mode === 1) {
        questions.push({ type: 'listen', word, prompt: 'Что ты услышал?', answer: word.ru, options: A.shuffle([word, ...distractors]).map(item => item.ru) });
      } else if (mode === 2 && unit.id >= 10) {
        questions.push({ type: 'typing', word, prompt: `Напиши по-сербски: «${word.ru}»`, answer: word.sr });
      } else {
        questions.push({ type: 'reverse', word, prompt: `Как будет «${word.ru}»?`, answer: A.displayWord(word), options: A.shuffle([word, ...distractors]).map(A.displayWord) });
      }
    });

    const phrases = (unit.phrases || []).map((phrase, index) => ({ unitId: unit.id, index, sr: phrase[0], ru: phrase[1], hints: phrase[2] || [] }));
    if (phrases.length) {
      const phrase = phrases[(lessonNum - 1) % phrases.length];
      questions.push({
        type: 'phrase',
        prompt: 'Собери перевод фразы',
        serbian: phrase.sr,
        answer: phrase.ru,
        hints: phrase.hints,
        tokens: A.shuffle(phrase.ru.replace(/[.!?—–,:;]/g, '').split(' ').filter(Boolean))
      });
    }
    return questions.slice(0, 10);
  };

  A.startLesson = (unitId, lessonNum) => {
    if (A.state.hearts <= 0) {
      A.state.hearts = 5;
      A.showToast('Сердца восстановлены');
    }
    const unit = A.units.find(item => item.id === unitId);
    if (!unit) return;
    const questions = unit.kind === 'alphabet'
      ? A.buildAlphabetQuestions(A.alphabetGroups[lessonNum - 1])
      : A.buildWordQuestions(unit, lessonNum);
    A.lesson = {
      mode: 'lesson', unitId, lessonNum, title: unit.title, questions, index: 0, correct: 0,
      selected: null, answerLocked: false, startedAt: Date.now(), touchedWords: new Set(),
      characterSeed: unitId * 13 + lessonNum
    };
    A.assessment = null;
    A.openLesson();
    A.renderQuestion();
  };

  A.startReview = due => {
    const questions = A.shuffle(due).slice(0, 10).map((word, index) => {
      const distractors = A.questionDistractors(word, 3);
      return index % 2
        ? { type: 'typing', word, prompt: `Вспомни слово: «${word.ru}»`, answer: word.sr }
        : { type: 'choice', word, prompt: `Что означает «${A.displayWord(word)}»?`, hints: [word.id], answer: word.ru, options: A.shuffle([word, ...distractors]).map(item => item.ru) };
    });
    A.lesson = { mode: 'review', title: 'Повторение', questions, index: 0, correct: 0, answerLocked: false, startedAt: Date.now(), touchedWords: new Set(), characterSeed: 41 };
    A.assessment = null;
    A.openLesson();
    A.renderQuestion();
  };

  A.startPlacement = mode => {
    const all = A.DATA.placement.questions;
    let questions;
    if (mode === 'full') {
      questions = all.map(question => ({ ...question }));
    } else {
      questions = [];
      [0, 1, 2, 3, 4].forEach(tier => {
        questions.push(...A.shuffle(all.filter(question => question.tier === tier)).slice(0, 2));
      });
    }
    A.assessment = {
      mode,
      questions,
      index: 0,
      correct: 0,
      answers: [],
      adaptiveTier: 1,
      used: new Set(),
      max: mode === 'full' ? 24 : 10,
      startedAt: Date.now()
    };
    A.lesson = {
      mode: 'placement', title: mode === 'full' ? 'Полный тест' : 'Быстрый тест',
      questions: [], index: 0, correct: 0, answerLocked: false,
      startedAt: Date.now(), touchedWords: new Set(), characterSeed: 88
    };
    if (mode === 'quick') A.lesson.questions = [A.pickAdaptiveQuestion()];
    else A.lesson.questions = questions;
    A.openLesson();
    A.renderQuestion();
  };

  A.pickAdaptiveQuestion = () => {
    const exactPool = A.DATA.placement.questions.filter(question => question.tier === A.assessment.adaptiveTier && !A.assessment.used.has(question.id));
    let question = A.random(exactPool);
    if (!question) question = A.random(A.DATA.placement.questions.filter(item => !A.assessment.used.has(item.id)));
    if (question) A.assessment.used.add(question.id);
    return question;
  };

  A.openLesson = () => {
    document.getElementById('lessonOverlay').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    document.getElementById('lessonHearts').textContent = A.lesson?.mode === 'placement' ? '∞' : A.state.hearts;
  };

  A.closeLesson = () => {
    A.closeWordTooltip();
    A.stopSpeech();
    document.getElementById('lessonOverlay').classList.add('hidden');
    document.getElementById('lessonFeedback').classList.add('hidden');
    document.body.style.overflow = '';
    A.lesson = null;
    A.assessment = null;
  };

  A.characterQuestionRow = (promptHtml, seed) => {
    const character = A.characterFor(seed);
    return `<div class="question-character-row"><div class="question-character" id="qCharacter"></div><div class="speech-bubble"><span class="character-name">${character.name}</span><div>${promptHtml}</div><small class="helper-line">${A.escape(A.random(A.helperLines))}</small></div></div>`;
  };

  A.renderQuestion = () => {
    if (!A.lesson || A.lesson.index >= A.lesson.questions.length) {
      if (A.lesson?.mode === 'placement') A.finishPlacement();
      else A.finishLesson();
      return;
    }
    A.closeWordTooltip();
    A.lesson.answerLocked = false;
    A.lesson.selected = null;
    document.getElementById('lessonFeedback').classList.add('hidden');
    const question = A.lesson.questions[A.lesson.index];
    const total = A.lesson.mode === 'placement' ? A.assessment.max : A.lesson.questions.length;
    document.getElementById('lessonProgressBar').style.width = `${A.lesson.index / Math.max(1, total) * 100}%`;
    const stage = document.getElementById('lessonStage');
    const seed = A.lesson.characterSeed + A.lesson.index;
    const promptHtml = A.lesson.mode === 'placement'
      ? A.escape(question.prompt || '')
      : A.decorateText(question.prompt || '', question.hints || []);
    let body = '';

    if (question.type === 'alphabetIntro') {
      body = `<div class="question-label">Алфавит · знакомство</div><h2 class="question-title">${A.escape(question.group.title)}</h2><p class="question-subtitle">${A.escape(question.group.subtitle)}</p><div class="alphabet-note">${A.escape(question.group.note)}</div><div class="alphabet-grid">${question.group.letters.map(letter => `<button class="letter-card" data-letter-speak="${A.escapeAttr(letter.example)}"><b>${letter.latin}</b><strong>${letter.cyr}</strong><span>${A.escape(letter.sound)}</span><small>${A.escape(letter.example)} — ${A.escape(letter.exampleRu)}</small><i>🔊</i></button>`).join('')}</div><div class="lesson-actions"><button id="continueLearning" class="primary-button">Понятно, дальше</button></div>`;
    } else if (question.type === 'grammarIntro') {
      body = `<div class="question-label">Мини-грамматика</div><h2 class="question-title">${A.escape(question.title)}</h2><div class="grammar-note-card">${question.points.map((point, index) => `<div><span>${index + 1}</span><p>${A.escape(point)}</p></div>`).join('')}</div><div class="lesson-actions"><button id="continueLearning" class="primary-button">Перейти к практике</button></div>`;
    } else if (question.type === 'teachWord') {
      const example = A.exampleFor(question.word);
      body = `${A.characterQuestionRow('Новое слово. Сначала послушай и посмотри перевод.', seed)}<div class="teach-word-card"><div class="teach-icon">${A.escape(question.word.icon)}</div><div class="teach-word-main"><div class="teach-word">${A.decorateText(A.displayWord(question.word), [question.word.id])}</div><div class="teach-script">${A.escape(question.word.sr)} · ${A.escape(question.word.cyr)}</div><div class="teach-translation">${A.escape(question.word.ru)}</div></div><button id="teachSpeak" class="listen-mini">🔊</button></div>${example ? `<div class="example-card"><span>В контексте</span><b>${A.decorateText(A.state.script === 'cyrillic' ? A.toCyr(example.sr) : example.sr, example.hints)}</b><p>${A.escape(example.ru)}</p><button class="tiny-button" id="exampleSpeak">🔊</button></div>` : ''}<div class="lesson-actions"><button id="continueLearning" class="primary-button">Запомнить и дальше</button></div>`;
    } else if (['choice', 'reverse', 'letterChoice'].includes(question.type)) {
      const label = A.lesson.mode === 'placement' ? `<div class="question-label">${A.assessment.mode === 'full' ? 'Полный тест' : 'Быстрый тест'} · вопрос ${A.lesson.index + 1}</div>` : '';
      body = `${label}${A.characterQuestionRow(promptHtml, seed)}<div class="answer-grid">${question.options.map((option, index) => `<button class="answer-option" data-answer="${A.escapeAttr(option)}"><span class="option-index">${index + 1}</span><span>${A.escape(option)}</span></button>`).join('')}</div>`;
    } else if (question.type === 'listen') {
      const audioText = A.lesson.mode === 'placement' ? question.audio : question.word.sr;
      body = `<div class="question-label">${A.lesson.mode === 'placement' ? 'Тест · аудирование' : 'Аудирование'}</div><h2 class="question-title">${A.escape(question.prompt)}</h2><p class="question-subtitle">Можно прослушать несколько раз.</p><button class="listen-button" id="listenAgain">🔊</button><div class="answer-grid">${question.options.map((option, index) => `<button class="answer-option" data-answer="${A.escapeAttr(option)}"><span class="option-index">${index + 1}</span><span>${A.escape(option)}</span></button>`).join('')}</div>`;
      question._audioText = audioText;
    } else if (question.type === 'typing') {
      body = `${A.characterQuestionRow(promptHtml, seed)}<input id="textAnswer" class="text-answer" autocomplete="off" autocapitalize="none" placeholder="Введи ответ…"><p class="typing-note">Можно писать без č, ć, š, ž и đ — ответ засчитается.</p><div class="lesson-actions"><button id="checkText" class="primary-button">Проверить</button></div>`;
    } else if (question.type === 'phrase') {
      const phraseText = A.state.script === 'cyrillic' ? A.toCyr(question.serbian) : question.serbian;
      const hintIds = [...new Set([...(question.hints || []), ...A.findWordIdsInText(question.serbian)])];
      body = `<div class="question-label">Фраза с подсказками</div><div class="phrase-title-row"><h2 class="question-title phrase-with-hints">${A.decorateText(phraseText, hintIds)}</h2><button class="tiny-button" id="phraseSpeakQuestion">🔊</button></div><p class="question-subtitle">Нажми на незнакомые слова, затем собери русский перевод.</p><div id="phraseAnswer" class="word-bank"></div><div class="word-bank solid-bank">${question.tokens.map((token, index) => `<button class="word-chip" data-token="${A.escapeAttr(token)}" data-token-index="${index}">${A.escape(token)}</button>`).join('')}</div><div class="lesson-actions"><button id="clearPhrase" class="secondary-button">Очистить</button><button id="checkPhrase" class="primary-button">Проверить</button></div>`;
    }

    stage.innerHTML = body;
    const characterElement = document.getElementById('qCharacter');
    if (characterElement) A.setCharacter(characterElement, seed);
    if (A.lesson.mode !== 'placement') A.bindWordHints(stage);

    document.querySelectorAll('[data-letter-speak]').forEach(button => button.onclick = () => A.speak(button.dataset.letterSpeak));
    document.getElementById('continueLearning')?.addEventListener('click', () => A.advanceLearning(question));
    if (question.type === 'teachWord') {
      document.getElementById('teachSpeak').onclick = () => A.speak(question.word.sr);
      document.getElementById('exampleSpeak')?.addEventListener('click', () => A.speak(A.exampleFor(question.word)?.sr));
      setTimeout(() => A.speak(question.word.sr), 180);
    }
    if (question.type === 'listen') {
      document.getElementById('listenAgain').onclick = () => A.speak(question._audioText);
      setTimeout(() => A.speak(question._audioText), 220);
    }
    document.getElementById('phraseSpeakQuestion')?.addEventListener('click', () => A.speak(question.serbian));
    document.querySelectorAll('[data-answer]').forEach(button => button.onclick = () => A.selectChoice(button, question));
    if (question.type === 'typing') {
      const input = document.getElementById('textAnswer');
      input.focus();
      document.getElementById('checkText').onclick = () => A.submitAnswer(input.value, question.answer, question);
      input.onkeydown = event => { if (event.key === 'Enter') A.submitAnswer(input.value, question.answer, question); };
    }
    if (question.type === 'phrase') A.setupPhrase(question);
  };

  A.advanceLearning = question => {
    if (question.word) {
      A.lesson.touchedWords.add(question.word.id);
      if (!A.state.srs[question.word.id]) A.state.srs[question.word.id] = { level: 0, due: Date.now() + 10 * 60e3, seen: 1, correct: 0 };
      A.saveState();
    }
    A.lesson.index += 1;
    A.renderQuestion();
  };

  A.selectChoice = (button, question) => {
    if (A.lesson.answerLocked) return;
    document.querySelectorAll('[data-answer]').forEach(item => item.classList.remove('selected'));
    button.classList.add('selected');
    A.submitAnswer(button.dataset.answer, question.answer, question, button);
  };

  A.submitAnswer = (value, answer, question, button = null) => {
    if (A.lesson.answerLocked) return;
    if (!String(value).trim()) {
      A.showToast('Сначала введи ответ');
      return;
    }
    A.lesson.answerLocked = true;
    const correct = A.normalize(value) === A.normalize(answer) || A.normalizeLoose(value) === A.normalizeLoose(answer);
    if (A.lesson.mode === 'placement') {
      A.assessment.answers.push({ id: question.id, tier: question.tier, correct });
      A.assessment.correct += correct ? 1 : 0;
      if (A.assessment.mode === 'quick') A.assessment.adaptiveTier = A.clamp(A.assessment.adaptiveTier + (correct ? 1 : -1), 0, 4);
    } else {
      A.state.totalAnswers += 1;
      if (correct) {
        A.lesson.correct += 1;
        A.state.totalCorrect += 1;
      } else if (!(A.lesson.mode === 'lesson' && A.lesson.unitId <= 10)) {
        A.state.hearts = Math.max(0, A.state.hearts - 1);
      }
      if (question.word) {
        A.lesson.touchedWords.add(question.word.id);
        A.updateSRS(question.word.id, correct);
      }
      A.saveState();
      document.getElementById('lessonHearts').textContent = A.state.hearts;
    }
    if (button) button.classList.add(correct ? 'correct' : 'wrong');
    A.showFeedback(correct, answer, question);
  };

  A.setupPhrase = question => {
    const selected = [];
    const answerElement = document.getElementById('phraseAnswer');
    document.querySelectorAll('[data-token]').forEach(button => {
      button.onclick = () => {
        if (A.lesson.answerLocked || button.classList.contains('used')) return;
        button.classList.add('used');
        selected.push({ text: button.dataset.token, index: button.dataset.tokenIndex });
        draw();
      };
    });
    function draw() {
      answerElement.innerHTML = selected.map((item, index) => `<button class="word-chip" data-selected-index="${index}">${A.escape(item.text)}</button>`).join('');
      answerElement.querySelectorAll('[data-selected-index]').forEach(button => {
        button.onclick = () => {
          const item = selected.splice(Number(button.dataset.selectedIndex), 1)[0];
          document.querySelector(`[data-token-index="${item.index}"]`)?.classList.remove('used');
          draw();
        };
      });
    }
    document.getElementById('clearPhrase').onclick = () => {
      selected.splice(0);
      document.querySelectorAll('[data-token]').forEach(button => button.classList.remove('used'));
      draw();
    };
    document.getElementById('checkPhrase').onclick = () => A.submitAnswer(selected.map(item => item.text).join(' '), question.answer, question);
  };

  A.showFeedback = (correct, answer, question) => {
    A.closeWordTooltip();
    const box = document.getElementById('lessonFeedback');
    box.className = `lesson-feedback ${correct ? 'feedback-correct' : 'feedback-wrong'}`;
    const placementMode = A.lesson.mode === 'placement';
    const example = !placementMode && question.word ? A.exampleFor(question.word) : null;
    box.innerHTML = `<div class="feedback-inner"><div class="feedback-icon">${correct ? '✓' : '!'}</div><div class="feedback-copy"><b>${correct ? A.random(['Odlično!', 'Bravo!', 'Tačno!']) : placementMode ? 'Ответ принят' : 'Ничего страшного'}</b><p>${correct && example ? `${A.decorateText(example.sr, example.hints)} · ${A.escape(example.ru)}` : correct ? 'Продолжаем.' : `Правильный ответ: ${A.escape(answer)}${placementMode ? '' : '. В уроках подсказки можно открывать до ответа.'}`}</p></div><button id="nextQuestion" class="primary-button">Продолжить</button></div>`;
    box.classList.remove('hidden');
    if (!placementMode) A.bindWordHints(box);
    document.getElementById('nextQuestion').onclick = () => {
      if (placementMode && A.assessment.mode === 'quick') {
        A.lesson.index += 1;
        const lastThree = A.assessment.answers.slice(-3);
        const stableHigh = A.assessment.answers.length >= 6 && A.assessment.adaptiveTier === 4 && lastThree.every(item => item.correct);
        const stableLow = A.assessment.answers.length >= 6 && A.assessment.adaptiveTier === 0 && lastThree.every(item => !item.correct);
        const shouldStop = A.assessment.answers.length >= A.assessment.max || stableHigh || stableLow;
        if (shouldStop) {
          A.finishPlacement();
          return;
        }
        const next = A.pickAdaptiveQuestion();
        if (!next) {
          A.finishPlacement();
          return;
        }
        A.lesson.questions.push(next);
        A.renderQuestion();
      } else {
        A.lesson.index += 1;
        A.renderQuestion();
      }
    };
  };

  A.updateSRS = (id, correct) => {
    const old = A.state.srs[id] || { level: 0, due: 0, seen: 0, correct: 0 };
    const level = correct ? Math.min(5, old.level + 1) : Math.max(0, old.level - 1);
    const intervals = [0, 10 * 60e3, 24 * 60 * 60e3, 3 * 24 * 60 * 60e3, 7 * 24 * 60 * 60e3, 21 * 24 * 60 * 60e3];
    A.state.srs[id] = { level, due: Date.now() + intervals[level], seen: old.seen + 1, correct: old.correct + (correct ? 1 : 0) };
  };

  A.finishLesson = () => {
    if (!A.lesson) return;
    A.closeWordTooltip();
    const completedMode = A.lesson.mode;
    const characterSeed = A.lesson.characterSeed;
    const elapsed = Math.max(1, Math.round((Date.now() - A.lesson.startedAt) / 1000));
    const xp = completedMode === 'review' ? Math.max(5, A.lesson.correct * 2) : 8 + A.lesson.correct;
    A.state.xp += xp;
    A.state.dailyXp += xp;
    A.updateStreak();
    if (completedMode === 'lesson') {
      const key = `${A.lesson.unitId}-${A.lesson.lessonNum}`;
      if (!A.state.completedLessons.includes(key)) A.state.completedLessons.push(key);
      A.lesson.touchedWords.forEach(id => {
        if (!A.state.srs[id]) A.state.srs[id] = { level: 1, due: Date.now() + 10 * 60e3, seen: 1, correct: 1 };
      });
      const unit = A.units.find(item => item.id === A.lesson.unitId);
      if (unit && A.getUnitCompleted(unit) >= unit.lessons) A.state.unlockedThrough = Math.max(A.state.unlockedThrough, Math.min(A.units.length, unit.id + 1));
    }
    const correctCount = A.lesson.correct;
    const graded = A.lesson.questions.filter(question => !['teachWord', 'alphabetIntro', 'grammarIntro'].includes(question.type)).length;
    A.saveState();
    A.renderAll();
    document.getElementById('lessonProgressBar').style.width = '100%';
    document.getElementById('lessonStage').innerHTML = `<div class="finish-card"><div class="finish-character" id="finishCharacter"></div><div class="eyebrow">Урок завершён</div><h2>Bravo!</h2><p>${correctCount === graded ? 'Отличная работа. Подсказки остаются частью обучения.' : 'Главное — ты увидел новые слова несколько раз и дошёл до конца.'}</p><div class="finish-stats"><div class="finish-stat"><b>+${xp}</b><span>XP</span></div><div class="finish-stat"><b>${correctCount}/${graded}</b><span>верно</span></div><div class="finish-stat"><b>${elapsed} c</b><span>время</span></div></div><button id="finishClose" class="primary-button">Вернуться</button></div>`;
    A.setCharacter(document.getElementById('finishCharacter'), characterSeed + 7);
    document.getElementById('finishClose').onclick = () => {
      A.closeLesson();
      A.switchScreen(completedMode === 'review' ? 'review' : 'learn');
    };
  };

  A.calculatePlacementResult = answers => {
    const correct = answers.filter(answer => answer.correct).length;
    const percent = Math.round(correct / Math.max(1, answers.length) * 100);
    const tierRates = [0, 1, 2, 3, 4].map(tier => {
      const tierAnswers = answers.filter(answer => answer.tier === tier);
      return { tier, count: tierAnswers.length, rate: tierAnswers.length ? tierAnswers.filter(answer => answer.correct).length / tierAnswers.length : 0 };
    });
    let highest = 0;
    tierRates.forEach(item => { if (item.count && item.rate >= 0.5) highest = Math.max(highest, item.tier); });
    let level = 'A0';
    let startUnit = 1;
    if (highest === 1 || percent >= 35) { level = 'A1.1'; startUnit = 8; }
    if (highest === 2 || percent >= 55) { level = 'A1.2'; startUnit = 19; }
    if (highest === 3 || percent >= 72) { level = 'A1'; startUnit = 30; }
    if (highest >= 4 && percent >= 70) { level = 'A1+'; startUnit = 39; }
    return { level, startUnit, percent, correct, total: answers.length };
  };

  A.finishPlacement = () => {
    if (!A.assessment) return;
    const mode = A.assessment.mode;
    const result = A.calculatePlacementResult(A.assessment.answers);
    A.state.placementCompleted = true;
    A.state.placementMode = mode;
    A.state.placementLevel = result.level;
    A.state.placementScore = result.percent;
    A.state.placementTakenAt = new Date().toISOString();
    A.state.preferredStartUnit = result.startUnit;
    A.state.unlockedThrough = Math.max(A.state.unlockedThrough || 1, result.startUnit);
    A.state.dismissedPlacement = true;
    A.saveState();
    A.renderAll();
    document.getElementById('lessonProgressBar').style.width = '100%';
    const unit = A.units.find(item => item.id === result.startUnit) || A.units[0];
    document.getElementById('lessonStage').innerHTML = `<div class="finish-card placement-finish"><div class="placement-level-orb large">${A.escape(result.level)}</div><div class="eyebrow">Тест завершён</div><h2>${result.level === 'A0' ? 'Начнём спокойно с основы' : result.level === 'A1+' ? 'A1 уже хорошо знаком' : `Твой уровень: ${A.escape(result.level)}`}</h2><p>Верных ответов: ${result.correct} из ${result.total}. Рекомендуем начать с раздела ${unit.id}: <b>${A.escape(unit.title)}</b>.</p><div class="finish-stats"><div class="finish-stat"><b>${result.percent}%</b><span>результат</span></div><div class="finish-stat"><b>${unit.id}</b><span>стартовый раздел</span></div><div class="finish-stat"><b>${mode === 'full' ? 'полный' : 'быстрый'}</b><span>режим</span></div></div><div class="lesson-actions"><button id="placementClose" class="secondary-button">Посмотреть результат</button><button id="placementGo" class="primary-button">Начать с раздела ${unit.id}</button></div></div>`;
    document.getElementById('placementClose').onclick = () => { A.closeLesson(); A.switchScreen('placement'); };
    document.getElementById('placementGo').onclick = () => {
      A.closeLesson();
      A.switchScreen('learn');
      setTimeout(() => document.querySelector(`[data-unit-card="${unit.id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80);
    };
  };

  if (typeof window !== 'undefined') {
    window.__CAO_TEST_API__ = {
      DATA: A.DATA, words: A.words, units: A.units, phraseEntries: A.phraseEntries,
      alphabetGroups: A.alphabetGroups, toCyr: A.toCyr, normalize: A.normalize,
      normalizeLoose: A.normalizeLoose, wordById: A.wordById,
      audioManifest: A.audioManifest, calculatePlacementResult: A.calculatePlacementResult
    };
    if (window.__CAO_TEST_MODE__) return;
  }

  document.querySelectorAll('[data-screen-link]').forEach(button => {
    button.addEventListener('click', event => {
      event.preventDefault();
      A.switchScreen(button.dataset.screenLink);
    });
  });
  document.getElementById('closeLesson').onclick = () => {
    const message = A.lesson?.mode === 'placement'
      ? 'Выйти из теста? Ответы не сохранятся.'
      : 'Выйти из урока? Текущий прогресс урока не сохранится.';
    if (confirm(message)) A.closeLesson();
  };
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && A.lesson) document.getElementById('closeLesson').click();
  });
  document.addEventListener('click', event => {
    if (A.activeTooltip && !event.target.closest('.word-tooltip') && !event.target.closest('.word-hint')) A.closeWordTooltip();
  });
  window.addEventListener('resize', A.closeWordTooltip);
  window.addEventListener('scroll', A.closeWordTooltip, true);
  if ('speechSynthesis' in window) {
    speechSynthesis.onvoiceschanged = () => {
      if (A.currentScreen === 'profile' && !A.lesson) A.renderProfile();
    };
  }

  A.renderAll();
})();
