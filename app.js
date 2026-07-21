(() => {
  'use strict';

  const STORAGE_KEY = 'cao-serbian-v2';
  const TODAY = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const characters = [
    { name: 'Milo', file: 'assets/characters/milo.png' },
    { name: 'Tara', file: 'assets/characters/tara.png' },
    { name: 'Mina', file: 'assets/characters/mina.png' },
    { name: 'Laza', file: 'assets/characters/laza.png' },
    { name: 'Boki', file: 'assets/characters/boki.png' }
  ];

  const helperLines = [
    'Не угадывай вслепую — на пунктирное слово можно нажать.',
    'Сначала посмотри подсказку, потом выбери ответ.',
    'Ошибаться нормально: мы только знакомимся со словами.',
    'Тапни на подчёркнутое слово, если оно ещё не запомнилось.',
    'Можно слушать фразу столько раз, сколько нужно.'
  ];

  const alphabetGroups = [
    {
      title: 'Гласные и буква J',
      subtitle: 'Начинаем со звуков, которые читаются почти как в русском.',
      note: 'В сербском почти всегда работает правило: одна буква — один звук.',
      letters: [
        { latin: 'A', cyr: 'А', sound: 'а', example: 'Ana', exampleRu: 'Ана' },
        { latin: 'E', cyr: 'Е', sound: 'э', example: 'Evo', exampleRu: 'вот' },
        { latin: 'I', cyr: 'И', sound: 'и', example: 'ime', exampleRu: 'имя' },
        { latin: 'O', cyr: 'О', sound: 'о', example: 'ovo', exampleRu: 'это' },
        { latin: 'U', cyr: 'У', sound: 'у', example: 'ulica', exampleRu: 'улица' },
        { latin: 'J', cyr: 'Ј', sound: 'й', example: 'ja', exampleRu: 'я' }
      ]
    },
    {
      title: 'Знакомые согласные',
      subtitle: 'Эти буквы звучат привычно и быстро запоминаются.',
      note: 'Смотри на звук, а не на английское чтение латиницы.',
      letters: [
        { latin: 'M', cyr: 'М', sound: 'м', example: 'mama', exampleRu: 'мама' },
        { latin: 'N', cyr: 'Н', sound: 'н', example: 'ne', exampleRu: 'нет' },
        { latin: 'K', cyr: 'К', sound: 'к', example: 'kafa', exampleRu: 'кофе' },
        { latin: 'T', cyr: 'Т', sound: 'т', example: 'ti', exampleRu: 'ты' },
        { latin: 'P', cyr: 'П', sound: 'п', example: 'pas', exampleRu: 'собака' },
        { latin: 'B', cyr: 'Б', sound: 'б', example: 'broj', exampleRu: 'число' }
      ]
    },
    {
      title: 'Ещё шесть простых букв',
      subtitle: 'После этого ты уже сможешь читать много коротких слов.',
      note: 'Буква R произносится чётко, без английского оттенка.',
      letters: [
        { latin: 'V', cyr: 'В', sound: 'в', example: 'voda', exampleRu: 'вода' },
        { latin: 'G', cyr: 'Г', sound: 'г', example: 'grad', exampleRu: 'город' },
        { latin: 'D', cyr: 'Д', sound: 'д', example: 'dan', exampleRu: 'день' },
        { latin: 'Z', cyr: 'З', sound: 'з', example: 'zdravo', exampleRu: 'привет' },
        { latin: 'R', cyr: 'Р', sound: 'р', example: 'račun', exampleRu: 'счёт' },
        { latin: 'L', cyr: 'Л', sound: 'л', example: 'levo', exampleRu: 'налево' }
      ]
    },
    {
      title: 'Особые сербские звуки',
      subtitle: 'Главные буквы с диакритикой — разберём без спешки.',
      note: 'Č звучит твёрже, чем Ć. На старте достаточно просто слышать разницу.',
      letters: [
        { latin: 'Č', cyr: 'Ч', sound: 'ч, твёрдо', example: 'čaj', exampleRu: 'чай' },
        { latin: 'Ć', cyr: 'Ћ', sound: 'ч, мягко', example: 'ćao', exampleRu: 'привет / пока' },
        { latin: 'Š', cyr: 'Ш', sound: 'ш', example: 'šećer', exampleRu: 'сахар' },
        { latin: 'Ž', cyr: 'Ж', sound: 'ж', example: 'žena', exampleRu: 'женщина' },
        { latin: 'Đ', cyr: 'Ђ', sound: 'мягкое дж', example: 'đak', exampleRu: 'ученик' }
      ]
    },
    {
      title: 'Последние буквы и сочетания',
      subtitle: 'Закрываем весь сербский алфавит.',
      note: 'LJ, NJ и DŽ считаются отдельными буквами сербского алфавита.',
      letters: [
        { latin: 'C', cyr: 'Ц', sound: 'ц', example: 'centar', exampleRu: 'центр' },
        { latin: 'S', cyr: 'С', sound: 'с', example: 'sada', exampleRu: 'сейчас' },
        { latin: 'F', cyr: 'Ф', sound: 'ф', example: 'film', exampleRu: 'фильм' },
        { latin: 'H', cyr: 'Х', sound: 'х', example: 'hvala', exampleRu: 'спасибо' },
        { latin: 'LJ', cyr: 'Љ', sound: 'ль', example: 'ljubav', exampleRu: 'любовь' },
        { latin: 'NJ', cyr: 'Њ', sound: 'нь', example: 'njega', exampleRu: 'его' },
        { latin: 'DŽ', cyr: 'Џ', sound: 'дж', example: 'džem', exampleRu: 'джем' }
      ]
    }
  ];

  const words = [
    { id: 'da', sr: 'da', cyr: 'да', ru: 'да', cat: 'Первые слова', icon: '✓', example: 'Da!', exampleRu: 'Да!' },
    { id: 'ne', sr: 'ne', cyr: 'не', ru: 'нет', cat: 'Первые слова', icon: '×', example: 'Ne, hvala.', exampleRu: 'Нет, спасибо.' },
    { id: 'hvala', sr: 'hvala', cyr: 'хвала', ru: 'спасибо', cat: 'Первые слова', icon: '🤝', example: 'Hvala!', exampleRu: 'Спасибо!' },
    { id: 'molim', sr: 'molim', cyr: 'молим', ru: 'пожалуйста', cat: 'Первые слова', icon: '🙏', example: 'Voda, molim.', exampleRu: 'Воду, пожалуйста.' },
    { id: 'izvini', sr: 'izvini', cyr: 'извини', ru: 'извини', cat: 'Первые слова', icon: '🙌', example: 'Izvini!', exampleRu: 'Извини!' },
    { id: 'dobro', sr: 'dobro', cyr: 'добро', ru: 'хорошо', cat: 'Первые слова', icon: '👍', example: 'Dobro je.', exampleRu: 'Всё хорошо.' },
    { id: 'zdravo', sr: 'zdravo', cyr: 'здраво', ru: 'привет', cat: 'Приветствия', icon: '👋', example: 'Zdravo!', exampleRu: 'Привет!' },
    { id: 'cao', sr: 'ćao', cyr: 'ћао', ru: 'привет / пока', cat: 'Приветствия', icon: '🙂', example: 'Ćao!', exampleRu: 'Привет! / Пока!' },
    { id: 'dovidjenja', sr: 'doviđenja', cyr: 'довиђења', ru: 'до свидания', cat: 'Приветствия', icon: '🚪', example: 'Doviđenja!', exampleRu: 'До свидания!' },
    { id: 'dobar_dan', sr: 'dobar dan', cyr: 'добар дан', ru: 'добрый день', cat: 'Приветствия', icon: '☀️', example: 'Dobar dan!', exampleRu: 'Добрый день!' },
    { id: 'dobro_jutro', sr: 'dobro jutro', cyr: 'добро јутро', ru: 'доброе утро', cat: 'Приветствия', icon: '🌅', example: 'Dobro jutro!', exampleRu: 'Доброе утро!' },
    { id: 'laku_noc', sr: 'laku noć', cyr: 'лаку ноћ', ru: 'спокойной ночи', cat: 'Приветствия', icon: '🌙', example: 'Laku noć!', exampleRu: 'Спокойной ночи!' },

    { id: 'ja', sr: 'ja', cyr: 'ја', ru: 'я', cat: 'Люди и вещи', icon: '🙋', example: 'Ja sam Ivan.', exampleRu: 'Я Иван.' },
    { id: 'ti', sr: 'ti', cyr: 'ти', ru: 'ты', cat: 'Люди и вещи', icon: '👉', example: 'A ti?', exampleRu: 'А ты?' },
    { id: 'ovo', sr: 'ovo', cyr: 'ово', ru: 'это', cat: 'Люди и вещи', icon: '👆', example: 'Ovo je pas.', exampleRu: 'Это собака.' },
    { id: 'je', sr: 'je', cyr: 'је', ru: 'есть / является', cat: 'Люди и вещи', icon: '=', example: 'Ovo je voda.', exampleRu: 'Это вода.' },
    { id: 'pas', sr: 'pas', cyr: 'пас', ru: 'собака', cat: 'Люди и вещи', icon: '🐕', example: 'Ovo je pas.', exampleRu: 'Это собака.' },
    { id: 'macka', sr: 'mačka', cyr: 'мачка', ru: 'кошка', cat: 'Люди и вещи', icon: '🐈', example: 'Ovo je mačka.', exampleRu: 'Это кошка.' },
    { id: 'jabuka', sr: 'jabuka', cyr: 'јабука', ru: 'яблоко', cat: 'Люди и вещи', icon: '🍎', example: 'Ovo je jabuka.', exampleRu: 'Это яблоко.' },
    { id: 'kuca', sr: 'kuća', cyr: 'кућа', ru: 'дом', cat: 'Люди и вещи', icon: '🏠', example: 'Ovo je kuća.', exampleRu: 'Это дом.' },

    { id: 'kako', sr: 'kako', cyr: 'како', ru: 'как', cat: 'Знакомство', icon: '?', example: 'Kako si?', exampleRu: 'Как ты?' },
    { id: 'si', sr: 'si', cyr: 'си', ru: 'ты есть', cat: 'Знакомство', icon: '●', example: 'Kako si?', exampleRu: 'Как ты?' },
    { id: 'sam', sr: 'sam', cyr: 'сам', ru: 'я есть / являюсь', cat: 'Знакомство', icon: '●', example: 'Ja sam Ivan.', exampleRu: 'Я Иван.' },
    { id: 'ime', sr: 'ime', cyr: 'име', ru: 'имя', cat: 'Знакомство', icon: '🏷️', example: 'Moje ime je Ana.', exampleRu: 'Меня зовут Ана.' },
    { id: 'moje', sr: 'moje', cyr: 'моје', ru: 'моё', cat: 'Знакомство', icon: '🤲', example: 'Moje ime je Ana.', exampleRu: 'Моё имя — Ана.' },
    { id: 'zovem', sr: 'zovem se', cyr: 'зовем се', ru: 'меня зовут', cat: 'Знакомство', icon: '💬', example: 'Zovem se Marko.', exampleRu: 'Меня зовут Марко.' },
    { id: 'odakle', sr: 'odakle', cyr: 'одакле', ru: 'откуда', cat: 'Знакомство', icon: '🌍', example: 'Odakle si?', exampleRu: 'Откуда ты?' },
    { id: 'iz', sr: 'iz', cyr: 'из', ru: 'из', cat: 'Знакомство', icon: '↗', example: 'Ja sam iz Rusije.', exampleRu: 'Я из России.' },
    { id: 'rusija', sr: 'Rusija', cyr: 'Русија', ru: 'Россия', cat: 'Знакомство', icon: '🇷🇺', example: 'Ja sam iz Rusije.', exampleRu: 'Я из России.' },
    { id: 'srbija', sr: 'Srbija', cyr: 'Србија', ru: 'Сербия', cat: 'Знакомство', icon: '🇷🇸', example: 'Ovo je Srbija.', exampleRu: 'Это Сербия.' },

    { id: 'jedan', sr: 'jedan', cyr: 'један', ru: 'один', cat: 'Кафе и числа', icon: '1', example: 'Jedan.', exampleRu: 'Один.' },
    { id: 'dva', sr: 'dva', cyr: 'два', ru: 'два', cat: 'Кафе и числа', icon: '2', example: 'Dva.', exampleRu: 'Два.' },
    { id: 'tri', sr: 'tri', cyr: 'три', ru: 'три', cat: 'Кафе и числа', icon: '3', example: 'Tri.', exampleRu: 'Три.' },
    { id: 'kafa', sr: 'kafa', cyr: 'кафа', ru: 'кофе', cat: 'Кафе и числа', icon: '☕', example: 'Kafa, molim.', exampleRu: 'Кофе, пожалуйста.' },
    { id: 'voda', sr: 'voda', cyr: 'вода', ru: 'вода', cat: 'Кафе и числа', icon: '💧', example: 'Voda, molim.', exampleRu: 'Воду, пожалуйста.' },
    { id: 'racun', sr: 'račun', cyr: 'рачун', ru: 'счёт', cat: 'Кафе и числа', icon: '🧾', example: 'Račun, molim.', exampleRu: 'Счёт, пожалуйста.' },
    { id: 'bez', sr: 'bez', cyr: 'без', ru: 'без', cat: 'Кафе и числа', icon: '⊘', example: 'Bez šećera.', exampleRu: 'Без сахара.' },
    { id: 'secer', sr: 'šećer', cyr: 'шећер', ru: 'сахар', cat: 'Кафе и числа', icon: '◇', example: 'Bez šećera.', exampleRu: 'Без сахара.' },

    { id: 'gde', sr: 'gde', cyr: 'где', ru: 'где', cat: 'Город', icon: '📍', example: 'Gde je stanica?', exampleRu: 'Где остановка?' },
    { id: 'koliko', sr: 'koliko', cyr: 'колико', ru: 'сколько', cat: 'Город', icon: '?', example: 'Koliko košta?', exampleRu: 'Сколько стоит?' },
    { id: 'kosta', sr: 'košta', cyr: 'кошта', ru: 'стоит', cat: 'Город', icon: '💰', example: 'Koliko košta?', exampleRu: 'Сколько стоит?' },
    { id: 'stanica', sr: 'stanica', cyr: 'станица', ru: 'остановка / станция', cat: 'Город', icon: '🚌', example: 'Gde je stanica?', exampleRu: 'Где остановка?' },
    { id: 'levo', sr: 'levo', cyr: 'лево', ru: 'налево', cat: 'Город', icon: '←', example: 'Levo.', exampleRu: 'Налево.' },
    { id: 'desno', sr: 'desno', cyr: 'десно', ru: 'направо', cat: 'Город', icon: '→', example: 'Desno.', exampleRu: 'Направо.' },
    { id: 'pravo', sr: 'pravo', cyr: 'право', ru: 'прямо', cat: 'Город', icon: '↑', example: 'Pravo.', exampleRu: 'Прямо.' },
    { id: 'blizu', sr: 'blizu', cyr: 'близу', ru: 'близко', cat: 'Город', icon: '◎', example: 'Stanica je blizu.', exampleRu: 'Остановка близко.' },

    { id: 'danas', sr: 'danas', cyr: 'данас', ru: 'сегодня', cat: 'Время', icon: '📅', example: 'Danas.', exampleRu: 'Сегодня.' },
    { id: 'sutra', sr: 'sutra', cyr: 'сутра', ru: 'завтра', cat: 'Время', icon: '➡', example: 'Sutra.', exampleRu: 'Завтра.' },
    { id: 'juce', sr: 'juče', cyr: 'јуче', ru: 'вчера', cat: 'Время', icon: '⬅', example: 'Juče.', exampleRu: 'Вчера.' },
    { id: 'sada', sr: 'sada', cyr: 'сада', ru: 'сейчас', cat: 'Время', icon: '⏱', example: 'Sada.', exampleRu: 'Сейчас.' },
    { id: 'jutro', sr: 'jutro', cyr: 'јутро', ru: 'утро', cat: 'Время', icon: '🌤️', example: 'Dobro jutro.', exampleRu: 'Доброе утро.' },
    { id: 'vece', sr: 'veče', cyr: 'вече', ru: 'вечер', cat: 'Время', icon: '🌆', example: 'Dobro veče.', exampleRu: 'Добрый вечер.' }
  ];

  const units = [
    { id: 1, kind: 'alphabet', title: 'Алфавит и звуки', subtitle: 'Все 30 букв без зубрёжки', icon: 'А', color: '#62c7ff', lessons: alphabetGroups.length },
    { id: 2, title: 'Самые первые слова', subtitle: 'Да, нет, спасибо и пожалуйста', icon: '👋', color: '#a7f432', lessonSets: [['da', 'ne', 'hvala'], ['molim', 'izvini', 'dobro']] },
    { id: 3, title: 'Приветствия', subtitle: 'Поздороваться и попрощаться', icon: '🙂', color: '#a98cff', lessonSets: [['zdravo', 'cao', 'dovidjenja'], ['dobar_dan', 'dobro_jutro', 'laku_noc']] },
    { id: 4, title: 'Люди и вещи', subtitle: 'Я, ты, это и знакомые предметы', icon: '🍎', color: '#ff7f9b', lessonSets: [['ja', 'ti', 'ovo', 'je'], ['pas', 'macka', 'jabuka', 'kuca']] },
    { id: 5, title: 'Знакомство', subtitle: 'Имя, страна и простые вопросы', icon: '💬', color: '#72e6c1', lessonSets: [['kako', 'si', 'sam'], ['ime', 'moje', 'zovem'], ['odakle', 'iz', 'rusija', 'srbija']] },
    { id: 6, title: 'Числа и кафе', subtitle: 'Посчитать и сделать простой заказ', icon: '☕', color: '#ffad42', lessonSets: [['jedan', 'dva', 'tri'], ['kafa', 'voda', 'molim'], ['racun', 'bez', 'secer']] },
    { id: 7, title: 'В городе', subtitle: 'Спросить дорогу и понять направление', icon: '🚌', color: '#62c7ff', lessonSets: [['gde', 'stanica', 'blizu'], ['levo', 'desno', 'pravo'], ['koliko', 'kosta', 'racun']] },
    { id: 8, title: 'Время и мини-диалоги', subtitle: 'Собираем знакомые слова во фразы', icon: '🕒', color: '#a98cff', lessonSets: [['danas', 'sutra', 'juce'], ['sada', 'jutro', 'vece'], ['zdravo', 'kako', 'si', 'hvala']] }
  ].map(unit => ({ ...unit, lessons: unit.lessons || unit.lessonSets.length }));

  const phraseLibrary = {
    3: [
      { sr: 'Zdravo!', ru: 'Привет!', hints: ['zdravo'] },
      { sr: 'Dobar dan!', ru: 'Добрый день!', hints: ['dobar_dan'] }
    ],
    4: [
      { sr: 'Ovo je pas.', ru: 'Это собака.', hints: ['ovo', 'je', 'pas'] },
      { sr: 'Ovo je mačka.', ru: 'Это кошка.', hints: ['ovo', 'je', 'macka'] }
    ],
    5: [
      { sr: 'Kako si?', ru: 'Как ты?', hints: ['kako', 'si'] },
      { sr: 'Moje ime je Ana.', ru: 'Моё имя — Ана.', hints: ['moje', 'ime', 'je'] },
      { sr: 'Ja sam iz Rusije.', ru: 'Я из России.', hints: ['ja', 'sam', 'iz', 'rusija'] }
    ],
    6: [
      { sr: 'Kafa, molim.', ru: 'Кофе, пожалуйста.', hints: ['kafa', 'molim'] },
      { sr: 'Voda bez šećera.', ru: 'Вода без сахара.', hints: ['voda', 'bez', 'secer'] },
      { sr: 'Račun, molim.', ru: 'Счёт, пожалуйста.', hints: ['racun', 'molim'] }
    ],
    7: [
      { sr: 'Gde je stanica?', ru: 'Где остановка?', hints: ['gde', 'je', 'stanica'] },
      { sr: 'Stanica je blizu.', ru: 'Остановка близко.', hints: ['stanica', 'je', 'blizu'] },
      { sr: 'Koliko košta?', ru: 'Сколько стоит?', hints: ['koliko', 'kosta'] }
    ],
    8: [
      { sr: 'Danas ili sutra?', ru: 'Сегодня или завтра?', hints: ['danas', 'sutra'] },
      { sr: 'Dobro jutro!', ru: 'Доброе утро!', hints: ['dobro_jutro'] },
      { sr: 'Zdravo! Kako si?', ru: 'Привет! Как ты?', hints: ['zdravo', 'kako', 'si'] }
    ]
  };

  const dailyPhrases = [
    { sr: 'Zdravo!', cyr: 'Здраво!', ru: 'Привет!', hints: ['zdravo'] },
    { sr: 'Hvala!', cyr: 'Хвала!', ru: 'Спасибо!', hints: ['hvala'] },
    { sr: 'Kako si?', cyr: 'Како си?', ru: 'Как ты?', hints: ['kako', 'si'] },
    { sr: 'Kafa, molim.', cyr: 'Кафа, молим.', ru: 'Кофе, пожалуйста.', hints: ['kafa', 'molim'] },
    { sr: 'Gde je stanica?', cyr: 'Где је станица?', ru: 'Где остановка?', hints: ['gde', 'je', 'stanica'] }
  ];

  const voiceStyles = {
    soft: { label: 'Мягкий', rate: 0.78, pitch: 1.08 },
    normal: { label: 'Обычный', rate: 0.9, pitch: 1 },
    slow: { label: 'Медленный', rate: 0.64, pitch: 1.02 }
  };

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
    voiceURI: '',
    voiceStyle: 'soft',
    name: 'Иван',
    totalCorrect: 0,
    totalAnswers: 0
  };

  let state = loadState();
  let currentScreen = 'learn';
  let lesson = null;
  let toastTimer = null;
  let activeTooltip = null;

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      const merged = { ...defaultState, ...saved, srs: { ...defaultState.srs, ...(saved.srs || {}) } };
      if (saved.dailyDate !== TODAY()) merged.dailyXp = 0;
      merged.dailyDate = TODAY();
      return merged;
    } catch {
      return { ...defaultState, dailyDate: TODAY() };
    }
  }

  function saveState() {
    state.dailyDate = TODAY();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* private mode */ }
  }

  function updateStreak() {
    const today = new Date(TODAY());
    if (!state.lastActive) state.streak = 1;
    else {
      const previous = new Date(state.lastActive);
      const diff = Math.round((today - previous) / 86400000);
      if (diff === 1) state.streak += 1;
      else if (diff > 1) state.streak = 1;
    }
    state.lastActive = TODAY();
  }

  function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }
  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function wordById(id) { return words.find(word => word.id === id); }
  function displayWord(word) { return state.script === 'cyrillic' ? word.cyr : word.sr; }
  function escapeHtml(value) { return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function escapeAttr(value) { return escapeHtml(value).replace(/'/g, '&#39;'); }
  function escapeRegExp(value) { return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  function characterFor(seed = 0) {
    return characters[Math.abs(seed) % characters.length];
  }

  function setCharacter(element, seed = 0, mood = 'happy') {
    if (!element) return;
    const character = characterFor(seed);
    element.innerHTML = `<img class="character-img mood-${mood}" src="${character.file}" alt="Персонаж ${character.name}">`;
  }

  function rankVoices() {
    if (!('speechSynthesis' in window)) return [];
    return speechSynthesis.getVoices().map(voice => {
      const haystack = `${voice.lang} ${voice.name}`.toLowerCase();
      let score = 0;
      if (/^sr|serb/.test(haystack)) score += 120;
      if (/^hr|croat/.test(haystack)) score += 95;
      if (/^bs|bosn/.test(haystack)) score += 85;
      if (/^mk|maced/.test(haystack)) score += 50;
      if (/female|milena|jana|ana|sara|google/.test(haystack)) score += 8;
      if (voice.localService) score += 2;
      return { voice, score };
    }).sort((a, b) => b.score - a.score || a.voice.name.localeCompare(b.voice.name)).map(item => item.voice);
  }

  function selectedVoice() {
    const voices = rankVoices();
    return voices.find(voice => voice.voiceURI === state.voiceURI) || voices[0] || null;
  }

  function speak(text) {
    if (!state.sound || !('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = selectedVoice();
    const style = voiceStyles[state.voiceStyle] || voiceStyles.soft;
    utterance.lang = voice?.lang || 'sr-RS';
    utterance.voice = voice;
    utterance.rate = style.rate;
    utterance.pitch = style.pitch;
    utterance.volume = 1;
    speechSynthesis.speak(utterance);
  }

  function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2300);
  }

  function findHintRanges(text, ids) {
    const used = [];
    const candidates = [...new Set(ids)].map(wordById).filter(Boolean).flatMap(word => {
      const forms = [...new Set([word.sr, word.cyr])];
      return forms.map(form => ({ id: word.id, form }));
    }).sort((a, b) => b.form.length - a.form.length);

    const isLetter = char => Boolean(char && /\p{L}/u.test(char));
    candidates.forEach(candidate => {
      const regex = new RegExp(escapeRegExp(candidate.form), 'giu');
      let match;
      while ((match = regex.exec(text))) {
        const start = match.index;
        const end = start + match[0].length;
        if (isLetter(text[start - 1]) || isLetter(text[end])) continue;
        if (used.some(range => start < range.end && end > range.start)) continue;
        used.push({ start, end, id: candidate.id, value: match[0] });
      }
    });
    return used.sort((a, b) => a.start - b.start);
  }

  function decorateText(text, ids = []) {
    if (!ids.length) return escapeHtml(text);
    const ranges = findHintRanges(String(text), ids);
    if (!ranges.length) return escapeHtml(text);
    let output = '';
    let cursor = 0;
    ranges.forEach(range => {
      output += escapeHtml(text.slice(cursor, range.start));
      const word = wordById(range.id);
      output += `<span class="word-hint" tabindex="0" role="button" data-hint-id="${escapeAttr(range.id)}" aria-label="Показать перевод: ${escapeAttr(word.ru)}">${escapeHtml(range.value)}</span>`;
      cursor = range.end;
    });
    output += escapeHtml(text.slice(cursor));
    return output;
  }

  function closeWordTooltip() {
    if (activeTooltip) activeTooltip.remove();
    activeTooltip = null;
    document.querySelectorAll('.word-hint.active').forEach(element => element.classList.remove('active'));
  }

  function showWordTooltip(anchor, word) {
    closeWordTooltip();
    const tooltip = document.createElement('div');
    tooltip.className = 'word-tooltip';
    tooltip.innerHTML = `<b>${escapeHtml(displayWord(word))}</b><span>${escapeHtml(word.ru)}</span><small>${escapeHtml(word.sr)} · ${escapeHtml(word.cyr)}</small>`;
    document.body.appendChild(tooltip);
    const rect = anchor.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const left = clamp(rect.left + rect.width / 2 - tooltipRect.width / 2, 10, window.innerWidth - tooltipRect.width - 10);
    const spaceAbove = rect.top;
    const top = spaceAbove > tooltipRect.height + 18 ? rect.top - tooltipRect.height - 10 : rect.bottom + 10;
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
    anchor.classList.add('active');
    activeTooltip = tooltip;
  }

  function bindWordHints(root = document) {
    root.querySelectorAll('.word-hint').forEach(element => {
      const open = event => {
        event.preventDefault();
        event.stopPropagation();
        const word = wordById(element.dataset.hintId);
        if (!word) return;
        if (element.classList.contains('active')) closeWordTooltip();
        else showWordTooltip(element, word);
      };
      element.addEventListener('click', open);
      element.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') open(event);
      });
    });
  }

  function renderAll() {
    renderLearn();
    renderReview();
    renderWords();
    renderProfile();
    renderGlobal();
  }

  function renderGlobal() {
    document.getElementById('streakTop').textContent = state.streak;
    document.getElementById('xpTop').textContent = state.dailyXp;
    document.getElementById('heartsTop').textContent = state.hearts;
    document.getElementById('dailyXpSide').textContent = state.dailyXp;
    document.getElementById('dailyGoalSide').textContent = state.dailyGoal;
    document.getElementById('dailyGoalLabel').textContent = `${state.dailyGoal} XP`;
    const percentage = clamp(Math.round((state.dailyXp / state.dailyGoal) * 100), 0, 100);
    document.getElementById('goalPercent').textContent = `${percentage}%`;
    document.getElementById('goalRingValue').style.strokeDashoffset = 301.59 * (1 - percentage / 100);
    document.getElementById('dailyMotivation').textContent = percentage >= 100
      ? 'Цель выполнена. Можно идти дальше!'
      : percentage >= 50
        ? 'Уже больше половины. Хороший темп.'
        : 'Один спокойный урок — и ты ближе к цели.';
    const due = dueWords().length;
    const badge = document.getElementById('reviewBadge');
    badge.textContent = due;
    badge.classList.toggle('hidden', due === 0);
    setCharacter(document.getElementById('sidebarCharacter'), 3);
  }

  function renderPhrase() {
    const phrase = dailyPhrases[new Date().getDate() % dailyPhrases.length];
    const element = document.getElementById('phraseSr');
    const text = state.script === 'cyrillic' ? phrase.cyr : phrase.sr;
    element.innerHTML = decorateText(text, phrase.hints);
    document.getElementById('phraseRu').textContent = phrase.ru;
    document.getElementById('phraseSpeak').onclick = () => speak(phrase.sr);
    setCharacter(document.getElementById('phraseCharacter'), new Date().getDate() + 3, 'happy');
    bindWordHints(document.querySelector('.phrase-card'));
  }

  function getUnitCompleted(unit) {
    return state.completedLessons.filter(key => key.startsWith(`${unit.id}-`)).length;
  }

  function isUnitUnlocked(unit) {
    if (unit.id === 1) return true;
    const previous = units[unit.id - 2];
    return getUnitCompleted(previous) >= previous.lessons;
  }

  function renderLearn() {
    const firstIncomplete = units.find(unit => isUnitUnlocked(unit) && getUnitCompleted(unit) < unit.lessons);
    const completedTotal = state.completedLessons.length;
    const courseComplete = !firstIncomplete;
    document.getElementById('screen-learn').innerHTML = `
      <div class="hero">
        <div class="hero-copy">
          <div class="eyebrow">Сербский с абсолютного нуля</div>
          <h1>${courseComplete ? 'Svaka čast!' : completedTotal ? 'Nastavljamo?' : 'Без паники.'}<br><span style="color:var(--accent)">${courseComplete ? 'Курс пройден!' : completedTotal ? 'Продолжим?' : 'Начнём с алфавита'}</span></h1>
          <p>${courseComplete
            ? 'Основной маршрут завершён. Теперь закрепляй слова в умном повторении.'
            : completedTotal
              ? `Ты прошёл ${completedTotal} ${plural(completedTotal, 'урок', 'урока', 'уроков')}. Незнакомые слова всегда можно открыть по пунктиру.`
              : 'Сначала буквы и звуки, затем самые простые слова. Никаких предложений до знакомства с лексикой.'}</p>
          <button class="primary-button" id="heroStart">${courseComplete ? 'Перейти к повторению' : completedTotal ? 'Продолжить урок' : 'Начать с букв'}</button>
        </div>
        <div class="hero-character" id="heroCharacter"></div>
      </div>
      <div class="hint-explainer"><span class="hint-demo">zdravo</span><div><b>Слово непонятно?</b><p>Нажми на пунктир — перевод откроется прямо в задании.</p></div></div>
      <div class="section-head"><div><h2>Маршрут обучения</h2><p>От алфавита к коротким бытовым фразам</p></div><button class="section-link" data-screen-jump="words">Открыть словарь</button></div>
      <div class="unit-list">
        ${units.map(unit => {
          const done = getUnitCompleted(unit);
          const unlocked = isUnitUnlocked(unit);
          const percentage = Math.round(done / unit.lessons * 100);
          return `<article class="unit-card ${unlocked ? '' : 'locked'}">
            <div class="unit-icon" style="background:${unit.color}">${unit.icon}</div>
            <div class="unit-copy"><h3>Раздел ${unit.id}. ${unit.title}</h3><p>${unit.subtitle}</p><div class="unit-progress"><div class="progress-track"><span style="width:${percentage}%"></span></div><small>${done}/${unit.lessons}</small></div></div>
            <div class="lesson-dots">${Array.from({ length: unit.lessons }, (_, index) => {
              const key = `${unit.id}-${index + 1}`;
              const completed = state.completedLessons.includes(key);
              const current = !completed && index === done;
              const disabled = !unlocked || (!completed && index > done);
              return `<button class="lesson-dot ${completed ? 'completed' : ''} ${current ? 'current' : ''}" data-unit="${unit.id}" data-lesson="${index + 1}" ${disabled ? 'disabled' : ''}>${completed ? '✓' : index + 1}</button>`;
            }).join('')}</div>
          </article>`;
        }).join('')}
      </div>`;
    setCharacter(document.getElementById('heroCharacter'), 1 + state.completedLessons.length, 'happy');
    document.getElementById('heroStart').onclick = () => courseComplete
      ? switchScreen('review')
      : startLesson(firstIncomplete.id, getUnitCompleted(firstIncomplete) + 1);
    document.querySelectorAll('.lesson-dot:not(:disabled)').forEach(button => {
      button.onclick = () => startLesson(Number(button.dataset.unit), Number(button.dataset.lesson));
    });
    document.querySelectorAll('[data-screen-jump]').forEach(button => {
      button.onclick = () => switchScreen(button.dataset.screenJump);
    });
    renderPhrase();
  }

  function dueWords() {
    const now = Date.now();
    return words.filter(word => state.srs[word.id] && state.srs[word.id].due <= now);
  }

  function learnedWords() {
    return words.filter(word => state.srs[word.id]);
  }

  function renderReview() {
    const due = dueWords();
    const learned = learnedWords();
    const average = learned.length
      ? Math.round(learned.reduce((sum, word) => sum + (state.srs[word.id].level || 0), 0) / learned.length * 20)
      : 0;
    document.getElementById('screen-review').innerHTML = `
      <div class="page-head"><h1>Повторение</h1><p>Слова возвращаются тогда, когда их пора освежить.</p></div>
      <div class="review-summary">
        <div class="review-main"><div class="eyebrow">На сегодня</div><div class="review-count">${due.length}</div><h2>${due.length ? plural(due.length, 'слово ждёт', 'слова ждут', 'слов ждут') : 'Всё повторено'}</h2><p>${due.length ? 'Подсказки по пунктиру остаются доступными и в повторении.' : 'Новые слова появятся здесь после первых лексических уроков.'}</p><button class="primary-button" id="startReview" ${due.length ? '' : 'disabled'}>${due.length ? 'Повторить сейчас' : 'Пока нечего повторять'}</button></div>
        <div class="review-side"><div class="metric-card"><span>Изучено слов</span><b>${learned.length}</b></div><div class="metric-card"><span>Среднее освоение</span><b>${average}%</b></div><div class="metric-card"><span>Точность ответов</span><b>${state.totalAnswers ? Math.round(state.totalCorrect / state.totalAnswers * 100) : 0}%</b></div></div>
      </div>`;
    const button = document.getElementById('startReview');
    if (due.length) button.onclick = () => startReview(due);
  }

  function renderWords() {
    const categories = ['Все', ...new Set(words.map(word => word.cat))];
    document.getElementById('screen-words').innerHTML = `
      <div class="page-head"><h1>Словарь</h1><p>Все слова курса, примеры и прогресс запоминания.</p></div>
      <div class="word-tools"><input id="wordSearch" class="search-input" placeholder="Найти слово или перевод"><select id="wordCategory" class="select-input">${categories.map(category => `<option>${category}</option>`).join('')}</select></div>
      <div id="wordList" class="word-list"></div>`;
    const search = document.getElementById('wordSearch');
    const category = document.getElementById('wordCategory');
    const draw = () => {
      const query = search.value.trim().toLowerCase();
      const selectedCategory = category.value;
      const list = words.filter(word => (selectedCategory === 'Все' || word.cat === selectedCategory) && (!query || `${word.sr} ${word.cyr} ${word.ru}`.toLowerCase().includes(query)));
      document.getElementById('wordList').innerHTML = list.length ? list.map(word => {
        const srs = state.srs[word.id];
        const mastery = srs ? clamp((srs.level || 0) * 20, 5, 100) : 0;
        return `<article class="word-card"><div><div><span class="word-sr">${escapeHtml(word.sr)}</span><span class="word-cyr">${escapeHtml(word.cyr)}</span></div><div class="word-ru">${escapeHtml(word.ru)}</div><div class="word-meta">${escapeHtml(word.example)} · ${srs ? `уровень ${srs.level}` : 'ещё не изучено'}</div><div class="mastery"><span style="width:${mastery}%"></span></div></div><button class="tiny-button" data-speak="${escapeAttr(word.sr)}" aria-label="Озвучить">🔊</button></article>`;
      }).join('') : '<div class="empty-card">Ничего не найдено</div>';
      document.querySelectorAll('[data-speak]').forEach(button => {
        button.onclick = () => speak(button.dataset.speak);
      });
    };
    search.oninput = draw;
    category.onchange = draw;
    draw();
  }

  function renderProfile() {
    const accuracy = state.totalAnswers ? Math.round(state.totalCorrect / state.totalAnswers * 100) : 0;
    const voices = rankVoices();
    const selected = selectedVoice();
    document.getElementById('screen-profile').innerHTML = `
      <div class="page-head"><h1>Профиль</h1><p>Настройки курса, голоса и статистика.</p></div>
      <div class="profile-grid">
        <section class="profile-card"><div class="profile-main"><div class="profile-avatar" id="profileAvatar"></div><div><h2>${escapeHtml(state.name)}</h2><p>Изучает сербский · абсолютный новичок</p></div></div><div class="stats-grid"><div class="stat-box"><span>Всего XP</span><b>${state.xp}</b></div><div class="stat-box"><span>Серия</span><b>${state.streak} 🔥</b></div><div class="stat-box"><span>Уроков</span><b>${state.completedLessons.length}</b></div><div class="stat-box"><span>Точность</span><b>${accuracy}%</b></div></div></section>
        <section class="profile-card"><h3 style="margin-top:0">Настройки</h3>
          <div class="setting-row"><div><label>Озвучка</label><small>Произношение слов и фраз</small></div><button id="soundToggle" class="toggle ${state.sound ? 'on' : ''}" aria-label="Переключить озвучку"></button></div>
          <div class="setting-block"><label for="voiceSelect">Голос</label><small>Список зависит от браузера и голосов, установленных в системе</small><div class="voice-picker-row"><select id="voiceSelect" class="select-input voice-select"><option value="">Автоматически: ${escapeHtml(selected?.name || 'лучший доступный')}</option>${voices.map(voice => `<option value="${escapeAttr(voice.voiceURI)}" ${state.voiceURI === voice.voiceURI ? 'selected' : ''}>${escapeHtml(voice.name)} — ${escapeHtml(voice.lang)}</option>`).join('')}</select><button id="testVoice" class="tiny-button voice-test" aria-label="Проверить голос">▶</button></div></div>
          <div class="setting-block"><label>Характер произношения</label><small>Можно изменить темп и высоту выбранного голоса</small><div class="voice-style-picker">${Object.entries(voiceStyles).map(([id, config]) => `<button class="goal-chip ${state.voiceStyle === id ? 'active' : ''}" data-voice-style="${id}">${config.label}</button>`).join('')}</div></div>
          <div class="setting-row"><div><label>Письмо</label><small>${state.script === 'latin' ? 'Латиница: zdravo' : 'Кириллица: здраво'}</small></div><button id="scriptToggle" class="toggle ${state.script === 'cyrillic' ? 'on' : ''}" aria-label="Переключить письмо"></button></div>
          <div class="setting-row" style="display:block"><div><label>Дневная цель</label><small>Сколько XP хочешь набирать ежедневно</small></div><div class="goal-picker">${[10, 20, 30, 50].map(goal => `<button class="goal-chip ${state.dailyGoal === goal ? 'active' : ''}" data-goal="${goal}">${goal} XP</button>`).join('')}</div></div>
          <div style="margin-top:17px"><button id="resetProgress" class="secondary-button">Сбросить прогресс</button></div>
        </section>
      </div>`;
    setCharacter(document.getElementById('profileAvatar'), 0);
    document.getElementById('soundToggle').onclick = () => {
      state.sound = !state.sound;
      saveState();
      renderAll();
      showToast(state.sound ? 'Озвучка включена' : 'Озвучка выключена');
    };
    document.getElementById('voiceSelect').onchange = event => {
      state.voiceURI = event.target.value;
      saveState();
      showToast('Голос сохранён');
      setTimeout(() => speak('Zdravo! Kako si?'), 80);
    };
    document.getElementById('testVoice').onclick = () => speak('Zdravo! Kako si? Hvala.');
    document.querySelectorAll('[data-voice-style]').forEach(button => {
      button.onclick = () => {
        state.voiceStyle = button.dataset.voiceStyle;
        saveState();
        renderProfile();
        setTimeout(() => speak('Dobar dan!'), 80);
      };
    });
    document.getElementById('scriptToggle').onclick = () => {
      state.script = state.script === 'latin' ? 'cyrillic' : 'latin';
      saveState();
      renderAll();
      showToast(state.script === 'latin' ? 'Включена латиница' : 'Включена кириллица');
    };
    document.querySelectorAll('[data-goal]').forEach(button => {
      button.onclick = () => {
        state.dailyGoal = Number(button.dataset.goal);
        saveState();
        renderAll();
        showToast(`Дневная цель: ${state.dailyGoal} XP`);
      };
    });
    document.getElementById('resetProgress').onclick = () => {
      if (confirm('Сбросить весь прогресс курса?')) {
        state = { ...defaultState, completedLessons: [], srs: {}, voiceURI: state.voiceURI, voiceStyle: state.voiceStyle, dailyDate: TODAY() };
        saveState();
        renderAll();
        showToast('Прогресс сброшен');
      }
    };
  }

  function switchScreen(name) {
    currentScreen = name;
    closeWordTooltip();
    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
    document.getElementById(`screen-${name}`).classList.add('active');
    document.querySelectorAll('[data-screen-link]').forEach(button => button.classList.toggle('active', button.dataset.screenLink === name));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function questionDistractors(word, count = 2) {
    const sameCategory = words.filter(candidate => candidate.id !== word.id && candidate.cat === word.cat);
    const pool = sameCategory.length >= count ? sameCategory : words.filter(candidate => candidate.id !== word.id);
    return shuffle(pool).slice(0, count);
  }

  function buildAlphabetQuestions(group) {
    const sampled = shuffle(group.letters).slice(0, Math.min(4, group.letters.length));
    const questions = [{ type: 'alphabetIntro', group }];
    sampled.forEach((letter, index) => {
      if (index % 2 === 0) {
        questions.push({
          type: 'letterChoice',
          prompt: `Найди букву со звуком «${letter.sound}»`,
          answer: letter.latin,
          options: shuffle([letter, ...shuffle(group.letters.filter(item => item.latin !== letter.latin)).slice(0, 2)]).map(item => item.latin),
          letter
        });
      } else {
        questions.push({
          type: 'letterChoice',
          prompt: `Какая кириллическая буква соответствует «${letter.latin}»?`,
          answer: letter.cyr,
          options: shuffle([letter, ...shuffle(group.letters.filter(item => item.latin !== letter.latin)).slice(0, 2)]).map(item => item.cyr),
          letter
        });
      }
    });
    return questions;
  }

  function buildWordQuestions(unit, lessonNum) {
    const ids = unit.lessonSets[lessonNum - 1];
    const selectedWords = ids.map(wordById).filter(Boolean);
    const questions = [];
    selectedWords.forEach((word, index) => {
      questions.push({ type: 'teachWord', word, hints: [word.id] });
      const distractors = questionDistractors(word, unit.id <= 3 ? 2 : 3);
      if (unit.id <= 3 || index === 0) {
        questions.push({
          type: 'choice',
          word,
          prompt: `Что означает «${displayWord(word)}»?`,
          hints: [word.id],
          answer: word.ru,
          options: shuffle([word, ...distractors]).map(item => item.ru)
        });
      } else if ((index + lessonNum) % 3 === 0 && unit.id >= 6) {
        questions.push({
          type: 'typing',
          word,
          prompt: `Напиши по-сербски: «${word.ru}»`,
          hints: [],
          answer: displayWord(word)
        });
      } else if ((index + lessonNum) % 2 === 0) {
        questions.push({
          type: 'listen',
          word,
          prompt: 'Что ты услышал?',
          hints: [],
          answer: word.ru,
          options: shuffle([word, ...distractors]).map(item => item.ru)
        });
      } else {
        questions.push({
          type: 'reverse',
          word,
          prompt: `Как будет «${word.ru}»?`,
          hints: [],
          answer: displayWord(word),
          options: shuffle([word, ...distractors]).map(displayWord)
        });
      }
    });

    const phrases = phraseLibrary[unit.id] || [];
    const phrase = phrases[(lessonNum - 1) % Math.max(phrases.length, 1)];
    if (phrase && unit.id >= 3) {
      questions.push({
        type: 'phrase',
        prompt: 'Собери перевод фразы',
        serbian: phrase.sr,
        answer: phrase.ru,
        hints: phrase.hints,
        tokens: shuffle(phrase.ru.replace(/[.!?—]/g, '').split(' ').filter(Boolean))
      });
    }
    return questions.slice(0, unit.id <= 3 ? 7 : 9);
  }

  function startLesson(unitId, lessonNum) {
    if (state.hearts <= 0) {
      state.hearts = 5;
      showToast('Сердца восстановлены для прототипа');
    }
    const unit = units.find(item => item.id === unitId);
    const questions = unit.kind === 'alphabet'
      ? buildAlphabetQuestions(alphabetGroups[lessonNum - 1])
      : buildWordQuestions(unit, lessonNum);
    lesson = {
      mode: 'lesson',
      unitId,
      lessonNum,
      title: unit.title,
      questions,
      index: 0,
      correct: 0,
      selected: null,
      answerLocked: false,
      startedAt: Date.now(),
      touchedWords: new Set(),
      characterSeed: unitId * 13 + lessonNum
    };
    openLesson();
    renderQuestion();
  }

  function startReview(due) {
    const questions = shuffle(due).slice(0, 10).map((word, index) => {
      const distractors = questionDistractors(word, 3);
      return index % 2
        ? { type: 'typing', word, prompt: `Вспомни слово: «${word.ru}»`, hints: [], answer: displayWord(word) }
        : { type: 'choice', word, prompt: `Что означает «${displayWord(word)}»?`, hints: [word.id], answer: word.ru, options: shuffle([word, ...distractors]).map(item => item.ru) };
    });
    lesson = {
      mode: 'review',
      title: 'Повторение',
      questions,
      index: 0,
      correct: 0,
      selected: null,
      answerLocked: false,
      startedAt: Date.now(),
      touchedWords: new Set(),
      characterSeed: 41
    };
    openLesson();
    renderQuestion();
  }

  function openLesson() {
    document.getElementById('lessonOverlay').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    document.getElementById('lessonHearts').textContent = state.hearts;
  }

  function closeLesson() {
    closeWordTooltip();
    document.getElementById('lessonOverlay').classList.add('hidden');
    document.getElementById('lessonFeedback').classList.add('hidden');
    document.body.style.overflow = '';
    lesson = null;
  }

  function characterQuestionRow(promptHtml, seed) {
    const character = characterFor(seed);
    return `<div class="question-character-row"><div class="question-character" id="qCharacter"></div><div class="speech-bubble"><span class="character-name">${character.name}</span><div>${promptHtml}</div><small class="helper-line">${escapeHtml(randomFrom(helperLines))}</small></div></div>`;
  }

  function renderQuestion() {
    if (!lesson || lesson.index >= lesson.questions.length) {
      finishLesson();
      return;
    }
    closeWordTooltip();
    lesson.answerLocked = false;
    lesson.selected = null;
    document.getElementById('lessonFeedback').classList.add('hidden');
    const question = lesson.questions[lesson.index];
    document.getElementById('lessonProgressBar').style.width = `${lesson.index / lesson.questions.length * 100}%`;
    const stage = document.getElementById('lessonStage');
    const seed = lesson.characterSeed + lesson.index;
    const promptHtml = decorateText(question.prompt || '', question.hints || []);
    let body = '';

    if (question.type === 'alphabetIntro') {
      body = `<div class="question-label">Алфавит · знакомство</div><h2 class="question-title">${escapeHtml(question.group.title)}</h2><p class="question-subtitle">${escapeHtml(question.group.subtitle)}</p><div class="alphabet-note">${escapeHtml(question.group.note)}</div><div class="alphabet-grid">${question.group.letters.map(letter => `<button class="letter-card" data-letter-speak="${escapeAttr(letter.example)}"><b>${letter.latin}</b><strong>${letter.cyr}</strong><span>${escapeHtml(letter.sound)}</span><small>${escapeHtml(letter.example)} — ${escapeHtml(letter.exampleRu)}</small><i>🔊</i></button>`).join('')}</div><div class="lesson-actions"><button id="continueLearning" class="primary-button">Понятно, дальше</button></div>`;
    } else if (question.type === 'teachWord') {
      body = `${characterQuestionRow(escapeHtml('Новое слово. Сначала просто послушай и посмотри перевод.'), seed)}<div class="teach-word-card"><div class="teach-icon">${escapeHtml(question.word.icon)}</div><div class="teach-word-main"><div class="teach-word">${decorateText(displayWord(question.word), [question.word.id])}</div><div class="teach-script">${escapeHtml(question.word.sr)} · ${escapeHtml(question.word.cyr)}</div><div class="teach-translation">${escapeHtml(question.word.ru)}</div></div><button id="teachSpeak" class="listen-mini" aria-label="Прослушать слово">🔊</button></div><div class="example-card"><span>Пример</span><b>${decorateText(question.word.example, findWordIdsInText(question.word.example))}</b><p>${escapeHtml(question.word.exampleRu)}</p></div><div class="lesson-actions"><button id="continueLearning" class="primary-button">Запомнить и дальше</button></div>`;
    } else if (['choice', 'reverse', 'letterChoice'].includes(question.type)) {
      body = `${characterQuestionRow(promptHtml, seed)}<div class="answer-grid">${question.options.map((option, index) => `<button class="answer-option" data-answer="${escapeAttr(option)}"><span class="option-index">${index + 1}</span><span>${escapeHtml(option)}</span></button>`).join('')}</div>`;
    } else if (question.type === 'listen') {
      body = `<div class="question-label">Аудирование</div><h2 class="question-title">${escapeHtml(question.prompt)}</h2><p class="question-subtitle">Можно прослушать несколько раз.</p><button class="listen-button" id="listenAgain">🔊</button><div class="answer-grid">${question.options.map((option, index) => `<button class="answer-option" data-answer="${escapeAttr(option)}"><span class="option-index">${index + 1}</span><span>${escapeHtml(option)}</span></button>`).join('')}</div>`;
    } else if (question.type === 'typing') {
      body = `${characterQuestionRow(promptHtml, seed)}<input id="textAnswer" class="text-answer" autocomplete="off" autocapitalize="none" placeholder="Введи ответ…"><p class="typing-note">На старте можно писать без č, ć, š, ž и đ — ответ всё равно засчитается.</p><div class="lesson-actions"><button id="checkText" class="primary-button">Проверить</button></div>`;
    } else if (question.type === 'phrase') {
      body = `<div class="question-label">Фраза с подсказками</div><h2 class="question-title phrase-with-hints">${decorateText(question.serbian, question.hints)}</h2><p class="question-subtitle">Нажимай на незнакомые слова, затем собери русский перевод.</p><div id="phraseAnswer" class="word-bank"></div><div class="word-bank solid-bank">${question.tokens.map((token, index) => `<button class="word-chip" data-token="${escapeAttr(token)}" data-token-index="${index}">${escapeHtml(token)}</button>`).join('')}</div><div class="lesson-actions"><button id="clearPhrase" class="secondary-button">Очистить</button><button id="checkPhrase" class="primary-button">Проверить</button></div>`;
    }

    stage.innerHTML = body;
    const characterElement = document.getElementById('qCharacter');
    if (characterElement) setCharacter(characterElement, seed, 'happy');
    bindWordHints(stage);

    if (question.type === 'alphabetIntro') {
      document.querySelectorAll('[data-letter-speak]').forEach(button => {
        button.onclick = () => speak(button.dataset.letterSpeak);
      });
      document.getElementById('continueLearning').onclick = () => advanceLearning(question);
    }
    if (question.type === 'teachWord') {
      document.getElementById('teachSpeak').onclick = () => speak(question.word.sr);
      document.getElementById('continueLearning').onclick = () => advanceLearning(question);
      setTimeout(() => speak(question.word.sr), 220);
    }
    if (question.type === 'listen') {
      document.getElementById('listenAgain').onclick = () => speak(question.word.sr);
      setTimeout(() => speak(question.word.sr), 260);
    }
    document.querySelectorAll('[data-answer]').forEach(button => {
      button.onclick = () => selectChoice(button, question);
    });
    if (question.type === 'typing') {
      const input = document.getElementById('textAnswer');
      input.focus();
      document.getElementById('checkText').onclick = () => submitAnswer(input.value, question.answer, question);
      input.onkeydown = event => {
        if (event.key === 'Enter') submitAnswer(input.value, question.answer, question);
      };
    }
    if (question.type === 'phrase') setupPhrase(question);
  }

  function findWordIdsInText(text) {
    return words.filter(word => findHintRanges(text, [word.id]).length).map(word => word.id);
  }

  function advanceLearning(question) {
    if (question.word) {
      lesson.touchedWords.add(question.word.id);
      if (!state.srs[question.word.id]) {
        state.srs[question.word.id] = { level: 0, due: Date.now() + 10 * 60e3, seen: 1, correct: 0 };
        saveState();
      }
    }
    lesson.index += 1;
    renderQuestion();
  }

  function selectChoice(button, question) {
    if (lesson.answerLocked) return;
    document.querySelectorAll('[data-answer]').forEach(item => item.classList.remove('selected'));
    button.classList.add('selected');
    lesson.selected = button.dataset.answer;
    submitAnswer(lesson.selected, question.answer, question, button);
  }

  function normalize(value) {
    return String(value).toLowerCase().trim().replace(/[.!?,:;—-]/g, '').replace(/\s+/g, ' ');
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

  function submitAnswer(value, answer, question, button = null) {
    if (lesson.answerLocked) return;
    if (!String(value).trim()) {
      showToast('Сначала введи ответ');
      return;
    }
    lesson.answerLocked = true;
    const correct = normalize(value) === normalize(answer) || normalizeLoose(value) === normalizeLoose(answer);
    state.totalAnswers += 1;
    if (correct) {
      lesson.correct += 1;
      state.totalCorrect += 1;
    } else {
      const protectedStart = lesson.mode === 'lesson' && lesson.unitId <= 2;
      if (!protectedStart) state.hearts = Math.max(0, state.hearts - 1);
    }
    if (question.word) {
      lesson.touchedWords.add(question.word.id);
      updateSRS(question.word.id, correct);
    }
    saveState();
    document.getElementById('lessonHearts').textContent = state.hearts;
    if (button) button.classList.add(correct ? 'correct' : 'wrong');
    showFeedback(correct, answer, question);
  }

  function setupPhrase(question) {
    const selected = [];
    const answerElement = document.getElementById('phraseAnswer');
    document.querySelectorAll('[data-token]').forEach(button => {
      button.onclick = () => {
        if (lesson.answerLocked) return;
        button.classList.add('used');
        selected.push({ text: button.dataset.token, index: button.dataset.tokenIndex });
        draw();
      };
    });
    function draw() {
      answerElement.innerHTML = selected.map((item, index) => `<button class="word-chip" data-selected-index="${index}">${escapeHtml(item.text)}</button>`).join('');
      answerElement.querySelectorAll('[data-selected-index]').forEach(button => {
        button.onclick = () => {
          const item = selected.splice(Number(button.dataset.selectedIndex), 1)[0];
          document.querySelector(`[data-token-index="${item.index}"]`).classList.remove('used');
          draw();
        };
      });
    }
    document.getElementById('clearPhrase').onclick = () => {
      selected.splice(0);
      document.querySelectorAll('[data-token]').forEach(button => button.classList.remove('used'));
      draw();
    };
    document.getElementById('checkPhrase').onclick = () => submitAnswer(selected.map(item => item.text).join(' '), question.answer, question);
  }

  function showFeedback(correct, answer, question) {
    closeWordTooltip();
    const box = document.getElementById('lessonFeedback');
    box.className = `lesson-feedback ${correct ? 'feedback-correct' : 'feedback-wrong'}`;
    const example = question.word
      ? `<span class="feedback-example">${decorateText(question.word.example, findWordIdsInText(question.word.example))}</span> · ${escapeHtml(question.word.exampleRu)}`
      : correct
        ? 'Продолжаем в спокойном темпе.'
        : `Правильный ответ: ${escapeHtml(answer)}`;
    box.innerHTML = `<div class="feedback-inner"><div class="feedback-icon">${correct ? '✓' : '!'}</div><div class="feedback-copy"><b>${correct ? randomFrom(['Odlično!', 'Bravo!', 'Tačno!']) : 'Ничего страшного'}</b><p>${correct ? example : `Правильный ответ: ${escapeHtml(answer)}. Подсказки можно открывать до ответа.`}</p></div><button id="nextQuestion" class="primary-button">Продолжить</button></div>`;
    box.classList.remove('hidden');
    bindWordHints(box);
    document.getElementById('nextQuestion').onclick = () => {
      lesson.index += 1;
      renderQuestion();
    };
  }

  function updateSRS(id, correct) {
    const old = state.srs[id] || { level: 0, due: 0, seen: 0, correct: 0 };
    const level = correct ? Math.min(5, old.level + 1) : Math.max(0, old.level - 1);
    const intervals = [0, 10 * 60e3, 24 * 60 * 60e3, 3 * 24 * 60 * 60e3, 7 * 24 * 60 * 60e3, 21 * 24 * 60 * 60e3];
    state.srs[id] = { level, due: Date.now() + intervals[level], seen: old.seen + 1, correct: old.correct + (correct ? 1 : 0) };
  }

  function finishLesson() {
    closeWordTooltip();
    const elapsed = Math.max(1, Math.round((Date.now() - lesson.startedAt) / 1000));
    const xp = lesson.mode === 'review' ? Math.max(5, lesson.correct * 2) : 8 + lesson.correct;
    state.xp += xp;
    state.dailyXp += xp;
    updateStreak();
    if (lesson.mode === 'lesson') {
      const key = `${lesson.unitId}-${lesson.lessonNum}`;
      if (!state.completedLessons.includes(key)) state.completedLessons.push(key);
      lesson.touchedWords.forEach(id => {
        if (!state.srs[id]) state.srs[id] = { level: 1, due: Date.now() + 10 * 60e3, seen: 1, correct: 1 };
      });
    }
    saveState();
    renderAll();
    document.getElementById('lessonProgressBar').style.width = '100%';
    document.getElementById('lessonStage').innerHTML = `<div class="finish-card"><div class="finish-character" id="finishCharacter"></div><div class="eyebrow">Урок завершён</div><h2>Bravo!</h2><p>${lesson.correct === lesson.questions.filter(question => !['teachWord', 'alphabetIntro'].includes(question.type)).length ? 'Отлично. Но подсказками всё равно можно пользоваться — это обучение, не экзамен.' : 'Главное — ты дошёл до конца и уже видел новые слова несколько раз.'}</p><div class="finish-stats"><div class="finish-stat"><b>+${xp}</b><span>XP</span></div><div class="finish-stat"><b>${lesson.correct}</b><span>верных ответов</span></div><div class="finish-stat"><b>${elapsed} c</b><span>время</span></div></div><button id="finishClose" class="primary-button">Вернуться к курсу</button></div>`;
    setCharacter(document.getElementById('finishCharacter'), lesson.characterSeed + 7, 'happy');
    document.getElementById('finishClose').onclick = () => {
      closeLesson();
      switchScreen('learn');
    };
  }

  function plural(number, one, few, many) {
    const n10 = number % 10;
    const n100 = number % 100;
    return n10 === 1 && n100 !== 11 ? one : n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14) ? few : many;
  }

  if (typeof window !== 'undefined') {
    window.__CAO_TEST_API__ = {
      words,
      units,
      alphabetGroups,
      buildAlphabetQuestions,
      buildWordQuestions,
      decorateText,
      findHintRanges,
      normalize,
      normalizeLoose,
      wordById
    };
    if (window.__CAO_TEST_MODE__) return;
  }

  document.querySelectorAll('[data-screen-link]').forEach(button => {
    button.addEventListener('click', event => {
      event.preventDefault();
      switchScreen(button.dataset.screenLink);
    });
  });
  document.getElementById('closeLesson').onclick = () => {
    if (confirm('Выйти из урока? Текущий прогресс урока не сохранится.')) closeLesson();
  };
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && lesson) document.getElementById('closeLesson').click();
  });
  document.addEventListener('click', event => {
    if (activeTooltip && !event.target.closest('.word-tooltip') && !event.target.closest('.word-hint')) closeWordTooltip();
  });
  window.addEventListener('resize', closeWordTooltip);
  window.addEventListener('scroll', closeWordTooltip, true);
  if ('speechSynthesis' in window) {
    speechSynthesis.onvoiceschanged = () => {
      if (currentScreen === 'profile' && !lesson) renderProfile();
    };
  }

  renderAll();
})();
