(() => {
  'use strict';

  const API = window.__CAO_TEST_API__;
  if (!API?.phraseLibrary) return;

  const STORAGE_KEY = 'cao-serbian-v2';
  const RUNTIME_URL = 'https://ggml.ai/whisper.cpp/main.js';
  const MODEL_CACHE = 'cao-whisper-models-v1';
  const MODELS = [
    {
      id: 'base-q5_1',
      label: 'Whisper Base',
      sizeMb: 57,
      url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base-q5_1.bin'
    },
    {
      id: 'tiny-q5_1',
      label: 'Whisper Tiny',
      sizeMb: 31,
      url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny-q5_1.bin'
    }
  ];

  const phrasePool = Object.entries(API.phraseLibrary)
    .flatMap(([unit, phrases]) => phrases.map(phrase => ({ ...phrase, unit: Number(unit) })))
    .filter(phrase => phrase?.sr && phrase?.ru);

  const basicPhrases = [
    { sr: 'Zdravo!', ru: 'Привет!', unit: 1 },
    { sr: 'Hvala!', ru: 'Спасибо!', unit: 1 },
    { sr: 'Da.', ru: 'Да.', unit: 1 },
    { sr: 'Ne.', ru: 'Нет.', unit: 1 },
    { sr: 'Ćao!', ru: 'Привет! / Пока!', unit: 2 },
    { sr: 'Dobar dan!', ru: 'Добрый день!', unit: 2 },
    { sr: 'Kako si?', ru: 'Как ты?', unit: 3 },
    { sr: 'Kafa, molim.', ru: 'Кофе, пожалуйста.', unit: 3 }
  ];

  let runtimePromise = null;
  let modelPromise = null;
  let whisperInstance = null;
  let loadedModel = null;
  let whisperOutput = [];
  let activeAudio = null;
  let activeRecorderStop = null;
  let overlayOpen = false;
  let standardAnswersSincePractice = 0;
  let practicesInLesson = 0;
  let practiceSerial = 0;
  let pendingResume = null;
  let customExerciseOpen = false;
  let lastPhrase = '';

  const overlay = document.getElementById('lessonOverlay');
  const stage = document.getElementById('lessonStage');
  const feedback = document.getElementById('lessonFeedback');

  function readState() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch {
      return {};
    }
  }

  function writeState(next) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* private mode */ }
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function wordCount(text) {
    return normalizeLoose(text).split(' ').filter(Boolean).length;
  }

  function currentTier() {
    const completed = readState().completedLessons?.length || 0;
    if (completed < 4) return 1;
    if (completed < 9) return 2;
    if (completed < 14) return 3;
    return 4;
  }

  function choosePhrase() {
    const tier = currentTier();
    const maxWords = [0, 2, 4, 6, 12][tier];
    const maxUnit = [0, 4, 8, 12, 99][tier];
    const source = [...basicPhrases, ...phrasePool];
    let candidates = source.filter(item => item.unit <= maxUnit && wordCount(item.sr) <= maxWords);
    if (!candidates.length) candidates = source.filter(item => wordCount(item.sr) <= maxWords);
    if (!candidates.length) candidates = source;
    const withoutLast = candidates.filter(item => item.sr !== lastPhrase);
    const selected = (withoutLast.length ? withoutLast : candidates)[Math.floor(Math.random() * (withoutLast.length ? withoutLast.length : candidates.length))];
    lastPhrase = selected.sr;
    return selected;
  }

  const cyrToLatin = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', ђ: 'đ', е: 'e', ж: 'ž', з: 'z', и: 'i',
    ј: 'j', к: 'k', л: 'l', љ: 'lj', м: 'm', н: 'n', њ: 'nj', о: 'o', п: 'p', р: 'r',
    с: 's', т: 't', ћ: 'ć', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'č', џ: 'dž', ш: 'š'
  };

  function normalize(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[абвгдђежзијклљмнњопрстћуфхцчџш]/g, letter => cyrToLatin[letter] || letter)
      .replace(/[“”„«»'`]/g, '')
      .replace(/[.!?,:;—–\-()[\]{}]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function normalizeLoose(value) {
    return normalize(value)
      .replace(/đ/g, 'dj')
      .replace(/[čć]/g, 'c')
      .replace(/š/g, 's')
      .replace(/ž/g, 'z')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function levenshtein(a, b) {
    const left = Array.isArray(a) ? a : [...String(a)];
    const right = Array.isArray(b) ? b : [...String(b)];
    const row = Array.from({ length: right.length + 1 }, (_, index) => index);
    for (let i = 1; i <= left.length; i += 1) {
      let previous = row[0];
      row[0] = i;
      for (let j = 1; j <= right.length; j += 1) {
        const saved = row[j];
        row[j] = Math.min(
          row[j] + 1,
          row[j - 1] + 1,
          previous + (left[i - 1] === right[j - 1] ? 0 : 1)
        );
        previous = saved;
      }
    }
    return row[right.length];
  }

  function compareAnswers(actual, expected, mode = 'speech') {
    const heard = normalizeLoose(actual);
    const target = normalizeLoose(expected);
    if (!heard || !target) return { pass: false, score: 0 };
    if (heard === target) return { pass: true, score: 1 };

    const charSimilarity = 1 - levenshtein(heard, target) / Math.max(heard.length, target.length, 1);
    const heardTokens = heard.split(' ').filter(Boolean);
    const targetTokens = target.split(' ').filter(Boolean);
    const tokenSimilarity = 1 - levenshtein(heardTokens, targetTokens) / Math.max(heardTokens.length, targetTokens.length, 1);
    const contained = target.length > 4 && (heard.includes(target) || target.includes(heard));
    const score = Math.max(contained ? 0.82 : 0, charSimilarity * 0.62 + tokenSimilarity * 0.38);
    const count = targetTokens.length;
    const threshold = mode === 'dictation'
      ? (count <= 2 ? 0.78 : count <= 5 ? 0.74 : 0.71)
      : (count === 1 ? 0.66 : count <= 4 ? 0.69 : 0.67);
    return { pass: score >= threshold, score };
  }

  function stopPlayback() {
    if (activeAudio) {
      activeAudio.pause();
      activeAudio.currentTime = 0;
      activeAudio = null;
    }
    if ('speechSynthesis' in window) speechSynthesis.cancel();
  }

  function playPhrase(text) {
    stopPlayback();
    const state = readState();
    const pack = state.voicePack || 'gabrijela';
    const folder = pack === 'system' ? '' : pack;
    const audioKey = window.CAO_AUDIO_MANIFEST?.[text];
    if (folder && audioKey) {
      const audio = new Audio(`assets/audio/${folder}/${audioKey}.mp3`);
      audio.playbackRate = state.voiceStyle === 'slow' ? 0.8 : state.voiceStyle === 'normal' ? 1 : 0.94;
      activeAudio = audio;
      audio.onended = () => { if (activeAudio === audio) activeAudio = null; };
      audio.onerror = () => playSystemVoice(text);
      audio.play().catch(() => playSystemVoice(text));
      return;
    }
    playSystemVoice(text);
  }

  function playSystemVoice(text) {
    if (!('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = speechSynthesis.getVoices();
    utterance.voice = voices.find(voice => /^sr/i.test(voice.lang))
      || voices.find(voice => /^(hr|bs)/i.test(voice.lang))
      || null;
    utterance.lang = utterance.voice?.lang || 'sr-RS';
    utterance.rate = 0.84;
    utterance.pitch = 1.03;
    speechSynthesis.speak(utterance);
  }

  function resetLessonCounters() {
    standardAnswersSincePractice = 0;
    practicesInLesson = 0;
    pendingResume = null;
    customExerciseOpen = false;
    activeRecorderStop?.();
    activeRecorderStop = null;
    stopPlayback();
  }

  if (overlay) {
    const watchOverlay = new MutationObserver(() => {
      const isOpen = !overlay.classList.contains('hidden');
      if (isOpen && !overlayOpen) resetLessonCounters();
      if (!isOpen && overlayOpen) resetLessonCounters();
      overlayOpen = isOpen;
    });
    watchOverlay.observe(overlay, { attributes: true, attributeFilter: ['class'] });
    overlayOpen = !overlay.classList.contains('hidden');
  }

  document.addEventListener('click', event => {
    const button = event.target.closest?.('#nextQuestion');
    if (!button || customExerciseOpen || !overlay || overlay.classList.contains('hidden')) return;

    standardAnswersSincePractice += 1;
    const shouldInsert = standardAnswersSincePractice >= 2 && practicesInLesson < 2;
    if (!shouldInsert) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    pendingResume = typeof button.onclick === 'function' ? button.onclick.bind(button) : null;
    standardAnswersSincePractice = 0;
    practicesInLesson += 1;
    customExerciseOpen = true;
    const kind = practiceSerial++ % 2 === 0 ? 'speaking' : 'dictation';
    window.setTimeout(() => showPractice(kind), 0);
  }, true);

  function resumeLesson() {
    const resume = pendingResume;
    pendingResume = null;
    customExerciseOpen = false;
    activeRecorderStop?.();
    activeRecorderStop = null;
    stopPlayback();
    if (resume) resume();
  }

  function recordResult(type, correct, skipped = false) {
    if (skipped) return;
    const state = readState();
    state.totalAnswers = (state.totalAnswers || 0) + 1;
    if (correct) state.totalCorrect = (state.totalCorrect || 0) + 1;
    state.localPractice = state.localPractice || { speaking: 0, dictation: 0, correct: 0 };
    state.localPractice[type] = (state.localPractice[type] || 0) + 1;
    if (correct) state.localPractice.correct = (state.localPractice.correct || 0) + 1;
    writeState(state);
  }

  function showPractice(kind) {
    const phrase = choosePhrase();
    if (feedback) feedback.classList.add('hidden');
    if (kind === 'dictation') renderDictation(phrase);
    else renderSpeaking(phrase);
  }

  function resultMarkup(correct, title, text, heard = '') {
    return `
      <div class="local-result ${correct ? 'is-correct' : 'is-wrong'}">
        <div class="local-result-icon">${correct ? '✓' : '!'}</div>
        <div>
          <b>${escapeHtml(title)}</b>
          <p>${escapeHtml(text)}</p>
          ${heard ? `<small>Распознано: ${escapeHtml(heard)}</small>` : ''}
        </div>
      </div>
      <button id="localContinue" class="primary-button local-wide-button">Продолжить</button>`;
  }

  function renderDictation(phrase) {
    stage.innerHTML = `
      <div class="local-practice-card">
        <div class="question-label">Аудирование · запись на слух</div>
        <h2 class="question-title">Запиши фразу, которую услышишь</h2>
        <p class="question-subtitle">Можно включать запись несколько раз. Регистр, знаки препинания и сербские диакритические знаки не обязательны.</p>
        <button id="localListen" class="local-listen-button" aria-label="Прослушать фразу"><span>🔊</span><b>Прослушать</b></button>
        <input id="localDictationInput" class="text-answer local-dictation-input" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Напиши услышанную фразу…">
        <div id="localPracticeResult"></div>
        <div class="lesson-actions local-actions">
          <button id="cannotListen" class="secondary-button">Не могу слушать</button>
          <button id="checkDictation" class="primary-button">Проверить</button>
        </div>
      </div>`;

    const input = document.getElementById('localDictationInput');
    const listen = document.getElementById('localListen');
    const check = document.getElementById('checkDictation');
    listen.onclick = () => playPhrase(phrase.sr);
    document.getElementById('cannotListen').onclick = () => {
      recordResult('dictation', false, true);
      resumeLesson();
    };

    const submit = () => {
      const value = input.value.trim();
      if (!value) {
        input.focus();
        input.classList.add('local-shake');
        window.setTimeout(() => input.classList.remove('local-shake'), 350);
        return;
      }
      const verdict = compareAnswers(value, phrase.sr, 'dictation');
      recordResult('dictation', verdict.pass);
      input.disabled = true;
      listen.disabled = true;
      check.disabled = true;
      document.getElementById('cannotListen').disabled = true;
      document.getElementById('localPracticeResult').innerHTML = resultMarkup(
        verdict.pass,
        verdict.pass ? 'Tačno!' : 'Почти. Сверь написание',
        verdict.pass ? phrase.sr : `Правильный вариант: ${phrase.sr}`
      );
      document.getElementById('localContinue').onclick = resumeLesson;
    };

    check.onclick = submit;
    input.onkeydown = event => { if (event.key === 'Enter') submit(); };
    window.setTimeout(() => {
      playPhrase(phrase.sr);
      input.focus();
    }, 260);
  }

  function renderSpeaking(phrase) {
    stage.innerHTML = `
      <div class="local-practice-card">
        <div class="question-label">Произношение · локальный Whisper</div>
        <h2 class="question-title local-target-phrase">${escapeHtml(phrase.sr)}</h2>
        <p class="question-subtitle">${escapeHtml(phrase.ru)}. Акцент не оценивается — проверяем, что произнесена нужная фраза.</p>
        <button id="localExampleListen" class="local-example-listen">🔊 Прослушать пример</button>
        <button id="localMic" class="local-mic-button" aria-label="Начать запись">
          <span class="local-mic-icon">🎙</span>
          <b>Говорить</b>
          <small>Нажми и произнеси фразу</small>
        </button>
        <div id="localSpeechStatus" class="local-speech-status">Первый запуск скачает локальную модель Whisper на устройство.</div>
        <div id="localModelProgress" class="local-model-progress hidden"><span></span></div>
        <div id="localPracticeResult"></div>
        <div class="lesson-actions local-actions">
          <button id="cannotSpeak" class="secondary-button">Не могу говорить</button>
        </div>
      </div>`;

    document.getElementById('localExampleListen').onclick = () => playPhrase(phrase.sr);
    document.getElementById('cannotSpeak').onclick = () => {
      recordResult('speaking', false, true);
      resumeLesson();
    };

    const micButton = document.getElementById('localMic');
    micButton.onclick = async () => {
      if (activeRecorderStop) {
        activeRecorderStop();
        return;
      }
      micButton.disabled = true;
      try {
        setSpeechStatus('Подготавливаю распознавание…');
        await ensureWhisper(updateModelProgress);
        setSpeechStatus('Разреши доступ к микрофону и произнеси фразу.');
        micButton.disabled = false;
        micButton.classList.add('is-recording');
        micButton.querySelector('b').textContent = 'Говори…';
        micButton.querySelector('small').textContent = 'Запись остановится после паузы';
        const audio = await recordMicrophone(status => setSpeechStatus(status));
        activeRecorderStop = null;
        micButton.classList.remove('is-recording');
        micButton.disabled = true;
        micButton.querySelector('b').textContent = 'Проверяю…';
        micButton.querySelector('small').textContent = 'Whisper работает прямо на устройстве';
        setSpeechStatus('Распознаю сербскую речь…');
        await nextPaint();
        const transcript = await transcribe(audio);
        const verdict = compareAnswers(transcript, phrase.sr, 'speech');
        recordResult('speaking', verdict.pass);
        setSpeechStatus(verdict.pass ? 'Фраза распознана.' : 'Фраза отличается от задания.');
        document.getElementById('cannotSpeak').disabled = true;
        document.getElementById('localExampleListen').disabled = true;
        document.getElementById('localPracticeResult').innerHTML = resultMarkup(
          verdict.pass,
          verdict.pass ? 'Odlično!' : 'Попробуй ещё раз в следующем задании',
          verdict.pass ? phrase.sr : `Нужно было сказать: ${phrase.sr}`,
          transcript
        );
        document.getElementById('localContinue').onclick = resumeLesson;
      } catch (error) {
        console.error('[Ćao Whisper]', error);
        activeRecorderStop = null;
        micButton.disabled = false;
        micButton.classList.remove('is-recording');
        micButton.querySelector('b').textContent = 'Повторить';
        micButton.querySelector('small').textContent = 'Нажми, чтобы попробовать снова';
        setSpeechStatus(humanizeSpeechError(error));
      }
    };
  }

  function setSpeechStatus(text) {
    const element = document.getElementById('localSpeechStatus');
    if (element) element.textContent = text;
  }

  function updateModelProgress(percent, label = '') {
    const bar = document.getElementById('localModelProgress');
    if (!bar) return;
    bar.classList.remove('hidden');
    bar.querySelector('span').style.width = `${Math.max(0, Math.min(100, percent))}%`;
    if (label) setSpeechStatus(label);
    if (percent >= 100) window.setTimeout(() => bar.classList.add('hidden'), 450);
  }

  function humanizeSpeechError(error) {
    const message = String(error?.message || error || '');
    if (/permission|denied|notallowed/i.test(message)) return 'Микрофон запрещён. Разреши его в настройках Safari для этого сайта.';
    if (/silence|quiet|speech/i.test(message)) return 'Речь не услышана. Говори чуть ближе к микрофону.';
    if (/memory|allocation|model/i.test(message)) return 'Не удалось загрузить модель. Освободи память и попробуй ещё раз.';
    if (/network|fetch|load/i.test(message)) return 'Не удалось скачать модель. Проверь интернет и повтори.';
    return 'Не получилось распознать запись. Нажми «Повторить».';
  }

  function nextPaint() {
    return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }

  function ensureRuntime() {
    if (window.Module?.init && window.Module?.full_default) return Promise.resolve(window.Module);
    if (runtimePromise) return runtimePromise;

    runtimePromise = new Promise((resolve, reject) => {
      const timeout = window.setTimeout(() => reject(new Error('Whisper runtime load timeout')), 45000);
      const moduleConfig = window.Module || {};
      moduleConfig.noInitialRun = true;
      moduleConfig.print = line => whisperOutput.push(String(line));
      moduleConfig.printErr = line => {
        const text = String(line);
        whisperOutput.push(text);
        if (/error|failed|abort/i.test(text)) console.warn('[Ćao Whisper]', text);
      };
      moduleConfig.setStatus = () => {};
      moduleConfig.onRuntimeInitialized = () => {
        window.clearTimeout(timeout);
        resolve(window.Module || moduleConfig);
      };
      window.Module = moduleConfig;

      const script = document.createElement('script');
      script.src = RUNTIME_URL;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.onerror = () => {
        window.clearTimeout(timeout);
        runtimePromise = null;
        reject(new Error('Whisper runtime failed to load'));
      };
      script.onload = () => {
        if (window.Module?.init && window.Module?.full_default) {
          window.clearTimeout(timeout);
          resolve(window.Module);
        }
      };
      document.head.appendChild(script);
    });

    return runtimePromise;
  }

  async function fetchModel(model, onProgress) {
    let response = null;
    if ('caches' in window) {
      try {
        const cache = await caches.open(MODEL_CACHE);
        response = await cache.match(model.url);
        if (response) onProgress(100, `${model.label} уже сохранён на устройстве.`);
      } catch { /* continue without cache */ }
    }

    if (!response) {
      response = await fetch(model.url, { mode: 'cors', credentials: 'omit' });
      if (!response.ok) throw new Error(`Model fetch failed: ${response.status}`);
      if ('caches' in window) {
        try {
          const cache = await caches.open(MODEL_CACHE);
          cache.put(model.url, response.clone()).catch(() => {});
        } catch { /* cache is optional */ }
      }
    }

    const total = Number(response.headers.get('content-length')) || model.sizeMb * 1024 * 1024;
    if (!response.body?.getReader) {
      const buffer = await response.arrayBuffer();
      onProgress(100, `${model.label} загружен.`);
      return new Uint8Array(buffer);
    }

    const reader = response.body.getReader();
    const chunks = [];
    let received = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.byteLength;
      const percent = Math.min(99, Math.round(received / total * 100));
      onProgress(percent, `Скачиваю ${model.label}: ${percent}% · один раз`);
    }
    const data = new Uint8Array(received);
    let offset = 0;
    chunks.forEach(chunk => {
      data.set(chunk, offset);
      offset += chunk.byteLength;
    });
    onProgress(100, `${model.label} загружен.`);
    return data;
  }

  async function loadWhisperModel(model, onProgress) {
    const Module = await ensureRuntime();
    const bytes = await fetchModel(model, onProgress);
    try { Module.FS_unlink('whisper.bin'); } catch { /* first load */ }
    Module.FS_createDataFile('/', 'whisper.bin', bytes, true, true);
    const instance = Module.init('whisper.bin');
    if (!instance) throw new Error('Whisper model initialization failed');
    whisperInstance = instance;
    loadedModel = model;
    return instance;
  }

  function ensureWhisper(onProgress = () => {}) {
    if (whisperInstance) return Promise.resolve(whisperInstance);
    if (modelPromise) return modelPromise;

    modelPromise = (async () => {
      let lastError = null;
      for (const model of MODELS) {
        try {
          return await loadWhisperModel(model, onProgress);
        } catch (error) {
          lastError = error;
          console.warn(`[Ćao Whisper] ${model.id} failed, trying fallback`, error);
          whisperInstance = null;
          loadedModel = null;
          onProgress(0, `${model.label} не запустился. Пробую облегчённую модель…`);
        }
      }
      throw lastError || new Error('No Whisper model could be loaded');
    })().catch(error => {
      modelPromise = null;
      throw error;
    });

    return modelPromise;
  }

  function rms(samples) {
    let sum = 0;
    for (let i = 0; i < samples.length; i += 1) sum += samples[i] * samples[i];
    return Math.sqrt(sum / Math.max(samples.length, 1));
  }

  function joinFloat32(chunks) {
    const length = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const merged = new Float32Array(length);
    let offset = 0;
    chunks.forEach(chunk => {
      merged.set(chunk, offset);
      offset += chunk.length;
    });
    return merged;
  }

  function downsample(input, inputRate, outputRate = 16000) {
    if (inputRate === outputRate) return input;
    const ratio = inputRate / outputRate;
    const outputLength = Math.round(input.length / ratio);
    const output = new Float32Array(outputLength);
    for (let index = 0; index < outputLength; index += 1) {
      const start = Math.floor(index * ratio);
      const end = Math.min(input.length, Math.floor((index + 1) * ratio));
      let sum = 0;
      let count = 0;
      for (let source = start; source < end; source += 1) {
        sum += input[source];
        count += 1;
      }
      output[index] = count ? sum / count : input[start] || 0;
    }
    return output;
  }

  function trimAndPad(input, sampleRate = 16000) {
    const threshold = 0.007;
    let start = 0;
    let end = input.length - 1;
    while (start < input.length && Math.abs(input[start]) < threshold) start += 1;
    while (end > start && Math.abs(input[end]) < threshold) end -= 1;
    const padding = Math.round(sampleRate * 0.18);
    start = Math.max(0, start - padding);
    end = Math.min(input.length - 1, end + padding);
    const trimmed = input.slice(start, end + 1);
    const minimum = Math.round(sampleRate * 1.15);
    const outputLength = Math.max(minimum, trimmed.length + padding * 2);
    const output = new Float32Array(outputLength);
    output.set(trimmed, Math.max(padding, Math.floor((outputLength - trimmed.length) / 2)));
    return output;
  }

  async function recordMicrophone(onStatus = () => {}) {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('Microphone is not supported');
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    const context = new AudioContextClass();
    await context.resume();
    const source = context.createMediaStreamSource(stream);
    const processor = context.createScriptProcessor(4096, 1, 1);
    const silent = context.createGain();
    silent.gain.value = 0;
    source.connect(processor);
    processor.connect(silent);
    silent.connect(context.destination);

    const chunks = [];
    const startedAt = performance.now();
    let speechStarted = false;
    let lastSpeechAt = startedAt;
    let noiseFloor = 0.006;
    let calibrationFrames = 0;
    let settled = false;

    return new Promise((resolve, reject) => {
      const cleanup = () => {
        try { processor.disconnect(); } catch { /* noop */ }
        try { source.disconnect(); } catch { /* noop */ }
        try { silent.disconnect(); } catch { /* noop */ }
        stream.getTracks().forEach(track => track.stop());
        context.close().catch(() => {});
      };

      const finish = () => {
        if (settled) return;
        settled = true;
        cleanup();
        activeRecorderStop = null;
        const merged = joinFloat32(chunks);
        if (!speechStarted || merged.length < context.sampleRate * 0.25) {
          reject(new Error('Silence detected'));
          return;
        }
        const resampled = trimAndPad(downsample(merged, context.sampleRate));
        if (rms(resampled) < 0.004) {
          reject(new Error('Recording is too quiet'));
          return;
        }
        resolve(resampled);
      };

      activeRecorderStop = finish;
      processor.onaudioprocess = event => {
        if (settled) return;
        const samples = new Float32Array(event.inputBuffer.getChannelData(0));
        chunks.push(samples);
        const level = rms(samples);
        const now = performance.now();
        const elapsed = now - startedAt;

        if (elapsed < 450) {
          noiseFloor = (noiseFloor * calibrationFrames + level) / (calibrationFrames + 1);
          calibrationFrames += 1;
        }
        const voiceThreshold = Math.max(0.012, noiseFloor * 2.8);
        if (level > voiceThreshold) {
          speechStarted = true;
          lastSpeechAt = now;
          onStatus('Слышу тебя…');
        }
        if (speechStarted && elapsed > 650 && now - lastSpeechAt > 720) finish();
        else if (!speechStarted && elapsed > 5000) finish();
        else if (elapsed > 9000) finish();
      };

      window.setTimeout(() => {
        if (!settled) finish();
      }, 9300);
    });
  }

  function extractTranscript(lines, returned) {
    if (typeof returned === 'string' && returned.trim() && !/^\d+$/.test(returned.trim())) return returned.trim();
    const ignored = /^(whisper_|ggml_|main:|system_info:|load |encode |decode |fallback|sampling|mel |cpu |warning|error|js:)/i;
    const text = lines
      .map(line => String(line).replace(/^\s*\[[\d:.]+\s*-->\s*[\d:.]+\]\s*/, '').trim())
      .filter(line => line && !ignored.test(line) && !/^\d+(\.\d+)?%$/.test(line))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    return text;
  }

  async function transcribe(audio) {
    const Module = await ensureRuntime();
    await ensureWhisper(updateModelProgress);
    whisperOutput = [];
    const startIndex = whisperOutput.length;
    const threads = /iPhone|iPad|iPod/i.test(navigator.userAgent)
      ? 1
      : Math.max(1, Math.min(4, navigator.hardwareConcurrency || 2));
    const returned = Module.full_default(whisperInstance, audio, 'sr', threads, false);
    const transcript = extractTranscript(whisperOutput.slice(startIndex), returned);
    if (!transcript) throw new Error('Speech was not recognized');
    return transcript;
  }

  window.CAO_LOCAL_PRACTICE = {
    normalize,
    normalizeLoose,
    compareAnswers,
    choosePhrase,
    get loadedModel() { return loadedModel?.id || null; }
  };
})();
