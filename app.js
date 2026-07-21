(() => {
  'use strict';

  const STORAGE_KEY = 'cao-serbian-v1';
  const TODAY = () => { const d = new Date(); const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const day=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${day}`; };

  const palette = ['#a7f432', '#a98cff', '#62c7ff', '#ffad42', '#ff7f9b', '#72e6c1'];
  const phrases = [
    { sr: 'Kako si?', cyr: 'Како си?', ru: 'Как ты?' },
    { sr: 'Vidimo se!', cyr: 'Видимо се!', ru: 'Увидимся!' },
    { sr: 'Nema problema.', cyr: 'Нема проблема.', ru: 'Нет проблем.' },
    { sr: 'Jednu kafu, molim.', cyr: 'Једну кафу, молим.', ru: 'Один кофе, пожалуйста.' },
    { sr: 'Koliko košta?', cyr: 'Колико кошта?', ru: 'Сколько стоит?' },
    { sr: 'Gde je stanica?', cyr: 'Где је станица?', ru: 'Где остановка?' }
  ];

  const words = [
    { id:'zdravo', sr:'zdravo', cyr:'здраво', ru:'привет', cat:'Основы', example:'Zdravo! Kako si?' },
    { id:'cao', sr:'ćao', cyr:'ћао', ru:'привет / пока', cat:'Основы', example:'Ćao, vidimo se sutra!' },
    { id:'hvala', sr:'hvala', cyr:'хвала', ru:'спасибо', cat:'Основы', example:'Hvala puno!' },
    { id:'molim', sr:'molim', cyr:'молим', ru:'пожалуйста', cat:'Основы', example:'Jednu vodu, molim.' },
    { id:'da', sr:'da', cyr:'да', ru:'да', cat:'Основы', example:'Da, razumem.' },
    { id:'ne', sr:'ne', cyr:'не', ru:'нет', cat:'Основы', example:'Ne, hvala.' },
    { id:'dobro', sr:'dobro', cyr:'добро', ru:'хорошо', cat:'Основы', example:'Sve je dobro.' },
    { id:'izvini', sr:'izvini', cyr:'извини', ru:'извини', cat:'Основы', example:'Izvini, gde je centar?' },
    { id:'ja', sr:'ja', cyr:'ја', ru:'я', cat:'Знакомство', example:'Ja sam Ivan.' },
    { id:'ti', sr:'ti', cyr:'ти', ru:'ты', cat:'Знакомство', example:'Kako se ti zoveš?' },
    { id:'sam', sr:'sam', cyr:'сам', ru:'есть / являюсь', cat:'Знакомство', example:'Ja sam iz Rusije.' },
    { id:'ime', sr:'ime', cyr:'име', ru:'имя', cat:'Знакомство', example:'Moje ime je Ana.' },
    { id:'zovem', sr:'zovem se', cyr:'зовем се', ru:'меня зовут', cat:'Знакомство', example:'Zovem se Marko.' },
    { id:'odakle', sr:'odakle', cyr:'одакле', ru:'откуда', cat:'Знакомство', example:'Odakle si?' },
    { id:'rusija', sr:'Rusija', cyr:'Русија', ru:'Россия', cat:'Знакомство', example:'Ja sam iz Rusije.' },
    { id:'srbija', sr:'Srbija', cyr:'Србија', ru:'Сербия', cat:'Знакомство', example:'Živim u Srbiji.' },
    { id:'kafa', sr:'kafa', cyr:'кафа', ru:'кофе', cat:'Кафе', example:'Jednu kafu, molim.' },
    { id:'voda', sr:'voda', cyr:'вода', ru:'вода', cat:'Кафе', example:'Voda bez gasa.' },
    { id:'racun', sr:'račun', cyr:'рачун', ru:'счёт', cat:'Кафе', example:'Račun, molim.' },
    { id:'jedan', sr:'jedan', cyr:'један', ru:'один', cat:'Кафе', example:'Jedan čaj.' },
    { id:'bez', sr:'bez', cyr:'без', ru:'без', cat:'Кафе', example:'Kafa bez šećera.' },
    { id:'secer', sr:'šećer', cyr:'шећер', ru:'сахар', cat:'Кафе', example:'Bez šećera, molim.' },
    { id:'koliko', sr:'koliko', cyr:'колико', ru:'сколько', cat:'Город', example:'Koliko košta karta?' },
    { id:'kosta', sr:'košta', cyr:'кошта', ru:'стоит', cat:'Город', example:'Koliko ovo košta?' },
    { id:'gde', sr:'gde', cyr:'где', ru:'где', cat:'Город', example:'Gde je banka?' },
    { id:'stanica', sr:'stanica', cyr:'станица', ru:'остановка / станция', cat:'Город', example:'Autobuska stanica je blizu.' },
    { id:'levo', sr:'levo', cyr:'лево', ru:'налево', cat:'Город', example:'Skrenite levo.' },
    { id:'desno', sr:'desno', cyr:'десно', ru:'направо', cat:'Город', example:'Onda desno.' },
    { id:'pravo', sr:'pravo', cyr:'право', ru:'прямо', cat:'Город', example:'Idite pravo.' },
    { id:'blizu', sr:'blizu', cyr:'близу', ru:'близко', cat:'Город', example:'Centar je blizu.' },
    { id:'danas', sr:'danas', cyr:'данас', ru:'сегодня', cat:'Время', example:'Danas radim.' },
    { id:'sutra', sr:'sutra', cyr:'сутра', ru:'завтра', cat:'Время', example:'Vidimo se sutra.' },
    { id:'juce', sr:'juče', cyr:'јуче', ru:'вчера', cat:'Время', example:'Juče sam bio kod kuće.' },
    { id:'sada', sr:'sada', cyr:'сада', ru:'сейчас', cat:'Время', example:'Ne mogu sada.' },
    { id:'jutro', sr:'jutro', cyr:'јутро', ru:'утро', cat:'Время', example:'Dobro jutro!' },
    { id:'vece', sr:'veče', cyr:'вече', ru:'вечер', cat:'Время', example:'Dobro veče!' }
  ];

  const units = [
    { id:1, title:'Первые слова', subtitle:'Приветствия и вежливые фразы', icon:'👋', color:'#a7f432', lessons:3, wordIds:['zdravo','cao','hvala','molim','da','ne','dobro','izvini'] },
    { id:2, title:'Знакомство', subtitle:'Имя, страна и простые вопросы', icon:'🙂', color:'#a98cff', lessons:3, wordIds:['ja','ti','sam','ime','zovem','odakle','rusija','srbija'] },
    { id:3, title:'В кафе', subtitle:'Заказ, напитки и счёт', icon:'☕', color:'#ffad42', lessons:3, wordIds:['kafa','voda','racun','jedan','bez','secer'] },
    { id:4, title:'В городе', subtitle:'Цены, направления и транспорт', icon:'🚌', color:'#62c7ff', lessons:3, wordIds:['koliko','kosta','gde','stanica','levo','desno','pravo','blizu'] },
    { id:5, title:'Время и планы', subtitle:'Сегодня, завтра и расписание', icon:'🕒', color:'#ff7f9b', lessons:3, wordIds:['danas','sutra','juce','sada','jutro','vece'] },
    { id:6, title:'Мини-диалоги', subtitle:'Собираем всё вместе', icon:'💬', color:'#72e6c1', lessons:3, wordIds:['zdravo','zovem','kafa','gde','sutra','hvala'] }
  ];

  const dialogues = [
    ['Zdravo!', 'Привет!'], ['Kako se zoveš?', 'Как тебя зовут?'], ['Zovem se Mila.', 'Меня зовут Мила.'],
    ['Odakle si?', 'Откуда ты?'], ['Ja sam iz Rusije.', 'Я из России.'], ['Drago mi je.', 'Приятно познакомиться.'],
    ['Jednu kafu, molim.', 'Один кофе, пожалуйста.'], ['Sa šećerom?', 'С сахаром?'], ['Ne, bez šećera.', 'Нет, без сахара.'],
    ['Gde je autobuska stanica?', 'Где автобусная остановка?'], ['Idite pravo pa levo.', 'Идите прямо, затем налево.'],
    ['Vidimo se sutra!', 'Увидимся завтра!'], ['Važi, ćao!', 'Договорились, пока!']
  ];

  const defaultState = {
    xp: 0,
    dailyXp: 0,
    dailyGoal: 20,
    streak: 0,
    lastActive: null,
    hearts: 5,
    completedLessons: [],
    srs: {},
    sound: true,
    script: 'latin',
    name: 'Иван',
    totalCorrect: 0,
    totalAnswers: 0
  };

  let state = loadState();
  let currentScreen = 'learn';
  let lesson = null;
  let toastTimer = null;

  function loadState(){
    try{
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      const merged = { ...defaultState, ...saved, srs: { ...defaultState.srs, ...(saved.srs || {}) } };
      if (saved.dailyDate !== TODAY()) merged.dailyXp = 0;
      merged.dailyDate = TODAY();
      return merged;
    } catch { return { ...defaultState, dailyDate:TODAY() }; }
  }

  function saveState(){
    state.dailyDate = TODAY();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* private/embedded mode */ }
  }

  function updateStreak(){
    const today = new Date(TODAY());
    if (!state.lastActive) {
      state.streak = 1;
    } else {
      const prev = new Date(state.lastActive);
      const diff = Math.round((today - prev) / 86400000);
      if (diff === 1) state.streak += 1;
      else if (diff > 1) state.streak = 1;
    }
    state.lastActive = TODAY();
  }

  function randomFrom(arr){ return arr[Math.floor(Math.random() * arr.length)]; }
  function shuffle(arr){ return [...arr].sort(() => Math.random() - .5); }
  function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }
  function wordById(id){ return words.find(w => w.id === id); }
  function displayWord(w){ return state.script === 'cyrillic' ? w.cyr : w.sr; }

  function characterSVG(seed = 1, mood = 'happy'){
    const color = palette[Math.abs(seed) % palette.length];
    const accent = palette[(Math.abs(seed)+2) % palette.length];
    const type = Math.abs(seed) % 4;
    const eyes = mood === 'wow' ? '<circle cx="42" cy="58" r="6"/><circle cx="78" cy="58" r="6"/>' : mood === 'sad' ? '<path d="M34 60q8-8 16 0" fill="none" stroke="#12141b" stroke-width="5" stroke-linecap="round"/><path d="M70 60q8-8 16 0" fill="none" stroke="#12141b" stroke-width="5" stroke-linecap="round"/>' : '<circle cx="42" cy="58" r="4.8"/><circle cx="78" cy="58" r="4.8"/>';
    const mouth = mood === 'sad' ? '<path d="M48 82q12-12 24 0" fill="none" stroke="#12141b" stroke-width="5" stroke-linecap="round"/>' : mood === 'wow' ? '<ellipse cx="60" cy="79" rx="8" ry="11" fill="#12141b"/>' : '<path d="M47 78q13 13 26 0" fill="none" stroke="#12141b" stroke-width="5" stroke-linecap="round"/>';
    const accessory = type === 0 ? `<path d="M34 28q26-23 52 0" fill="${accent}"/><circle cx="37" cy="28" r="9" fill="${accent}"/>` : type === 1 ? `<path d="M34 24l10-20 9 22M69 25L80 4l7 22" fill="${color}" stroke="#12141b" stroke-width="4" stroke-linejoin="round"/>` : type === 2 ? `<rect x="24" y="20" width="72" height="17" rx="8" fill="${accent}"/><rect x="35" y="8" width="50" height="19" rx="9" fill="${accent}"/>` : `<path d="M26 36q6-30 34-28 29 2 34 30-15-10-34-8-19-2-34 6z" fill="${accent}"/>`;
    return `<svg class="character-svg" viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="60" cy="131" rx="42" ry="7" fill="rgba(0,0,0,.18)"/>
      <path d="M28 95q4-22 32-22t32 22v33H28z" fill="${accent}"/>
      <path d="M31 104l-16 17M89 104l16 17" stroke="${accent}" stroke-width="15" stroke-linecap="round"/>
      <path d="M44 124l-4 10M76 124l4 10" stroke="#d8bd9d" stroke-width="14" stroke-linecap="round"/>
      <rect x="27" y="25" width="66" height="68" rx="28" fill="#e7c6a3"/>
      ${accessory}
      ${eyes}
      <path d="M59 63l-3 8h7" fill="none" stroke="#b58d6d" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      ${mouth}
      <circle cx="30" cy="70" r="7" fill="#ef9b9d" opacity=".45"/><circle cx="90" cy="70" r="7" fill="#ef9b9d" opacity=".45"/>
    </svg>`;
  }

  function setCharacter(el, seed, mood='happy'){ if(el) el.innerHTML = characterSVG(seed,mood); }

  function speak(text){
    if (!state.sound || !('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'sr-RS';
    u.rate = .82;
    const voices = speechSynthesis.getVoices();
    u.voice = voices.find(v => /sr|serb/i.test(v.lang + v.name)) || null;
    speechSynthesis.speak(u);
  }

  function showToast(message){
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2300);
  }

  function renderAll(){
    renderLearn(); renderReview(); renderWords(); renderProfile(); renderGlobal();
  }

  function renderGlobal(){
    document.getElementById('streakTop').textContent = state.streak;
    document.getElementById('xpTop').textContent = state.dailyXp;
    document.getElementById('heartsTop').textContent = state.hearts;
    document.getElementById('dailyXpSide').textContent = state.dailyXp;
    document.getElementById('dailyGoalSide').textContent = state.dailyGoal;
    document.getElementById('dailyGoalLabel').textContent = `${state.dailyGoal} XP`;
    const pct = clamp(Math.round((state.dailyXp/state.dailyGoal)*100),0,100);
    document.getElementById('goalPercent').textContent = `${pct}%`;
    document.getElementById('goalRingValue').style.strokeDashoffset = 301.59 * (1-pct/100);
    document.getElementById('dailyMotivation').textContent = pct >= 100 ? 'Цель выполнена. Можно идти дальше!' : pct >= 50 ? 'Уже больше половины. Хороший темп.' : 'Один короткий урок — и ты ближе к цели.';
    const due = dueWords().length;
    const badge = document.getElementById('reviewBadge');
    badge.textContent = due;
    badge.classList.toggle('hidden', due === 0);
    setCharacter(document.getElementById('sidebarCharacter'), 8);
  }

  function renderPhrase(){
    const phrase = phrases[new Date().getDate() % phrases.length];
    document.getElementById('phraseSr').textContent = state.script === 'cyrillic' ? phrase.cyr : phrase.sr;
    document.getElementById('phraseRu').textContent = phrase.ru;
    document.getElementById('phraseSpeak').onclick = () => speak(phrase.sr);
    setCharacter(document.getElementById('phraseCharacter'), new Date().getDate()+3, 'wow');
  }

  function getUnitCompleted(unit){ return state.completedLessons.filter(x => x.startsWith(`${unit.id}-`)).length; }
  function isUnitUnlocked(unit){ return unit.id === 1 || getUnitCompleted(units[unit.id-2]) >= units[unit.id-2].lessons; }

  function renderLearn(){
    const firstIncomplete = units.find(u => isUnitUnlocked(u) && getUnitCompleted(u) < u.lessons);
    const completedTotal = state.completedLessons.length;
    const courseComplete = !firstIncomplete;
    document.getElementById('screen-learn').innerHTML = `
      <div class="hero">
        <div class="hero-copy">
          <div class="eyebrow">Сербский с нуля</div>
          <h1>${courseComplete ? 'Svaka čast!' : (completedTotal ? 'Nastavljamo?' : 'Počnimo?')}<br><span style="color:var(--accent)">${courseComplete ? 'Курс пройден!' : (completedTotal ? 'Продолжим?' : 'Начнём?')}</span></h1>
          <p>${courseComplete ? 'Все основные уроки завершены. Теперь закрепляй лексику в умном повторении.' : (completedTotal ? `Ты прошёл ${completedTotal} ${plural(completedTotal,'урок','урока','уроков')}. Следующий займёт около трёх минут.` : 'Короткие игровые уроки, живые фразы и умное повторение слов — без скучных таблиц.')}</p>
          <button class="primary-button" id="heroStart">${courseComplete ? 'Перейти к повторению' : (completedTotal ? 'Продолжить урок' : 'Начать первый урок')}</button>
        </div>
        <div class="hero-character" id="heroCharacter"></div>
      </div>
      <div class="section-head"><div><h2>Маршрут обучения</h2><p>От первых слов до бытовых диалогов</p></div><button class="section-link" data-screen-jump="words">Открыть словарь</button></div>
      <div class="unit-list">
        ${units.map(unit => {
          const done = getUnitCompleted(unit); const unlocked = isUnitUnlocked(unit); const pct = Math.round(done/unit.lessons*100);
          return `<article class="unit-card ${unlocked?'':'locked'}">
            <div class="unit-icon" style="background:${unit.color}">${unit.icon}</div>
            <div class="unit-copy"><h3>Раздел ${unit.id}. ${unit.title}</h3><p>${unit.subtitle}</p><div class="unit-progress"><div class="progress-track"><span style="width:${pct}%"></span></div><small>${done}/${unit.lessons}</small></div></div>
            <div class="lesson-dots">${Array.from({length:unit.lessons},(_,i)=>{
              const key=`${unit.id}-${i+1}`; const completed=state.completedLessons.includes(key); const current=!completed && i===done;
              return `<button class="lesson-dot ${completed?'completed':''} ${current?'current':''}" data-unit="${unit.id}" data-lesson="${i+1}" ${(!unlocked || i>done)?'disabled':''}>${completed?'✓':i+1}</button>`
            }).join('')}</div>
          </article>`
        }).join('')}
      </div>`;
    setCharacter(document.getElementById('heroCharacter'), 4 + state.completedLessons.length, 'happy');
    document.getElementById('heroStart').onclick = () => courseComplete ? switchScreen('review') : startLesson(firstIncomplete.id, getUnitCompleted(firstIncomplete)+1);
    document.querySelectorAll('.lesson-dot:not(:disabled)').forEach(btn => btn.onclick=()=>startLesson(+btn.dataset.unit,+btn.dataset.lesson));
    document.querySelectorAll('[data-screen-jump]').forEach(b=>b.onclick=()=>switchScreen(b.dataset.screenJump));
    renderPhrase();
  }

  function dueWords(){
    const now = Date.now();
    return words.filter(w => state.srs[w.id] && state.srs[w.id].due <= now);
  }

  function learnedWords(){ return words.filter(w => state.srs[w.id]); }

  function renderReview(){
    const due = dueWords(); const learned = learnedWords(); const avg = learned.length ? Math.round(learned.reduce((s,w)=>s+(state.srs[w.id].level||0),0)/learned.length*20) : 0;
    document.getElementById('screen-review').innerHTML = `
      <div class="page-head"><h1>Повторение</h1><p>Слова возвращаются именно тогда, когда их пора освежить.</p></div>
      <div class="review-summary">
        <div class="review-main"><div class="eyebrow">На сегодня</div><div class="review-count">${due.length}</div><h2>${due.length ? plural(due.length,'слово ждёт','слова ждут','слов ждут') : 'Всё повторено'}</h2><p>${due.length ? 'Короткая сессия укрепит слова, которые начинают забываться.' : 'Новые слова появятся здесь после уроков или когда подойдёт срок следующего повторения.'}</p><button class="primary-button" id="startReview" ${due.length?'':'disabled'}>${due.length?'Повторить сейчас':'Пока нечего повторять'}</button></div>
        <div class="review-side"><div class="metric-card"><span>Изучено слов</span><b>${learned.length}</b></div><div class="metric-card"><span>Среднее освоение</span><b>${avg}%</b></div><div class="metric-card"><span>Точность ответов</span><b>${state.totalAnswers?Math.round(state.totalCorrect/state.totalAnswers*100):0}%</b></div></div>
      </div>`;
    const btn = document.getElementById('startReview'); if(due.length) btn.onclick=()=>startReview(due);
  }

  function renderWords(){
    const cats = ['Все',...new Set(words.map(w=>w.cat))];
    document.getElementById('screen-words').innerHTML = `
      <div class="page-head"><h1>Словарь</h1><p>Все слова курса, примеры и прогресс запоминания.</p></div>
      <div class="word-tools"><input id="wordSearch" class="search-input" placeholder="Найти слово или перевод"><select id="wordCategory" class="select-input">${cats.map(c=>`<option>${c}</option>`).join('')}</select></div>
      <div id="wordList" class="word-list"></div>`;
    const search = document.getElementById('wordSearch'); const category = document.getElementById('wordCategory');
    const draw = () => {
      const q=search.value.trim().toLowerCase(); const cat=category.value;
      const list=words.filter(w=>(cat==='Все'||w.cat===cat)&&(!q||`${w.sr} ${w.cyr} ${w.ru}`.toLowerCase().includes(q)));
      document.getElementById('wordList').innerHTML = list.length ? list.map(w=>{
        const s=state.srs[w.id]; const mastery=s?clamp((s.level||0)*20,5,100):0;
        return `<article class="word-card"><div><div><span class="word-sr">${w.sr}</span><span class="word-cyr">${w.cyr}</span></div><div class="word-ru">${w.ru}</div><div class="word-meta">${w.example} · ${s?`уровень ${s.level}`:'ещё не изучено'}</div><div class="mastery"><span style="width:${mastery}%"></span></div></div><button class="tiny-button" data-speak="${w.sr}" aria-label="Озвучить">🔊</button></article>`;
      }).join('') : `<div class="empty-card">Ничего не найдено</div>`;
      document.querySelectorAll('[data-speak]').forEach(b=>b.onclick=()=>speak(b.dataset.speak));
    };
    search.oninput=draw; category.onchange=draw; draw();
  }

  function renderProfile(){
    const accuracy=state.totalAnswers?Math.round(state.totalCorrect/state.totalAnswers*100):0;
    document.getElementById('screen-profile').innerHTML=`
      <div class="page-head"><h1>Профиль</h1><p>Настройки курса и статистика обучения.</p></div>
      <div class="profile-grid">
        <section class="profile-card"><div class="profile-main"><div class="profile-avatar" id="profileAvatar"></div><div><h2>${state.name}</h2><p>Изучает сербский · уровень новичок</p></div></div><div class="stats-grid"><div class="stat-box"><span>Всего XP</span><b>${state.xp}</b></div><div class="stat-box"><span>Серия</span><b>${state.streak} 🔥</b></div><div class="stat-box"><span>Уроков</span><b>${state.completedLessons.length}</b></div><div class="stat-box"><span>Точность</span><b>${accuracy}%</b></div></div></section>
        <section class="profile-card"><h3 style="margin-top:0">Настройки</h3>
          <div class="setting-row"><div><label>Озвучка</label><small>Сербское произношение в заданиях</small></div><button id="soundToggle" class="toggle ${state.sound?'on':''}" aria-label="Переключить озвучку"></button></div>
          <div class="setting-row"><div><label>Письмо</label><small>${state.script==='latin'?'Латиница: zdravo':'Кириллица: здраво'}</small></div><button id="scriptToggle" class="toggle ${state.script==='cyrillic'?'on':''}" aria-label="Переключить письмо"></button></div>
          <div class="setting-row" style="display:block"><div><label>Дневная цель</label><small>Сколько XP хочешь набирать ежедневно</small></div><div class="goal-picker">${[10,20,30,50].map(g=>`<button class="goal-chip ${state.dailyGoal===g?'active':''}" data-goal="${g}">${g} XP</button>`).join('')}</div></div>
          <div style="margin-top:17px"><button id="resetProgress" class="secondary-button">Сбросить прогресс</button></div>
        </section>
      </div>`;
    setCharacter(document.getElementById('profileAvatar'), 11);
    document.getElementById('soundToggle').onclick=()=>{state.sound=!state.sound;saveState();renderAll();showToast(state.sound?'Озвучка включена':'Озвучка выключена')};
    document.getElementById('scriptToggle').onclick=()=>{state.script=state.script==='latin'?'cyrillic':'latin';saveState();renderAll();showToast(state.script==='latin'?'Включена латиница':'Включена кириллица')};
    document.querySelectorAll('[data-goal]').forEach(b=>b.onclick=()=>{state.dailyGoal=+b.dataset.goal;saveState();renderAll();showToast(`Дневная цель: ${state.dailyGoal} XP`)});
    document.getElementById('resetProgress').onclick=()=>{ if(confirm('Сбросить весь прогресс курса?')){state={...defaultState,dailyDate:TODAY()};saveState();renderAll();showToast('Прогресс сброшен')}};
  }

  function switchScreen(name){
    currentScreen=name;
    document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
    document.getElementById(`screen-${name}`).classList.add('active');
    document.querySelectorAll('[data-screen-link]').forEach(b=>b.classList.toggle('active',b.dataset.screenLink===name));
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function buildLessonQuestions(unit, lessonNum){
    const ids = unit.wordIds;
    const selection = shuffle(ids).slice(0, Math.min(6, ids.length)).map(wordById);
    const questions=[];
    selection.forEach((w,i)=>{
      const distractors=shuffle(words.filter(x=>x.id!==w.id)).slice(0,3);
      const type=(i+lessonNum)%4;
      if(type===0) questions.push({type:'choice',word:w,prompt:`Что означает «${displayWord(w)}»?`,answer:w.ru,options:shuffle([w,...distractors]).map(x=>x.ru)});
      else if(type===1) questions.push({type:'reverse',word:w,prompt:`Как будет «${w.ru}»?`,answer:displayWord(w),options:shuffle([w,...distractors]).map(x=>displayWord(x))});
      else if(type===2) questions.push({type:'typing',word:w,prompt:`Напиши по-сербски: «${w.ru}»`,answer:displayWord(w)});
      else questions.push({type:'listen',word:w,prompt:'Что ты услышал?',answer:w.ru,options:shuffle([w,...distractors]).map(x=>x.ru)});
    });
    const d=randomFrom(dialogues);
    questions.splice(3,0,{type:'phrase',prompt:'Собери перевод фразы',serbian:d[0],answer:d[1],tokens:shuffle(d[1].replace(/[.!?]/g,'').split(' '))});
    return questions.slice(0,7);
  }

  function startLesson(unitId, lessonNum){
    if(state.hearts<=0){ state.hearts=5; showToast('Сердца восстановлены для прототипа'); }
    const unit=units.find(u=>u.id===unitId);
    lesson={ mode:'lesson', unitId, lessonNum, title:unit.title, questions:buildLessonQuestions(unit,lessonNum), index:0, correct:0, selected:null, answerLocked:false, startedAt:Date.now(), touchedWords:new Set() };
    openLesson(); renderQuestion();
  }

  function startReview(due){
    const q=shuffle(due).slice(0,10).map((w,i)=>{
      const distractors=shuffle(words.filter(x=>x.id!==w.id)).slice(0,3);
      return i%2 ? {type:'typing',word:w,prompt:`Вспомни слово: «${w.ru}»`,answer:displayWord(w)} : {type:'choice',word:w,prompt:`Что означает «${displayWord(w)}»?`,answer:w.ru,options:shuffle([w,...distractors]).map(x=>x.ru)};
    });
    lesson={mode:'review',title:'Повторение',questions:q,index:0,correct:0,selected:null,answerLocked:false,startedAt:Date.now(),touchedWords:new Set()};
    openLesson();renderQuestion();
  }

  function openLesson(){
    document.getElementById('lessonOverlay').classList.remove('hidden');
    document.body.style.overflow='hidden';
    document.getElementById('lessonHearts').textContent=state.hearts;
  }
  function closeLesson(){
    document.getElementById('lessonOverlay').classList.add('hidden');
    document.getElementById('lessonFeedback').classList.add('hidden');
    document.body.style.overflow=''; lesson=null;
  }

  function renderQuestion(){
    if(!lesson || lesson.index>=lesson.questions.length){ finishLesson(); return; }
    lesson.answerLocked=false; lesson.selected=null;
    document.getElementById('lessonFeedback').classList.add('hidden');
    const q=lesson.questions[lesson.index];
    document.getElementById('lessonProgressBar').style.width=`${lesson.index/lesson.questions.length*100}%`;
    const stage=document.getElementById('lessonStage');
    let body='';
    if(['choice','reverse'].includes(q.type)){
      body=`<div class="question-character-row"><div class="question-character" id="qCharacter"></div><div class="speech-bubble">${q.prompt}</div></div><div class="answer-grid">${q.options.map((o,i)=>`<button class="answer-option" data-answer="${escapeAttr(o)}"><span class="option-index">${i+1}</span>${o}</button>`).join('')}</div>`;
    }else if(q.type==='listen'){
      body=`<div class="question-label">Аудирование</div><h2 class="question-title">${q.prompt}</h2><button class="listen-button" id="listenAgain">🔊</button><div class="answer-grid">${q.options.map((o,i)=>`<button class="answer-option" data-answer="${escapeAttr(o)}"><span class="option-index">${i+1}</span>${o}</button>`).join('')}</div>`;
    }else if(q.type==='typing'){
      body=`<div class="question-character-row"><div class="question-character" id="qCharacter"></div><div class="speech-bubble">${q.prompt}</div></div><input id="textAnswer" class="text-answer" autocomplete="off" autocapitalize="none" placeholder="Введи ответ…"><div class="lesson-actions"><button id="checkText" class="primary-button">Проверить</button></div>`;
    }else if(q.type==='phrase'){
      body=`<div class="question-label">Фраза</div><h2 class="question-title">${q.serbian}</h2><p class="question-subtitle">Собери русский перевод</p><div id="phraseAnswer" class="word-bank"></div><div class="word-bank" style="border-style:solid">${q.tokens.map((t,i)=>`<button class="word-chip" data-token="${escapeAttr(t)}" data-token-index="${i}">${t}</button>`).join('')}</div><div class="lesson-actions"><button id="clearPhrase" class="secondary-button">Очистить</button><button id="checkPhrase" class="primary-button">Проверить</button></div>`;
    }
    stage.innerHTML=body;
    if(document.getElementById('qCharacter')) setCharacter(document.getElementById('qCharacter'),lesson.index+lesson.questions.length,'happy');
    if(q.type==='listen'){ document.getElementById('listenAgain').onclick=()=>speak(q.word.sr); setTimeout(()=>speak(q.word.sr),250); }
    document.querySelectorAll('[data-answer]').forEach(btn=>btn.onclick=()=>selectChoice(btn,q));
    if(q.type==='typing'){
      const input=document.getElementById('textAnswer'); input.focus();
      document.getElementById('checkText').onclick=()=>submitAnswer(input.value,q.answer,q);
      input.onkeydown=e=>{if(e.key==='Enter')submitAnswer(input.value,q.answer,q)};
    }
    if(q.type==='phrase') setupPhrase(q);
  }

  function selectChoice(btn,q){
    if(lesson.answerLocked)return;
    document.querySelectorAll('[data-answer]').forEach(b=>b.classList.remove('selected'));
    btn.classList.add('selected'); lesson.selected=btn.dataset.answer;
    submitAnswer(lesson.selected,q.answer,q,btn);
  }

  function normalize(s){ return String(s).toLowerCase().trim().replace(/[.!?,]/g,'').replace(/\s+/g,' '); }

  function submitAnswer(value,answer,q,button=null){
    if(lesson.answerLocked)return;
    if(!String(value).trim()){showToast('Сначала введи ответ');return;}
    lesson.answerLocked=true;
    const correct=normalize(value)===normalize(answer);
    state.totalAnswers++;
    if(correct){lesson.correct++;state.totalCorrect++;}
    else state.hearts=Math.max(0,state.hearts-1);
    if(q.word){lesson.touchedWords.add(q.word.id);updateSRS(q.word.id,correct);}
    saveState(); document.getElementById('lessonHearts').textContent=state.hearts;
    if(button) button.classList.add(correct?'correct':'wrong');
    showFeedback(correct,answer,q);
  }

  function setupPhrase(q){
    const selected=[]; const answerEl=document.getElementById('phraseAnswer');
    document.querySelectorAll('[data-token]').forEach(btn=>btn.onclick=()=>{ if(lesson.answerLocked)return; btn.classList.add('used'); selected.push({text:btn.dataset.token,index:btn.dataset.tokenIndex}); draw(); });
    function draw(){ answerEl.innerHTML=selected.map((x,i)=>`<button class="word-chip" data-selected-index="${i}">${x.text}</button>`).join(''); answerEl.querySelectorAll('[data-selected-index]').forEach(b=>b.onclick=()=>{const item=selected.splice(+b.dataset.selectedIndex,1)[0];document.querySelector(`[data-token-index="${item.index}"]`).classList.remove('used');draw()}); }
    document.getElementById('clearPhrase').onclick=()=>{selected.splice(0);document.querySelectorAll('[data-token]').forEach(b=>b.classList.remove('used'));draw()};
    document.getElementById('checkPhrase').onclick=()=>submitAnswer(selected.map(x=>x.text).join(' '),q.answer,q);
  }

  function showFeedback(correct,answer,q){
    const box=document.getElementById('lessonFeedback'); box.className=`lesson-feedback ${correct?'feedback-correct':'feedback-wrong'}`;
    box.innerHTML=`<div class="feedback-inner"><div class="feedback-icon">${correct?'✓':'!'}</div><div class="feedback-copy"><b>${correct?randomFrom(['Odlično!','Bravo!','Tačno!']):'Почти получилось'}</b><p>${correct?(q.word?q.word.example:'Продолжаем в том же темпе.'):`Правильный ответ: ${answer}`}</p></div><button id="nextQuestion" class="primary-button">Продолжить</button></div>`;
    box.classList.remove('hidden'); document.getElementById('nextQuestion').onclick=()=>{lesson.index++;renderQuestion()};
  }

  function updateSRS(id,correct){
    const old=state.srs[id]||{level:0,due:0,seen:0,correct:0};
    const level=correct?Math.min(5,old.level+1):Math.max(0,old.level-1);
    const intervals=[0,10*60e3,24*60*60e3,3*24*60*60e3,7*24*60*60e3,21*24*60*60e3];
    state.srs[id]={level,due:Date.now()+intervals[level],seen:old.seen+1,correct:old.correct+(correct?1:0)};
  }

  function finishLesson(){
    const elapsed=Math.max(1,Math.round((Date.now()-lesson.startedAt)/1000));
    const xp=lesson.mode==='review'?Math.max(5,lesson.correct*2):10+lesson.correct;
    state.xp+=xp;state.dailyXp+=xp;updateStreak();
    if(lesson.mode==='lesson'){
      const key=`${lesson.unitId}-${lesson.lessonNum}`;
      if(!state.completedLessons.includes(key))state.completedLessons.push(key);
      const unit=units.find(u=>u.id===lesson.unitId);
      unit.wordIds.forEach(id=>{if(!state.srs[id])state.srs[id]={level:1,due:Date.now()+10*60e3,seen:1,correct:1}});
    }
    saveState(); renderAll();
    document.getElementById('lessonProgressBar').style.width='100%';
    document.getElementById('lessonStage').innerHTML=`<div class="finish-card"><div class="finish-character" id="finishCharacter"></div><div class="eyebrow">Урок завершён</div><h2>Bravo!</h2><p>${lesson.correct===lesson.questions.length?'Без единой ошибки — мощно.':'Главное — ты дошёл до конца и укрепил новые слова.'}</p><div class="finish-stats"><div class="finish-stat"><b>+${xp}</b><span>XP</span></div><div class="finish-stat"><b>${lesson.correct}/${lesson.questions.length}</b><span>верных ответов</span></div><div class="finish-stat"><b>${elapsed} c</b><span>время</span></div></div><button id="finishClose" class="primary-button">Вернуться к курсу</button></div>`;
    setCharacter(document.getElementById('finishCharacter'),18,'wow');
    document.getElementById('finishClose').onclick=()=>{closeLesson();switchScreen('learn')};
  }

  function plural(n,one,few,many){const n10=n%10,n100=n%100;return (n10===1&&n100!==11)?one:(n10>=2&&n10<=4&&(n100<12||n100>14))?few:many}
  function escapeAttr(s){return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;')}

  document.querySelectorAll('[data-screen-link]').forEach(btn=>btn.addEventListener('click',e=>{e.preventDefault();switchScreen(btn.dataset.screenLink)}));
  document.getElementById('closeLesson').onclick=()=>{if(confirm('Выйти из урока? Текущий прогресс урока не сохранится.'))closeLesson()};
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&lesson)document.getElementById('closeLesson').click()});

  renderAll();
})();
