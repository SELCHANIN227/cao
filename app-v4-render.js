(() => {
  'use strict';
  const A = window.CAO;
  if (!A) throw new Error('app-v4-base.js is not loaded');

  A.renderAll = () => {
    A.renderLearn();
    A.renderPlacement();
    A.renderReview();
    A.renderWords();
    A.renderProfile();
    A.renderGlobal();
  };

  A.renderGlobal = () => {
    document.getElementById('streakTop').textContent = A.state.streak;
    document.getElementById('xpTop').textContent = A.state.dailyXp;
    document.getElementById('heartsTop').textContent = A.state.hearts;
    document.getElementById('dailyXpSide').textContent = A.state.dailyXp;
    document.getElementById('dailyGoalSide').textContent = A.state.dailyGoal;
    document.getElementById('dailyGoalLabel').textContent = `${A.state.dailyGoal} XP`;
    const percentage = A.clamp(Math.round((A.state.dailyXp / A.state.dailyGoal) * 100), 0, 100);
    document.getElementById('goalPercent').textContent = `${percentage}%`;
    document.getElementById('goalRingValue').style.strokeDashoffset = 301.59 * (1 - percentage / 100);
    document.getElementById('dailyMotivation').textContent = percentage >= 100
      ? 'Цель выполнена. Отличная работа!'
      : percentage >= 50
        ? 'Уже больше половины. Хороший темп.'
        : 'Один короткий урок — и прогресс пойдёт.';
    const due = A.dueWords().length;
    const badge = document.getElementById('reviewBadge');
    badge.textContent = due;
    badge.classList.toggle('hidden', due === 0);
    A.setCharacter(document.getElementById('sidebarCharacter'), 3);
  };

  A.renderPhrase = () => {
    const allowedThrough = Math.max(3, A.state.unlockedThrough || 1);
    const pool = A.phraseEntries.filter(phrase => phrase.unitId <= allowedThrough);
    const phrase = pool.length
      ? pool[new Date().getDate() % pool.length]
      : { sr: 'Kako si?', ru: 'Как ты?', hints: [] };
    const display = A.state.script === 'cyrillic' ? A.toCyr(phrase.sr) : phrase.sr;
    document.getElementById('phraseSr').innerHTML = A.decorateText(display, phrase.hints);
    document.getElementById('phraseRu').textContent = phrase.ru;
    document.getElementById('phraseSpeak').onclick = () => A.speak(phrase.sr);
    A.setCharacter(document.getElementById('phraseCharacter'), new Date().getDate() + 3);
    A.bindWordHints(document.querySelector('.phrase-card'));
  };

  A.renderLearn = () => {
    const firstIncomplete = A.firstIncompleteUnit();
    const completedTotal = A.state.completedLessons.length;
    const courseComplete = !firstIncomplete;
    const levelText = A.state.placementCompleted
      ? `Определённый уровень: ${A.state.placementLevel}`
      : 'Начни с нуля или пройди тест';
    const totalLessons = A.units.reduce((sum, unit) => sum + unit.lessons, 0);

    document.getElementById('screen-learn').innerHTML = `
      <div class="hero">
        <div class="hero-copy">
          <div class="eyebrow">Полный курс A1 · ${A.words.length} слов и выражений</div>
          <h1>${courseComplete ? 'Svaka čast!' : completedTotal ? 'Nastavljamo?' : 'Сербский без паники.'}<br>
            <span style="color:var(--accent)">${courseComplete ? 'A1 пройден!' : completedTotal ? 'Продолжим?' : 'От букв до общения'}</span>
          </h1>
          <p>${courseComplete
            ? 'Ты завершил весь маршрут A1. Теперь закрепляй лексику и повторяй живые диалоги.'
            : completedTotal
              ? `Пройдено ${completedTotal} ${A.plural(completedTotal, 'занятие', 'занятия', 'занятий')}. ${levelText}.`
              : 'Алфавит, базовая лексика, бытовые темы, грамматика, аудирование и живые диалоги.'}</p>
          <div class="hero-actions">
            <button class="primary-button" id="heroStart">${courseComplete ? 'К повторению' : completedTotal ? 'Продолжить' : 'Начать обучение'}</button>
            <button class="secondary-button" id="heroPlacement">${A.state.placementCompleted ? 'Пересдать тест' : 'Определить уровень'}</button>
          </div>
        </div>
        <div class="hero-character" id="heroCharacter"></div>
      </div>

      ${!A.state.placementCompleted && !A.state.dismissedPlacement ? `
        <div class="placement-banner">
          <div class="placement-banner-copy">
            <span class="placement-banner-icon">⚡</span>
            <div><b>Уже знаешь немного сербский?</b><p>Быстрый тест займёт около трёх минут и откроет подходящую точку курса.</p></div>
          </div>
          <div class="placement-banner-actions">
            <button id="bannerQuickTest" class="primary-button">Быстрый тест</button>
            <button id="bannerSkip" class="section-link">Начать сначала</button>
          </div>
        </div>` : ''}

      <div class="hint-explainer">
        <span class="hint-demo">zdravo</span>
        <div><b>Слово непонятно?</b><p>Нажми на пунктир — перевод откроется прямо в задании.</p></div>
      </div>

      <div class="section-head">
        <div><h2>Маршрут A1</h2><p>39 разделов · ${totalLessons} коротких уроков</p></div>
        <button class="section-link" data-screen-jump="words">Открыть словарь</button>
      </div>

      <div class="unit-list">
        ${A.units.map(unit => {
          const done = A.getUnitCompleted(unit);
          const unlocked = A.isUnitUnlocked(unit);
          const percentage = Math.round(done / unit.lessons * 100);
          return `<article class="unit-card ${unlocked ? '' : 'locked'}" data-unit-card="${unit.id}">
            <div class="unit-icon" style="background:${unit.color}">${unit.icon}</div>
            <div class="unit-copy">
              <div class="unit-kicker">${A.levelForUnit(unit.id)}</div>
              <h3>Раздел ${unit.id}. ${A.escape(unit.title)}</h3>
              <p>${A.escape(unit.subtitle)}</p>
              <div class="unit-progress"><div class="progress-track"><span style="width:${percentage}%"></span></div><small>${done}/${unit.lessons}</small></div>
            </div>
            <div class="lesson-dots">${Array.from({ length: unit.lessons }, (_, index) => {
              const key = `${unit.id}-${index + 1}`;
              const completed = A.state.completedLessons.includes(key);
              const current = !completed && index === done;
              const placementOpen = unit.id <= (A.state.unlockedThrough || 1);
              const disabled = !unlocked || (!completed && index > done && !placementOpen);
              return `<button class="lesson-dot ${completed ? 'completed' : ''} ${current ? 'current' : ''}" data-unit="${unit.id}" data-lesson="${index + 1}" ${disabled ? 'disabled' : ''}>${completed ? '✓' : index + 1}</button>`;
            }).join('')}</div>
          </article>`;
        }).join('')}
      </div>`;

    A.setCharacter(document.getElementById('heroCharacter'), 1 + completedTotal);
    document.getElementById('heroStart').onclick = () => {
      if (courseComplete) A.switchScreen('review');
      else A.startLesson(firstIncomplete?.id || 1, A.getUnitCompleted(firstIncomplete || A.units[0]) + 1);
    };
    document.getElementById('heroPlacement').onclick = () => A.switchScreen('placement');
    document.getElementById('bannerQuickTest')?.addEventListener('click', () => A.startPlacement('quick'));
    document.getElementById('bannerSkip')?.addEventListener('click', () => {
      A.state.dismissedPlacement = true;
      A.saveState();
      A.renderLearn();
      A.startLesson(1, 1);
    });
    document.querySelectorAll('.lesson-dot:not(:disabled)').forEach(button => {
      button.onclick = () => A.startLesson(Number(button.dataset.unit), Number(button.dataset.lesson));
    });
    document.querySelectorAll('[data-screen-jump]').forEach(button => {
      button.onclick = () => A.switchScreen(button.dataset.screenJump);
    });
    A.renderPhrase();
  };

  A.renderPlacement = () => {
    const hasResult = A.state.placementCompleted;
    const recommendation = hasResult ? A.units.find(unit => unit.id === A.state.preferredStartUnit) : null;
    document.getElementById('screen-placement').innerHTML = `
      <div class="page-head">
        <div class="eyebrow">Не обязательно начинать сначала</div>
        <h1>Тест на уровень</h1>
        <p>Два режима. В тесте нет сердец, штрафов и переводов по нажатию.</p>
      </div>

      ${hasResult ? `<section class="placement-result-card">
        <div class="placement-level-orb">${A.escape(A.state.placementLevel)}</div>
        <div class="placement-result-copy"><span>Последний результат</span><h2>${A.escape(A.state.placementLevel === 'A1+' ? 'A1 уверенный / выше' : A.state.placementLevel)}</h2>
          <p>Рекомендованный старт: <b>раздел ${recommendation?.id || 1}. ${A.escape(recommendation?.title || A.units[0].title)}</b>. Предыдущие темы тоже остаются доступными.</p>
        </div>
        <button id="goRecommended" class="primary-button">Перейти к разделу</button>
      </section>` : ''}

      <div class="placement-mode-grid">
        <article class="placement-mode-card featured">
          <div class="mode-icon">⚡</div><span>Для большинства</span><h2>Быстрый тест</h2>
          <p>Адаптивные 6–10 вопросов. Сложность меняется после каждого ответа.</p>
          <ul><li>около 3 минут</li><li>лексика и базовая грамматика</li><li>быстро открывает стартовую точку</li></ul>
          <button class="primary-button" data-placement-mode="quick">Начать быстрый</button>
        </article>
        <article class="placement-mode-card">
          <div class="mode-icon">🎯</div><span>Точнее</span><h2>Полный тест</h2>
          <p>24 задания по словам, грамматике, чтению и аудированию.</p>
          <ul><li>10–15 минут</li><li>более точная граница уровня</li><li>подробный результат</li></ul>
          <button class="secondary-button" data-placement-mode="full">Начать полный</button>
        </article>
      </div>

      <div class="placement-note"><b>Совсем новичок?</b><p>Пропусти тест и спокойно начни с алфавита. Первые ошибки не отнимают сердца.</p><button id="startFromZero" class="section-link">Начать с нуля →</button></div>`;

    document.querySelectorAll('[data-placement-mode]').forEach(button => {
      button.onclick = () => A.startPlacement(button.dataset.placementMode);
    });
    document.getElementById('startFromZero').onclick = () => A.startLesson(1, 1);
    document.getElementById('goRecommended')?.addEventListener('click', () => {
      A.switchScreen('learn');
      setTimeout(() => document.querySelector(`[data-unit-card="${A.state.preferredStartUnit}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80);
    });
  };

  A.renderReview = () => {
    const due = A.dueWords();
    const learned = A.learnedWords();
    const average = learned.length
      ? Math.round(learned.reduce((sum, word) => sum + (A.state.srs[word.id].level || 0), 0) / learned.length * 20)
      : 0;
    document.getElementById('screen-review').innerHTML = `
      <div class="page-head"><h1>Повторение</h1><p>Слова возвращаются в нужный момент по интервальному алгоритму.</p></div>
      <div class="review-summary">
        <div class="review-main"><div class="eyebrow">На сегодня</div><div class="review-count">${due.length}</div>
          <h2>${due.length ? A.plural(due.length, 'слово ждёт', 'слова ждут', 'слов ждут') : 'Всё повторено'}</h2>
          <p>${due.length ? 'В учебном повторении подсказки остаются доступными.' : 'Здесь появятся слова после прохождения уроков.'}</p>
          <button class="primary-button" id="startReview" ${due.length ? '' : 'disabled'}>${due.length ? 'Повторить сейчас' : 'Пока нечего повторять'}</button>
        </div>
        <div class="review-side"><div class="metric-card"><span>Изучено слов</span><b>${learned.length}</b></div><div class="metric-card"><span>Среднее освоение</span><b>${average}%</b></div><div class="metric-card"><span>Точность</span><b>${A.state.totalAnswers ? Math.round(A.state.totalCorrect / A.state.totalAnswers * 100) : 0}%</b></div></div>
      </div>`;
    if (due.length) document.getElementById('startReview').onclick = () => A.startReview(due);
  };

  A.renderWords = () => {
    const categories = ['Все', ...new Set(A.words.map(word => word.cat))];
    document.getElementById('screen-words').innerHTML = `
      <div class="page-head"><div class="eyebrow">${A.words.length} слов и выражений уровня A1</div><h1>Словарь</h1><p>Произношение, контекст и прогресс запоминания.</p></div>
      <div class="word-tools"><input id="wordSearch" class="search-input" placeholder="Найти слово или перевод"><select id="wordCategory" class="select-input">${categories.map(category => `<option>${A.escape(category)}</option>`).join('')}</select></div>
      <div id="wordList" class="word-list"></div>`;
    const search = document.getElementById('wordSearch');
    const category = document.getElementById('wordCategory');
    const draw = () => {
      const query = search.value.trim().toLowerCase();
      const selected = category.value;
      const list = A.words.filter(word => (selected === 'Все' || word.cat === selected) && (!query || `${word.sr} ${word.cyr} ${word.ru}`.toLowerCase().includes(query)));
      document.getElementById('wordList').innerHTML = list.length ? list.map(word => {
        const srs = A.state.srs[word.id];
        const mastery = srs ? A.clamp((srs.level || 0) * 20, 5, 100) : 0;
        const example = A.exampleFor(word);
        return `<article class="word-card"><div><div><span class="word-sr">${A.escape(word.sr)}</span><span class="word-cyr">${A.escape(word.cyr)}</span></div><div class="word-ru">${A.escape(word.ru)}</div><div class="word-meta">${example ? `${A.escape(example.sr)} · ${A.escape(example.ru)}` : A.escape(word.cat)} · ${srs ? `уровень ${srs.level}` : 'ещё не изучено'}</div><div class="mastery"><span style="width:${mastery}%"></span></div></div><button class="tiny-button" data-speak="${A.escapeAttr(word.sr)}">🔊</button></article>`;
      }).join('') : '<div class="empty-card">Ничего не найдено</div>';
      document.querySelectorAll('[data-speak]').forEach(button => button.onclick = () => A.speak(button.dataset.speak));
    };
    search.oninput = draw;
    category.onchange = draw;
    draw();
  };

  A.renderProfile = () => {
    const accuracy = A.state.totalAnswers ? Math.round(A.state.totalCorrect / A.state.totalAnswers * 100) : 0;
    const voices = A.rankVoices();
    const selected = A.selectedVoice();
    const currentPack = A.voicePacks[A.state.voicePack] || A.voicePacks.system;
    document.getElementById('screen-profile').innerHTML = `
      <div class="page-head"><h1>Профиль</h1><p>Настройки курса, голоса и статистика.</p></div>
      <div class="profile-grid">
        <section class="profile-card"><div class="profile-main"><div class="profile-avatar" id="profileAvatar"></div><div><h2>${A.escape(A.state.name)}</h2><p>Сербский · ${A.escape(A.state.placementCompleted ? A.state.placementLevel : 'уровень не определён')}</p></div></div><div class="stats-grid"><div class="stat-box"><span>Всего XP</span><b>${A.state.xp}</b></div><div class="stat-box"><span>Серия</span><b>${A.state.streak} 🔥</b></div><div class="stat-box"><span>Уроков</span><b>${A.state.completedLessons.length}</b></div><div class="stat-box"><span>Точность</span><b>${accuracy}%</b></div></div><button id="profilePlacement" class="secondary-button">${A.state.placementCompleted ? 'Пересдать тест' : 'Определить уровень'}</button></section>
        <section class="profile-card"><h3 style="margin-top:0">Настройки</h3>
          <div class="setting-row"><div><label>Озвучка</label><small>Слова, диалоги и аудирование</small></div><button id="soundToggle" class="toggle ${A.state.sound ? 'on' : ''}"></button></div>
          <div class="setting-block"><label>Голос курса</label><small>Готовые MP3 одинаково звучат на всех устройствах</small><div class="voice-pack-picker">${Object.entries(A.voicePacks).map(([id, pack]) => `<button class="voice-pack-card ${A.state.voicePack === id ? 'active' : ''}" data-voice-pack="${id}"><span class="voice-pack-icon">${pack.icon}</span><span><b>${pack.label}</b><small>${pack.description}</small></span><i>${A.state.voicePack === id ? '✓' : ''}</i></button>`).join('')}</div><div class="voice-pack-status"><span>Сейчас: <b>${A.escape(currentPack.label)}</b></span><button id="testVoicePack" class="tiny-button">▶ Проверить</button></div></div>
          <div class="setting-block system-voice-block"><label for="voiceSelect">Резервный системный голос</label><small>Используется только если для новой реплики ещё нет MP3</small><div class="voice-picker-row"><select id="voiceSelect" class="select-input voice-select"><option value="">Автоматически: ${A.escape(selected?.name || 'лучший доступный')}</option>${voices.map(voice => `<option value="${A.escapeAttr(voice.voiceURI)}" ${A.state.voiceURI === voice.voiceURI ? 'selected' : ''}>${A.escape(voice.name)} — ${A.escape(voice.lang)}</option>`).join('')}</select><button id="testSystemVoice" class="tiny-button">▶</button></div></div>
          <div class="setting-block"><label>Темп произношения</label><div class="voice-style-picker">${Object.entries(A.voiceStyles).map(([id, config]) => `<button class="goal-chip ${A.state.voiceStyle === id ? 'active' : ''}" data-voice-style="${id}">${config.label}</button>`).join('')}</div></div>
          <div class="setting-row"><div><label>Письмо</label><small>${A.state.script === 'latin' ? 'Латиница: zdravo' : 'Кириллица: здраво'}</small></div><button id="scriptToggle" class="toggle ${A.state.script === 'cyrillic' ? 'on' : ''}"></button></div>
          <div class="setting-row" style="display:block"><div><label>Дневная цель</label></div><div class="goal-picker">${[10,20,30,50].map(goal => `<button class="goal-chip ${A.state.dailyGoal === goal ? 'active' : ''}" data-goal="${goal}">${goal} XP</button>`).join('')}</div></div>
          <div style="margin-top:17px"><button id="resetProgress" class="secondary-button">Сбросить прогресс</button></div>
        </section>
      </div>`;
    A.setCharacter(document.getElementById('profileAvatar'), 0);
    document.getElementById('profilePlacement').onclick = () => A.switchScreen('placement');
    document.getElementById('soundToggle').onclick = () => { A.state.sound = !A.state.sound; A.saveState(); A.renderProfile(); A.showToast(A.state.sound ? 'Озвучка включена' : 'Озвучка выключена'); };
    document.querySelectorAll('[data-voice-pack]').forEach(button => {
      button.onclick = () => { A.state.voicePack = button.dataset.voicePack; A.audioFallbackNotified = false; A.saveState(); A.renderProfile(); setTimeout(() => A.speak('Dobar dan! Kako ste?'), 80); };
    });
    document.getElementById('testVoicePack').onclick = () => A.speak('Dobar dan! Kako ste?');
    document.getElementById('voiceSelect').onchange = event => { A.state.voiceURI = event.target.value; A.saveState(); A.showToast('Резервный голос сохранён'); };
    document.getElementById('testSystemVoice').onclick = () => { const old = A.state.voicePack; A.state.voicePack = 'system'; A.speak('Dobar dan! Kako ste?'); A.state.voicePack = old; };
    document.querySelectorAll('[data-voice-style]').forEach(button => {
      button.onclick = () => { A.state.voiceStyle = button.dataset.voiceStyle; A.saveState(); A.renderProfile(); setTimeout(() => A.speak('Račun, molim.'), 80); };
    });
    document.getElementById('scriptToggle').onclick = () => { A.state.script = A.state.script === 'latin' ? 'cyrillic' : 'latin'; A.saveState(); A.renderAll(); A.showToast(A.state.script === 'latin' ? 'Включена латиница' : 'Включена кириллица'); };
    document.querySelectorAll('[data-goal]').forEach(button => button.onclick = () => { A.state.dailyGoal = Number(button.dataset.goal); A.saveState(); A.renderAll(); });
    document.getElementById('resetProgress').onclick = () => {
      if (!confirm('Сбросить весь прогресс курса и результат теста?')) return;
      A.state = { ...A.defaultState, voiceURI: A.state.voiceURI, voiceStyle: A.state.voiceStyle, voicePack: A.state.voicePack, dailyDate: A.TODAY() };
      A.saveState();
      A.renderAll();
      A.showToast('Прогресс сброшен');
    };
  };

  A.switchScreen = name => {
    A.currentScreen = name;
    A.closeWordTooltip();
    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
    document.getElementById(`screen-${name}`).classList.add('active');
    document.querySelectorAll('[data-screen-link]').forEach(button => button.classList.toggle('active', button.dataset.screenLink === name));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
})();
