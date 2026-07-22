(() => {
  'use strict';
  const DATA = window.CAO_A1_DATA;
  if (!DATA) throw new Error('course-a1.js is not loaded');
  const A = window.CAO = {};
  A.DATA = DATA;
  A.STORAGE_KEY = 'cao-serbian-v2';
  A.TODAY = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
  A.characters = [
    {name:'Milo',file:'assets/characters/milo.png'},{name:'Tara',file:'assets/characters/tara.png'},
    {name:'Mina',file:'assets/characters/mina.png'},{name:'Laza',file:'assets/characters/laza.png'},
    {name:'Boki',file:'assets/characters/boki.png'}
  ];
  A.helperLines = ['Незнакомое слово можно открыть по пунктиру.','Сначала послушай, потом отвечай.','Ошибка здесь — часть обучения, а не провал.','Повторяй звук столько раз, сколько нужно.','Не спеши: важнее узнать слово, чем угадать.'];
  A.alphabetGroups = [
    ['Гласные и буква J','A, E, I, O, U читаются стабильно, а J звучит как «й».','В сербском почти всегда действует правило: одна буква — один звук.',[['A','А','а','Ana','Ана'],['E','Е','э','Evo','вот'],['I','И','и','ime','имя'],['O','О','о','ovo','это'],['U','У','у','ulica','улица'],['J','Ј','й','ja','я']]],
    ['Знакомые согласные','Большинство этих букв читаются почти как в русском.','Смотри на сербское звучание, а не на английское чтение латиницы.',[['M','М','м','mama','мама'],['N','Н','н','ne','нет'],['K','К','к','kafa','кофе'],['T','Т','т','ti','ты'],['P','П','п','pas','собака'],['B','Б','б','broj','номер']]],
    ['Ещё простые буквы','После них уже можно читать много коротких слов.','R произносится чётко, без английского оттенка.',[['V','В','в','voda','вода'],['G','Г','г','grad','город'],['D','Д','д','dan','день'],['Z','З','з','zdravo','привет'],['R','Р','р','račun','счёт'],['L','Л','л','levo','налево']]],
    ['Особые сербские звуки','Главные буквы с диакритикой — без спешки.','Č звучит твёрже, чем Ć. На старте достаточно научиться их различать.',[['Č','Ч','твёрдое ч','čaj','чай'],['Ć','Ћ','мягкое ч','ćao','привет'],['Š','Ш','ш','šećer','сахар'],['Ž','Ж','ж','žena','женщина'],['Đ','Ђ','мягкое дж','đak','ученик']]],
    ['Последние буквы и сочетания','Закрываем весь сербский алфавит.','LJ, NJ и DŽ считаются отдельными буквами.',[['C','Ц','ц','centar','центр'],['S','С','с','sada','сейчас'],['F','Ф','ф','film','фильм'],['H','Х','х','hvala','спасибо'],['LJ','Љ','ль','ljubav','любовь'],['NJ','Њ','нь','njega','его'],['DŽ','Џ','дж','džem','джем']]]
  ].map(([title,subtitle,note,letters]) => ({title,subtitle,note,letters:letters.map(([latin,cyr,sound,example,exampleRu])=>({latin,cyr,sound,example,exampleRu}))}));
  A.chunk = (items,size) => { const out=[]; for(let i=0;i<items.length;i+=size) out.push(items.slice(i,i+size)); return out; };
  A.toCyr = input => {
    const text=String(input||''), map={a:'а',b:'б',v:'в',g:'г',d:'д',đ:'ђ',e:'е',ž:'ж',z:'з',i:'и',j:'ј',k:'к',l:'л',m:'м',n:'н',o:'о',p:'п',r:'р',s:'с',t:'т',ć:'ћ',u:'у',f:'ф',h:'х',c:'ц',č:'ч',š:'ш'};
    let out='';
    for(let i=0;i<text.length;i++){
      const pair=text.slice(i,i+2), lowPair=pair.toLowerCase();
      if(['lj','nj','dž'].includes(lowPair)){ const c=lowPair==='lj'?'љ':lowPair==='nj'?'њ':'џ'; out+=pair[0]===pair[0].toUpperCase()?c.toUpperCase():c; i++; continue; }
      const ch=text[i], low=ch.toLowerCase(), c=map[low]; out+=c?(ch===ch.toUpperCase()&&ch!==ch.toLowerCase()?c.toUpperCase():c):ch;
    }
    return out;
  };
  A.units = DATA.units.map(unit => {
    if(unit.kind==='alphabet') return {...unit,lessons:A.alphabetGroups.length,lessonSets:[]};
    const wordObjects=unit.words.map(([id,sr,ru,icon])=>({id,sr,cyr:A.toCyr(sr),ru,icon,cat:unit.title,unitId:unit.id}));
    return {...unit,wordObjects,lessonSets:A.chunk(wordObjects.map(w=>w.id),4),lessons:Math.ceil(wordObjects.length/4)};
  });
  A.words=A.units.flatMap(unit=>unit.wordObjects||[]);
  A.wordMap=new Map(A.words.map(word=>[word.id,word]));
  A.phraseEntries=A.units.flatMap(unit=>(unit.phrases||[]).map((p,index)=>({unitId:unit.id,index,sr:p[0],ru:p[1],hints:p[2]||[]})));
  A.audioManifest={...(window.CAO_AUDIO_MANIFEST||{})};
  A.words.forEach(word=>{if(!A.audioManifest[word.sr]) A.audioManifest[word.sr]=`a1w_${word.id}`;});
  A.phraseEntries.forEach(p=>{if(!A.audioManifest[p.sr]) A.audioManifest[p.sr]=`a1p_${p.unitId}_${p.index+1}`;});
  DATA.placement.questions.forEach(q=>{if(q.audio&&!A.audioManifest[q.audio]) A.audioManifest[q.audio]=`a1t_${q.id}`;});
  window.CAO_AUDIO_MANIFEST=A.audioManifest;
  A.voiceStyles={soft:{label:'Мягкий',rate:.84,pitch:1.04,audioRate:.94},normal:{label:'Обычный',rate:.92,pitch:1,audioRate:1},slow:{label:'Учебный',rate:.68,pitch:1.01,audioRate:.8}};
  A.voicePacks={gabrijela:{label:'София',description:'Мягкий женский голос',folder:'gabrijela',icon:'С'},srecko:{label:'Никола',description:'Спокойный мужской голос',folder:'srecko',icon:'Н'},system:{label:'Системный',description:'Только как резерв',folder:'',icon:'◉'}};
  A.defaultState={xp:0,dailyXp:0,dailyGoal:20,streak:0,lastActive:null,hearts:5,completedLessons:[],srs:{},sound:true,script:'latin',voiceURI:'',voiceStyle:'soft',voicePack:'gabrijela',name:'Иван',totalCorrect:0,totalAnswers:0,placementCompleted:false,placementMode:null,placementLevel:'A0',placementScore:0,placementTakenAt:null,unlockedThrough:1,preferredStartUnit:1,dismissedPlacement:false};
  A.loadState=()=>{try{const saved=JSON.parse(localStorage.getItem(A.STORAGE_KEY)||'{}');const merged={...A.defaultState,...saved,srs:{...(saved.srs||{})}};if(saved.dailyDate!==A.TODAY())merged.dailyXp=0;if(!A.voicePacks[merged.voicePack])merged.voicePack='gabrijela';merged.dailyDate=A.TODAY();merged.completedLessons=Array.isArray(merged.completedLessons)?merged.completedLessons:[];return merged;}catch{return{...A.defaultState,dailyDate:A.TODAY()};}};
  A.state=A.loadState(); A.currentScreen='learn'; A.lesson=null; A.assessment=null; A.toastTimer=null; A.activeTooltip=null; A.activeAudio=null; A.audioFallbackNotified=false;
  A.saveState=()=>{A.state.dailyDate=A.TODAY();try{localStorage.setItem(A.STORAGE_KEY,JSON.stringify(A.state));}catch{}};
  A.random=arr=>arr[Math.floor(Math.random()*arr.length)]; A.shuffle=arr=>[...arr].sort(()=>Math.random()-.5); A.clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  A.escape=value=>String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  A.escapeAttr=value=>A.escape(value).replace(/'/g,'&#39;'); A.escapeReg=value=>String(value).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  A.normalize=value=>String(value||'').toLowerCase().trim().replace(/[.!?,:;—–-]/g,'').replace(/\s+/g,' ');
  A.normalizeLoose=value=>A.normalize(value).replace(/đ/g,'dj').replace(/[čć]/g,'c').replace(/š/g,'s').replace(/ž/g,'z').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  A.wordById=id=>A.wordMap.get(id); A.displayWord=word=>A.state.script==='cyrillic'?word.cyr:word.sr;
  A.characterFor=(seed=0)=>A.characters[Math.abs(seed)%A.characters.length];
  A.setCharacter=(el,seed=0,mood='happy')=>{if(!el)return;const c=A.characterFor(seed);el.innerHTML=`<img class="character-img mood-${mood}" src="${c.file}" alt="Персонаж ${c.name}">`;};
  A.plural=(n,one,few,many)=>{const n10=n%10,n100=n%100;return n10===1&&n100!==11?one:n10>=2&&n10<=4&&(n100<12||n100>14)?few:many;};
  A.rankVoices=()=>{if(!('speechSynthesis'in window))return[];return speechSynthesis.getVoices().map(voice=>{const h=`${voice.lang} ${voice.name}`.toLowerCase();let score=0;if(/^sr|serb/.test(h))score+=120;if(/^hr|croat/.test(h))score+=95;if(/^bs|bosn/.test(h))score+=85;if(/female|milena|jana|ana|sara/.test(h))score+=8;if(voice.localService)score+=2;return{voice,score};}).sort((a,b)=>b.score-a.score||a.voice.name.localeCompare(b.voice.name)).map(x=>x.voice);};
  A.selectedVoice=()=>A.rankVoices().find(v=>v.voiceURI===A.state.voiceURI)||A.rankVoices()[0]||null;
  A.stopSpeech=()=>{if(A.activeAudio){A.activeAudio.pause();A.activeAudio.currentTime=0;A.activeAudio=null;}if('speechSynthesis'in window)speechSynthesis.cancel();};
  A.playSystemVoice=text=>{if(!('speechSynthesis'in window))return;const u=new SpeechSynthesisUtterance(text),v=A.selectedVoice(),s=A.voiceStyles[A.state.voiceStyle]||A.voiceStyles.soft;u.lang=v?.lang||'sr-RS';u.voice=v;u.rate=s.rate;u.pitch=s.pitch;u.volume=1;speechSynthesis.speak(u);};
  A.speak=text=>{if(!A.state.sound||!text)return;A.stopSpeech();const pack=A.voicePacks[A.state.voicePack]||A.voicePacks.system,key=A.audioManifest[text];if(pack.folder&&key){const audio=new Audio(`assets/audio/${pack.folder}/${key}.mp3`);audio.playbackRate=(A.voiceStyles[A.state.voiceStyle]||A.voiceStyles.soft).audioRate;audio.preload='auto';A.activeAudio=audio;audio.onended=()=>{if(A.activeAudio===audio)A.activeAudio=null;};audio.onerror=()=>{if(A.activeAudio===audio)A.activeAudio=null;A.playSystemVoice(text);if(!A.audioFallbackNotified){A.audioFallbackNotified=true;A.showToast('Для новых слов ещё нет MP3 — временно включён резервный голос');}};audio.play().catch(()=>audio.onerror?.());return;}A.playSystemVoice(text);};
  A.showToast=message=>{const toast=document.getElementById('toast');toast.textContent=message;toast.classList.add('show');clearTimeout(A.toastTimer);A.toastTimer=setTimeout(()=>toast.classList.remove('show'),2400);};
  A.hintForms={srbija:['Srbiji','Srbije'],rusija:['Rusije'],ukrajina:['Ukrajine'],brat:['brata'],sestra:['sestru'],jedan:['jednu','jedna'],dva:['dve'],paradajz:['paradajza'],grad:['grada','gradu'],prijatelj:['prijateljem'],ici:['idem','idite','ići'],doci:['dođi','dolazim'],raditi:['radim'],ustati:['ustajem'],citati:['čitam'],kasniti:['kasni'],otvoriti:['otvorim','otvorite']};
  A.findHintRanges=(text,ids)=>{const used=[];const candidates=[...new Set(ids)].map(A.wordById).filter(Boolean).flatMap(word=>[...new Set([word.sr,word.cyr,...(A.hintForms[word.id]||[])])].map(form=>({id:word.id,form}))).sort((a,b)=>b.form.length-a.form.length);const isLetter=ch=>Boolean(ch&&/\p{L}/u.test(ch));candidates.forEach(c=>{const re=new RegExp(A.escapeReg(c.form),'giu');let m;while((m=re.exec(text))){const start=m.index,end=start+m[0].length;if(isLetter(text[start-1])||isLetter(text[end]))continue;if(used.some(r=>start<r.end&&end>r.start))continue;used.push({start,end,id:c.id,value:m[0]});}});return used.sort((a,b)=>a.start-b.start);};
  A.decorateText=(text,ids=[])=>{if(!ids.length)return A.escape(text);const ranges=A.findHintRanges(String(text),ids);if(!ranges.length)return A.escape(text);let out='',cursor=0;ranges.forEach(r=>{out+=A.escape(text.slice(cursor,r.start));const w=A.wordById(r.id);out+=`<span class="word-hint" tabindex="0" role="button" data-hint-id="${A.escapeAttr(r.id)}" aria-label="Показать перевод: ${A.escapeAttr(w.ru)}">${A.escape(r.value)}</span>`;cursor=r.end;});return out+A.escape(text.slice(cursor));};
  A.findWordIdsInText=text=>A.words.filter(word=>A.findHintRanges(text,[word.id]).length).map(word=>word.id);
  A.closeWordTooltip=()=>{if(A.activeTooltip)A.activeTooltip.remove();A.activeTooltip=null;document.querySelectorAll('.word-hint.active').forEach(el=>el.classList.remove('active'));};
  A.showWordTooltip=(anchor,word)=>{A.closeWordTooltip();const tip=document.createElement('div');tip.className='word-tooltip';tip.innerHTML=`<b>${A.escape(A.displayWord(word))}</b><span>${A.escape(word.ru)}</span><small>${A.escape(word.sr)} · ${A.escape(word.cyr)}</small>`;document.body.appendChild(tip);const rect=anchor.getBoundingClientRect(),tr=tip.getBoundingClientRect();tip.style.left=`${A.clamp(rect.left+rect.width/2-tr.width/2,10,window.innerWidth-tr.width-10)}px`;tip.style.top=`${rect.top>tr.height+18?rect.top-tr.height-10:rect.bottom+10}px`;anchor.classList.add('active');A.activeTooltip=tip;};
  A.bindWordHints=(root=document)=>root.querySelectorAll('.word-hint').forEach(el=>{const open=e=>{e.preventDefault();e.stopPropagation();const w=A.wordById(el.dataset.hintId);if(!w)return;el.classList.contains('active')?A.closeWordTooltip():A.showWordTooltip(el,w);};el.addEventListener('click',open);el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')open(e);});});
  A.updateStreak=()=>{const today=new Date(A.TODAY());if(!A.state.lastActive)A.state.streak=1;else{const diff=Math.round((today-new Date(A.state.lastActive))/86400000);if(diff===1)A.state.streak++;else if(diff>1)A.state.streak=1;}A.state.lastActive=A.TODAY();};
  A.getUnitCompleted=unit=>A.state.completedLessons.filter(key=>key.startsWith(`${unit.id}-`)).length;
  A.isUnitUnlocked=unit=>unit.id<=Math.max(1,A.state.unlockedThrough||1)||unit.id===1||(unit.id>1&&A.getUnitCompleted(A.units[unit.id-2])>=A.units[unit.id-2].lessons);
  A.firstIncompleteUnit=()=>A.units.find(unit=>A.isUnitUnlocked(unit)&&A.getUnitCompleted(unit)<unit.lessons)||null;
  A.levelForUnit=id=>id<=7?'A1 · старт':id<=18?'A1 · база':id<=29?'A1 · общение':'A1 · уверенный';
  A.dueWords=()=>A.words.filter(w=>A.state.srs[w.id]&&A.state.srs[w.id].due<=Date.now()); A.learnedWords=()=>A.words.filter(w=>A.state.srs[w.id]);
  A.exampleFor=word=>A.phraseEntries.find(p=>p.hints.includes(word.id))||null;
})();
