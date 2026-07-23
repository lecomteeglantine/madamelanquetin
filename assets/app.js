
(() => {
  const D = window.HISTORY_DATA;
  const $ = (s, c=document) => c.querySelector(s);
  const $$ = (s, c=document) => [...c.querySelectorAll(s)];
  const page = document.body.dataset.page;
  const storeKey = 'lanquetin_progress_v1';
  const settingsKey = 'lanquetin_settings_v1';
  const defaultProgress = {visited:[], completedQuizzes:[], gamesPlayed:0, bestScores:{}, lastPeriod:'ww1'};
  const storageAvailable = (()=>{try{const k='__lanquetin_test__';localStorage.setItem(k,'1');localStorage.removeItem(k);return true}catch{return false}})();
  const getProgress = () => {if(!storageAvailable)return {...defaultProgress};try{return {...defaultProgress,...JSON.parse(localStorage.getItem(storeKey)||'{}')}}catch{return {...defaultProgress}}};
  const saveProgress = p => {if(!storageAvailable)return false;try{localStorage.setItem(storeKey,JSON.stringify(p));return true}catch{return false}};
  const markVisited = id => {const p=getProgress();if(!p.visited.includes(id))p.visited.push(id);p.lastPeriod=id;saveProgress(p)};
  const initials = n => n.split(/\s+/).map(x=>x[0]).slice(0,2).join('');
  const safeImage = (person) => person.image ? `<img class="portrait" src="${person.image}" alt="Portrait de ${person.name}" loading="lazy">` : `<div class="avatar" aria-hidden="true">${initials(person.name)}</div>`;
  const periodById = id => D.periods.find(p=>p.id===id);
  const peopleFor = id => D.people.filter(p=>p.periods.includes(id));
  const escapeHtml = str => String(str).replace(/[&<>'"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

  function createDialog(overlay, opener, preferredFocus){
    if(!overlay||!opener)return {open:()=>{},close:()=>{}};
    let lastFocus=null;
    const focusable=()=>$$('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',overlay).filter(el=>el.offsetParent!==null);
    const open=()=>{lastFocus=document.activeElement;overlay.classList.add('open');overlay.setAttribute('aria-hidden','false');document.body.classList.add('dialog-open');setTimeout(()=>{(preferredFocus?.()||focusable()[0])?.focus()},30)};
    const close=()=>{overlay.classList.remove('open');overlay.setAttribute('aria-hidden','true');document.body.classList.remove('dialog-open');lastFocus?.focus?.()};
    overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
    overlay.addEventListener('keydown',e=>{
      if(e.key==='Escape'){e.preventDefault();close();return}
      if(e.key!=='Tab')return;
      const items=focusable();if(!items.length)return;
      const first=items[0],last=items[items.length-1];
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
    });
    opener.addEventListener('click',open);
    return {open,close};
  }

  function setupExternalLinks(){
    $$('a[href^="http://"],a[href^="https://"]').forEach(a=>{
      a.target='_blank';a.rel='noopener noreferrer';
      const label=(a.getAttribute('aria-label')||a.textContent.trim()||'Lien externe').replace(/\s*↗\s*$/,'');
      a.setAttribute('aria-label',`${label} — ouvre un site externe dans un nouvel onglet`);
    });
  }

  function setupNav(){
    $$('.main-nav a').forEach(a=>{if(a.dataset.page===page){a.classList.add('active');a.setAttribute('aria-current','page')}});
    const button=$('.menu-btn'),nav=$('.main-nav');
    button?.addEventListener('click',()=>{const open=nav.classList.toggle('open');button.setAttribute('aria-expanded',String(open));button.setAttribute('aria-label',open?'Fermer le menu':'Ouvrir le menu')});
  }
  function setupSearch(){
    const overlay=$('#search-overlay'), input=$('#global-search'), results=$('#search-results');
    const dialog=createDialog(overlay,$('#open-search'),()=>input);
    $('#close-search')?.addEventListener('click',dialog.close);
    const index=[];
    D.periods.forEach(p=>index.push({title:p.title,sub:p.years,url:`periode.html?id=${p.id}`,text:p.summary}));
    D.people.forEach(p=>index.push({title:p.name,sub:p.role,url:`personnages.html?person=${p.id}`,text:p.summary}));
    D.periods.forEach(p=>p.vocab.forEach(v=>index.push({title:v.term,sub:`Vocabulaire — ${p.title}`,url:`periode.html?id=${p.id}#vocabulaire`,text:v.definition})));
    D.periods.forEach(p=>p.events.forEach(ev=>index.push({title:ev.title,sub:`${ev.date} — ${p.title}`,url:`periode.html?id=${p.id}#chronologie`,text:ev.text})));
    const render=q=>{
      const s=q.toLowerCase().trim();
      const hits=(s?index.filter(x=>(x.title+' '+x.sub+' '+x.text).toLowerCase().includes(s)):index.slice(0,7)).slice(0,10);
      results.innerHTML=hits.map(x=>`<a class="search-result" href="${x.url}"><strong>${escapeHtml(x.title)}</strong><br><span class="mini">${escapeHtml(x.sub)}</span></a>`).join('')||'<p>Aucun résultat. Essaie un nom, une date ou une période.</p>';
    };
    input?.addEventListener('input',e=>render(e.target.value));render('');
  }
  function setupAccessibility(){
    const overlay=$('#access-overlay');
    const dialog=createDialog(overlay,$('#open-access'),()=>$('#access-title'));
    $('#close-access')?.addEventListener('click',dialog.close);
    let s={size:1,contrast:false,dyslexic:false,motion:false,focus:false,spacing:false,links:false};
    if(storageAvailable){try{s={...s,...JSON.parse(localStorage.getItem(settingsKey)||'{}')}}catch{}}
    const apply=()=>{
      document.documentElement.style.setProperty('--text-size',s.size);
      document.body.classList.toggle('high-contrast',s.contrast);
      document.body.classList.toggle('reduce-motion',s.motion);
      document.body.classList.toggle('focus-mode',s.focus);
      document.body.classList.toggle('text-spacing',s.spacing);
      document.body.classList.toggle('underline-links',s.links);
      document.body.style.fontFamily=s.dyslexic?'Verdana,Arial,sans-serif':'';
      if(s.contrast){document.documentElement.style.setProperty('--paper','#fff');document.documentElement.style.setProperty('--cream','#fff');document.documentElement.style.setProperty('--muted','#172b3d')}else{document.documentElement.style.setProperty('--paper','#fffdf7');document.documentElement.style.setProperty('--cream','#f6f0df');document.documentElement.style.setProperty('--muted','#5d6d7c')}
      $$('[data-setting]').forEach(b=>b.setAttribute('aria-pressed',String(Boolean(s[b.dataset.setting]))));
      $$('[data-size]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.size)===Number(s.size))));
      if(storageAvailable){try{localStorage.setItem(settingsKey,JSON.stringify(s))}catch{}}
    };
    $$('[data-size]').forEach(b=>b.addEventListener('click',()=>{s.size=Number(b.dataset.size);apply()}));
    $$('[data-setting]').forEach(b=>b.addEventListener('click',()=>{const k=b.dataset.setting;s[k]=!s[k];apply()}));
    $('#reset-access')?.addEventListener('click',()=>{s={size:1,contrast:false,dyslexic:false,motion:false,focus:false,spacing:false,links:false};apply()});
    if(!storageAvailable){$('#access-storage-note')?.classList.remove('hidden')}
    apply();
  }
  function speak(text){
    if(!('speechSynthesis' in window)){alert('La lecture audio n’est pas disponible dans ce navigateur.');return}
    speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='fr-FR';u.rate=.93;speechSynthesis.speak(u);
  }
  window.speakText=speak;

  function periodCard(p){return `<a class="period-card" href="periode.html?id=${p.id}" style="background:${p.color}"><img src="${p.heroImage}" alt="" loading="lazy"><div class="period-content"><span class="period-icon">${p.icon}</span><div class="mini" style="color:#fff">${p.years}</div><h3>${p.title}</h3><p>${p.tagline}</p></div></a>`}
  function renderHome(){
    $('#period-grid').innerHTML=D.periods.map(periodCard).join('');
    const p=getProgress();const last=periodById(p.lastPeriod)||D.periods[0];
    $('#resume-link').href=`periode.html?id=${last.id}`;$('#resume-text').textContent=`Reprendre : ${last.title}`;
    const day=Math.floor(Date.now()/86400000);const challenges=[
      {icon:'🕵️',title:'Personnage mystère',text:'Découvre trois indices et identifie une figure historique.',url:'jeux.html#qui-suis-je'},
      {icon:'📰',title:'Une de journal mystère',text:'Observe une vraie une et retrouve l’événement annoncé.',url:'jeux.html#unes'},
      {icon:'🧩',title:'Défi chronologique',text:'Replace quatre événements dans le bon ordre.',url:'jeux.html#chronologie'},
      {icon:'🔎',title:'Dessin à décoder',text:'Repère les symboles et le point de vue d’une affiche de 1936.',url:'jeux.html#front-populaire'}
    ];const c=challenges[day%challenges.length];
    $('#daily-challenge').innerHTML=`<div class="challenge-icon">${c.icon}</div><div><div class="eyebrow" style="background:rgba(255,255,255,.12);color:#fff;border-color:transparent">Défi du jour</div><h3 style="font-size:1.5rem;margin:9px 0 3px">${c.title}</h3><p style="margin:0;color:rgba(255,255,255,.78)">${c.text}</p></div><a class="btn btn-secondary" href="${c.url}">Commencer →</a>`;
    $$('[data-route]').forEach(b=>b.addEventListener('click',()=>{location.href=b.dataset.route}));
  }

  function personCard(person){
    const tags=person.periods.map(id=>`<span class="tag">${periodById(id)?.title||id}</span>`).join('');
    return `<article class="card person-card" id="person-${person.id}">${safeImage(person)}<div><div class="tag-row">${tags}</div><h3>${person.name}</h3><div class="mini"><strong>${person.dates}</strong> · ${person.role}</div><p>${person.summary}</p><details><summary><strong>Trois éléments à retenir</strong></summary><ul>${person.remember.map(x=>`<li>${x}</li>`).join('')}</ul>${person.creditUrl?`<p class="mini"><a href="${person.creditUrl}" target="_blank" rel="noopener">Crédit de l’image : ${person.credit}</a></p>`:''}</details></div></article>`;
  }

  function renderPeriod(){
    const id=new URLSearchParams(location.search).get('id')||'ww1';const p=periodById(id)||D.periods[0];markVisited(p.id);
    document.title=`${p.title} — La classe virtuelle de Madame Lanquetin`;
    $('#period-hero').innerHTML=`<div class="hero-panel" style="background:linear-gradient(135deg,${p.color},#17324d)"><div class="breadcrumbs"><a href="periodes.html">Périodes</a> / ${p.title}</div><div class="period-hero"><div><div class="eyebrow" style="color:#17324d">${p.icon} ${p.years}</div><h1>${p.title}</h1><p style="font-size:1.12rem;color:rgba(255,255,255,.85)">${p.summary}</p><div class="button-row"><button class="btn btn-secondary" id="listen-summary">🔊 Écouter le résumé</button><a class="btn btn-coral" href="#defi">Faire le défi final</a></div><div class="stats">${p.stats.map(s=>`<div class="stat"><strong>${s.value}</strong><span>${s.label}</span></div>`).join('')}</div></div><div class="period-hero-image"><img src="${p.heroImage}" alt="Illustration de ${p.title}"><div class="image-credit">Image libre ou du domaine public — détails dans Sources et crédits</div></div></div></div>`;
    $('#listen-summary').addEventListener('click',()=>speak(`${p.title}. ${p.summary}`));
    $('#period-people').innerHTML=peopleFor(p.id).slice(0,6).map(personCard).join('');
    $('#period-timeline').innerHTML=p.events.map(e=>`<article class="timeline-item"><div class="timeline-date">${e.date}</div><h3>${e.title}</h3><p>${e.text}</p></article>`).join('');
    $('#vocab-grid').innerHTML=p.vocab.map(v=>`<div class="flashcard" tabindex="0" role="button" aria-label="Retourner la carte ${v.term}" aria-pressed="false"><div class="flashcard-inner"><div class="flash-side"><span class="mini">Clique pour retourner</span><h3 style="font-size:1.6rem">${v.term}</h3></div><div class="flash-side flash-back"><h3>${v.term}</h3><p>${v.definition}</p><button class="btn btn-secondary btn-small speak-vocab" data-text="${escapeHtml(v.term)}. ${escapeHtml(v.definition)}">🔊 Écouter</button></div></div></div>`).join('');
    $$('.flashcard').forEach(c=>{const flip=()=>{const flipped=c.classList.toggle('flipped');c.setAttribute('aria-pressed',String(flipped))};c.addEventListener('click',e=>{if(!e.target.closest('button'))flip()});c.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();flip()}})});
    $$('.speak-vocab').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();speak(b.dataset.text)}));
    $('#media-grid').innerHTML=p.media.map(m=>`<article class="card media-card"><div class="media-type">${m.type}</div><h3>${m.title}</h3><p class="mini">${m.duration}</p><a class="btn btn-secondary btn-small" href="${m.url}" target="_blank" rel="noopener">Ouvrir la ressource ↗</a></article>`).join('');
    $('#recap-grid').innerHTML=`<article class="card"><h3>5 dates essentielles</h3><ol>${p.events.slice(0,5).map(e=>`<li><strong>${e.date}</strong> — ${e.title}</li>`).join('')}</ol></article><article class="card"><h3>Personnages à reconnaître</h3><ul>${peopleFor(p.id).slice(0,5).map(x=>`<li>${x.name} — ${x.role}</li>`).join('')}</ul></article><article class="card"><h3>Mots à maîtriser</h3><div class="tag-row">${p.vocab.map(v=>`<span class="tag">${v.term}</span>`).join('')}</div></article>`;
    buildQuiz($('#period-quiz'),p.quiz,`period-${p.id}`);
  }

  function buildQuiz(container, questions, gameId){
    let i=0,score=0,answered=false;
    const render=()=>{const q=questions[i];container.innerHTML=`<div class="mini">Question ${i+1} sur ${questions.length}</div><h3>${q.q}</h3><div class="answer-list">${q.options.map((o,n)=>`<button class="answer-btn" data-n="${n}">${o}</button>`).join('')}</div><div id="quiz-feedback" aria-live="polite"></div>`;$$('.answer-btn',container).forEach(b=>b.addEventListener('click',()=>{if(answered)return;answered=true;const n=Number(b.dataset.n);if(n===q.answer){score++;b.classList.add('correct')}else{b.classList.add('wrong');$$('.answer-btn',container)[q.answer].classList.add('correct')}$('#quiz-feedback',container).innerHTML=`<div class="feedback"><strong>${n===q.answer?'Bonne réponse !':'Pas tout à fait.'}</strong> ${q.explanation}<div style="margin-top:10px"><button class="btn btn-primary btn-small" id="quiz-next">${i===questions.length-1?'Voir mon résultat':'Question suivante'}</button></div></div>`;$('#quiz-next',container).addEventListener('click',()=>{answered=false;i++;if(i<questions.length)render();else finish()})}))};
    const finish=()=>{const pct=Math.round(score/questions.length*100);container.innerHTML=`<div style="text-align:center"><div style="font-size:3rem">${pct>=70?'🏅':'🌱'}</div><h3>${score} / ${questions.length}</h3><p>${pct>=70?'Les repères essentiels sont acquis.':'Relis les explications puis recommence : chaque essai consolide la mémoire.'}</p><button class="btn btn-primary" id="quiz-restart">Recommencer</button></div>`;const p=getProgress();p.gamesPlayed++;p.bestScores[gameId]=Math.max(p.bestScores[gameId]||0,pct);if(pct>=70&&!p.completedQuizzes.includes(gameId))p.completedQuizzes.push(gameId);saveProgress(p);$('#quiz-restart',container).addEventListener('click',()=>{i=0;score=0;answered=false;render()})};render();
  }

  function renderPeriods(){
    $('#all-periods').innerHTML=D.periods.map(p=>`<article class="card" style="border-top:7px solid ${p.color}"><div style="font-size:2.2rem">${p.icon}</div><div class="mini">${p.years}</div><h2 style="font-family:Georgia,serif">${p.title}</h2><p>${p.summary}</p><div class="button-row"><a class="btn btn-primary btn-small" href="periode.html?id=${p.id}">Explorer</a><a class="btn btn-secondary btn-small" href="frises-cartes.html?period=${p.id}">Voir sur la frise et la carte</a></div></article>`).join('');
  }

  function renderPeople(){
    const grid=$('#people-grid');const search=$('#people-search');let filter='all';
    const render=()=>{const q=(search.value||'').toLowerCase();const list=D.people.filter(p=>(filter==='all'||p.periods.includes(filter))&&(p.name+' '+p.role+' '+p.summary).toLowerCase().includes(q));grid.innerHTML=list.map(personCard).join('')||'<p>Aucun personnage ne correspond.</p>'};
    $('#people-filters').innerHTML=`<button class="filter-btn active" data-filter="all">Tous</button>`+D.periods.map(p=>`<button class="filter-btn" data-filter="${p.id}">${p.title}</button>`).join('');
    $$('.filter-btn').forEach(b=>b.addEventListener('click',()=>{$$('.filter-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');filter=b.dataset.filter;render()}));search.addEventListener('input',render);render();
    const id=new URLSearchParams(location.search).get('person');if(id)setTimeout(()=>document.getElementById(`person-${id}`)?.scrollIntoView({behavior:'smooth'}),100);
  }

  function renderTimelineMaps(){
    const requested=new URLSearchParams(location.search).get('period')||'ww1';
    $('#timeline-filter').innerHTML=D.periods.map(p=>`<button class="filter-btn ${p.id===requested?'active':''}" data-period="${p.id}">${p.title}</button>`).join('');
    const renderTimeline=id=>{const p=periodById(id);$('#global-timeline').innerHTML=p.events.map(e=>`<article class="timeline-item"><div class="timeline-date">${e.date}</div><h3>${e.title}</h3><p>${e.text}</p></article>`).join('')};
    $$('.filter-btn',$('#timeline-filter')).forEach(b=>b.addEventListener('click',()=>{$$('.filter-btn',$('#timeline-filter')).forEach(x=>x.classList.remove('active'));b.classList.add('active');renderTimeline(b.dataset.period)}));renderTimeline(requested);
    setupMap(requested);
  }

  function setupMap(initial){
    const select=$('#map-period');
    select.innerHTML=D.mapSets.map(m=>`<option value="${m.id}" ${m.id===initial?'selected':''}>${m.title}</option>`).join('');
    const stage=$('#history-map');
    const projectBounds=(coords)=>{
      if(!coords.length)return {minLat:-60,maxLat:75,minLng:-170,maxLng:180};
      let minLat=Math.min(...coords.map(c=>c[0])),maxLat=Math.max(...coords.map(c=>c[0]));
      let minLng=Math.min(...coords.map(c=>c[1])),maxLng=Math.max(...coords.map(c=>c[1]));
      const latPad=Math.max((maxLat-minLat)*.28,6),lngPad=Math.max((maxLng-minLng)*.25,8);
      minLat=Math.max(-85,minLat-latPad);maxLat=Math.min(85,maxLat+latPad);minLng=Math.max(-180,minLng-lngPad);maxLng=Math.min(180,maxLng+lngPad);
      if(maxLat-minLat<18){const mid=(minLat+maxLat)/2;minLat=mid-9;maxLat=mid+9}
      if(maxLng-minLng<24){const mid=(minLng+maxLng)/2;minLng=mid-12;maxLng=mid+12}
      return {minLat,maxLat,minLng,maxLng};
    };
    const renderLayer=(set,index)=>{
      const layer=set.layers[index];
      const coords=[...layer.markers.map(m=>[m.lat,m.lng]),...layer.lines.flat()];
      const b=projectBounds(coords);
      const pos=([lat,lng])=>({x:8+(lng-b.minLng)/(b.maxLng-b.minLng)*84,y:9+(b.maxLat-lat)/(b.maxLat-b.minLat)*80});
      const lines=layer.lines.map(line=>`<polyline points="${line.map(c=>{const p=pos(c);return `${p.x},${p.y}`}).join(' ')}" />`).join('');
      const markers=layer.markers.map((m,n)=>{const p=pos([m.lat,m.lng]);return `<button class="local-map-marker" style="--map-x:${p.x}%;--map-y:${p.y}%" aria-label="Lieu ${n+1} : ${escapeHtml(m.label)}" data-map-label="${escapeHtml(m.label)}"><span>${n+1}</span></button>`}).join('');
      stage.innerHTML=`<div class="local-map-stage" role="group" aria-label="Carte schématique locale : ${escapeHtml(set.title)}, couche ${escapeHtml(layer.label)}"><svg class="local-map-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path class="map-globe" d="M8 50 Q25 8 50 9 Q76 8 92 50 Q76 91 50 91 Q25 92 8 50Z"/><path class="map-grid" d="M8 50H92 M50 9V91 M18 29H82 M18 71H82 M29 14V86 M71 14V86"/>${lines}</svg>${markers}<div class="map-compass" aria-hidden="true">N ↑</div></div><p class="mini privacy-map-note">Carte schématique générée dans le navigateur : aucun fond cartographique ni traceur externe n’est chargé.</p><div id="map-live" class="sr-only" aria-live="polite"></div>`;
      $('#map-description').innerHTML=`<strong>${escapeHtml(layer.label)}</strong><ol>${layer.markers.map(m=>`<li>${escapeHtml(m.label)}</li>`).join('')}</ol>`;
      $$('.local-map-marker',stage).forEach(btn=>btn.addEventListener('click',()=>{$('#map-live').textContent=btn.dataset.mapLabel;btn.classList.add('selected');setTimeout(()=>btn.classList.remove('selected'),900)}));
      $$('.layer-btn').forEach((button,n)=>button.classList.toggle('active',n===index));
    };
    const loadSet=id=>{
      const set=D.mapSets.find(m=>m.id===id)||D.mapSets[0];
      $('#map-title').textContent=set.title;
      $('#map-legend').innerHTML=set.legend.map(x=>`<span class="tag">${escapeHtml(x)}</span>`).join('');
      $('#layer-buttons').innerHTML=set.layers.map((l,i)=>`<button class="layer-btn ${i===0?'active':''}" data-layer="${i}">${escapeHtml(l.label)}</button>`).join('');
      $$('.layer-btn').forEach(b=>b.addEventListener('click',()=>renderLayer(set,Number(b.dataset.layer))));
      renderLayer(set,0);
    };
    select.addEventListener('change',()=>loadSet(select.value));loadSet(initial);
  }

  function renderGames(){
    const allQuiz=D.periods.flatMap(p=>p.quiz.map(q=>({...q,period:p.title}))).sort(()=>Math.random()-.5).slice(0,8);buildQuiz($('#quick-quiz'),allQuiz,'quick-quiz');
    let whoIndex=0;const whoList=D.people.slice().sort(()=>Math.random()-.5);
    const renderWho=()=>{const p=whoList[whoIndex%whoList.length];$('#who-game').innerHTML=`<div class="mini">Personnage mystère</div><div id="clues"><p>Indice 1 : ${p.remember[0]}</p></div><div class="button-row"><button class="btn btn-secondary" id="more-clue">Un autre indice</button><button class="btn btn-primary" id="reveal-who">Révéler</button></div><div id="who-answer" aria-live="polite"></div>`;let c=1;$('#more-clue').addEventListener('click',()=>{if(c<p.remember.length){$('#clues').insertAdjacentHTML('beforeend',`<p>Indice ${c+1} : ${p.remember[c]}</p>`);c++}});$('#reveal-who').addEventListener('click',()=>{$('#who-answer').innerHTML=`<div class="feedback"><strong>${p.name}</strong> (${p.dates}) — ${p.role}<br><button class="btn btn-primary btn-small" id="next-who">Personnage suivant</button></div>`;$('#next-who').addEventListener('click',()=>{whoIndex++;renderWho()})})};renderWho();
    let newsIndex=0;const renderNews=()=>{const n=D.newspapers[newsIndex%D.newspapers.length];$('#newspaper-game').innerHTML=`<div class="document-viewer"><div class="newspaper"><img src="${n.image}" alt="Une de ${n.title}" loading="lazy"><p class="mini"><a href="${n.sourceUrl}" target="_blank" rel="noopener">Voir le document et ses droits sur Wikimedia Commons</a></p></div><div><h3>${n.title}</h3><p>${n.question}</p><div class="answer-list">${n.options.map((o,i)=>`<button class="answer-btn" data-n="${i}">${o}</button>`).join('')}</div><div id="news-feedback" aria-live="polite"></div></div></div>`;$$('.answer-btn',$('#newspaper-game')).forEach(b=>b.addEventListener('click',()=>{const ok=Number(b.dataset.n)===n.answer;$$('.answer-btn',$('#newspaper-game')).forEach((x,i)=>x.classList.toggle('correct',i===n.answer));if(!ok)b.classList.add('wrong');$('#news-feedback').innerHTML=`<div class="feedback"><strong>${ok?'Bien observé !':'Regarde le titre, la date et le point de vue du journal.'}</strong> ${n.explanation}<br><button class="btn btn-primary btn-small" id="next-news">Une suivante</button></div>`;$('#next-news').addEventListener('click',()=>{newsIndex++;renderNews()})}))};renderNews();
    renderPosterGame();renderOrderGame();
  }

  function renderPosterGame(){const a=D.posterActivity;let i=0;const box=$('#poster-game');const render=()=>{const q=a.questions[i];box.innerHTML=`<div class="document-viewer"><div class="doc-image"><img src="${a.image}" alt="Affiche hostile au Front populaire" loading="lazy"><p class="mini"><a href="${a.sourceUrl}" target="_blank" rel="noopener">Source et droits du document</a></p></div><div><h3>${a.title}</h3><div class="notice">Décris d’abord ce que tu vois avant d’interpréter.</div><p><strong>${q.q}</strong></p><div class="answer-list">${q.options.map((o,n)=>`<button class="answer-btn" data-n="${n}">${o}</button>`).join('')}</div><div id="poster-feedback" aria-live="polite"></div></div></div>`;$$('.answer-btn',box).forEach(b=>b.addEventListener('click',()=>{const n=Number(b.dataset.n);$$('.answer-btn',box)[q.answer].classList.add('correct');if(n!==q.answer)b.classList.add('wrong');$('#poster-feedback',box).innerHTML=`<div class="feedback">${q.explanation}<br><button class="btn btn-primary btn-small" id="poster-next">${i===a.questions.length-1?'Recommencer':'Question suivante'}</button></div>`;$('#poster-next',box).addEventListener('click',()=>{i=(i+1)%a.questions.length;render()})}))};render()}
  function renderOrderGame(){const eventPool=D.periods.flatMap(p=>p.events.map(e=>({...e,period:p.title})));let selected=[];const box=$('#order-game');const newRound=()=>{selected=eventPool.slice().sort(()=>Math.random()-.5).slice(0,4).sort((a,b)=>Math.random()-.5);render()};const render=()=>{box.innerHTML=`<p>Clique les quatre événements du plus ancien au plus récent.</p><div class="answer-list">${selected.map((e,i)=>`<button class="answer-btn" data-i="${i}"><strong>${e.title}</strong><br><span class="mini">${e.period}</span></button>`).join('')}</div><div id="order-feedback" aria-live="polite"></div>`;let chosen=[];$$('.answer-btn',box).forEach(b=>b.addEventListener('click',()=>{if(b.disabled)return;b.disabled=true;b.style.opacity=.55;chosen.push(selected[Number(b.dataset.i)]);if(chosen.length===selected.length){const ok=chosen.every((e,i)=>e.year===[...chosen].sort((a,b)=>a.year-b.year)[i].year);$('#order-feedback',box).innerHTML=`<div class="feedback"><strong>${ok?'Ordre correct !':'Pas encore.'}</strong><ol>${[...selected].sort((a,b)=>a.year-b.year).map(e=>`<li>${e.date} — ${e.title}</li>`).join('')}</ol><button class="btn btn-primary btn-small" id="new-order">Nouveau défi</button></div>`;$('#new-order',box).addEventListener('click',newRound)}}))};newRound()}

  function renderMethod(){
    const steps=[
      ['Identifier','Quel est le type de document ? Qui l’a produit ? Quand et où a-t-il été publié ?'],
      ['Décrire','Nommer les personnages, objets, textes, couleurs et symboles sans encore interpréter.'],
      ['Contextualiser','Relier le document à un événement, un débat et un public précis.'],
      ['Décoder','Expliquer les symboles, les exagérations, les oppositions et les références.'],
      ['Interpréter','Formuler le message, le point de vue et l’objectif de l’auteur.'],
      ['Rédiger','Appuyer chaque idée sur un élément précis du document.']
    ];$('#method-steps').innerHTML=steps.map((s,i)=>`<article class="card method-step"><div class="method-number">${i+1}</div><div><h3>${s[0]}</h3><p>${s[1]}</p></div></article>`).join('');
    const prompts=['Ce document est…','Il a été publié en… par…','Au premier plan, on observe…','Le symbole de… représente…','L’auteur cherche à…','Le document montre donc que…'];$('#sentence-starters').innerHTML=prompts.map(x=>`<button class="filter-btn copy-prompt" data-text="${escapeHtml(x)}">${x}</button>`).join('');$$('.copy-prompt').forEach(b=>b.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(b.dataset.text);b.textContent='Copié !'}catch{b.textContent=b.dataset.text}}));
  }

  function renderMedia(){
    $('#media-all').innerHTML=D.periods.map(p=>`<section class="card"><div class="tag" style="background:${p.color};color:#fff">${p.title}</div><h2 style="font-family:Georgia,serif">Écouter, regarder, explorer</h2><button class="btn btn-primary btn-small listen-period" data-id="${p.id}">🔊 Écouter notre résumé</button><div class="grid grid-3" style="margin-top:18px">${p.media.map(m=>`<article class="card media-card"><div class="media-type">${m.type}</div><h3>${m.title}</h3><p class="mini">${m.duration}</p><a class="btn btn-secondary btn-small" href="${m.url}" target="_blank" rel="noopener">Ouvrir ↗</a></article>`).join('')}</div></section>`).join('');$$('.listen-period').forEach(b=>b.addEventListener('click',()=>{const p=periodById(b.dataset.id);speak(`${p.title}. ${p.summary}`)}));
  }

  function renderProgress(){
    const p=getProgress();const pct=Math.round(p.visited.length/D.periods.length*100);$('#progress-summary').innerHTML=`<article class="card"><div class="mini">Périodes explorées</div><h2>${p.visited.length} / ${D.periods.length}</h2><div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div></article><article class="card"><div class="mini">Défis réussis à 70 % ou plus</div><h2>${p.completedQuizzes.length}</h2></article><article class="card"><div class="mini">Parties terminées</div><h2>${p.gamesPlayed}</h2></article>`;
    const badges=[
      {icon:'🧭',title:'Premier repère',text:'Explorer une première période',ok:p.visited.length>=1},
      {icon:'🗺️',title:'Voyage dans le temps',text:'Explorer trois périodes',ok:p.visited.length>=3},
      {icon:'🏛️',title:'Tour d’horizon',text:'Explorer les six périodes',ok:p.visited.length>=6},
      {icon:'🏅',title:'Défi relevé',text:'Réussir un quiz à 70 %',ok:p.completedQuizzes.length>=1},
      {icon:'🧠',title:'Mémoire solide',text:'Réussir trois quiz',ok:p.completedQuizzes.length>=3}
    ];$('#badge-grid').innerHTML=badges.map(b=>`<article class="card badge ${b.ok?'':'locked'}"><div class="badge-icon">${b.icon}</div><div><h3>${b.title}</h3><p class="mini">${b.text}</p></div></article>`).join('');
    if(!storageAvailable){$('#progress-storage-warning')?.classList.remove('hidden')}
    $('#export-progress').addEventListener('click',()=>{const blob=new Blob([JSON.stringify(p,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='progression-classe-madame-lanquetin.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),0)});
    $('#import-progress').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const x=JSON.parse(r.result);saveProgress({...defaultProgress,...x});location.reload()}catch{alert('Ce fichier ne semble pas être une sauvegarde valide.')}};r.readAsText(f)});
    $('#reset-progress').addEventListener('click',()=>{if(confirm('Effacer toute la progression enregistrée uniquement sur cet appareil ?')){try{localStorage.removeItem(storeKey)}catch{}location.reload()}});
  }

  function renderSources(){
    $('#source-list').innerHTML=D.sources.map(s=>`<div class="source-row"><div><strong>${s.name}</strong><div class="mini">${s.type}</div></div><a class="btn btn-secondary btn-small" href="${s.url}" target="_blank" rel="noopener">Consulter ↗</a></div>`).join('');
    const credits=D.people.filter(p=>p.creditUrl).map(p=>`<li><a href="${p.creditUrl}" target="_blank" rel="noopener">${p.name}</a> — ${p.credit}</li>`).join('');
    $('#image-credits').innerHTML=`<ul>${credits}<li><a href="https://commons.wikimedia.org/wiki/File:Berlin_Wall_Collapse_(cropped).jpg" target="_blank" rel="noopener">Chute du mur de Berlin</a> — Sue Ream, CC BY 3.0</li><li><a href="https://commons.wikimedia.org/wiki/File:Gr%C3%A9vistes-m%C3%A9tallurgie-usine-banlieue-Paris1936.jpg" target="_blank" rel="noopener">Grévistes de la métallurgie en 1936</a> — domaine public</li><li><a href="https://commons.wikimedia.org/wiki/File:Le-Populaire-4-mai-1936.jpg" target="_blank" rel="noopener">Le Populaire, 4 mai 1936</a> — document patrimonial</li><li><a href="https://commons.wikimedia.org/wiki/File:Regards_-_cong%C3%A9s_pay%C3%A9s_1936.jpg" target="_blank" rel="noopener">Regards, congés payés 1936</a> — domaine public</li><li><a href="https://commons.wikimedia.org/wiki/File:Soviets-ficelles-Front-populaire.jpeg" target="_blank" rel="noopener">Affiche anticommuniste de 1936</a> — BnF / Wikimedia Commons</li></ul>`;
  }

  function init(){setupNav();setupSearch();setupAccessibility();
    if(page==='home')renderHome();if(page==='period')renderPeriod();if(page==='periods')renderPeriods();if(page==='people')renderPeople();if(page==='timeline')renderTimelineMaps();if(page==='games')renderGames();if(page==='method')renderMethod();if(page==='media')renderMedia();if(page==='progress')renderProgress();if(page==='sources')renderSources();
    setupExternalLinks();
    if('serviceWorker' in navigator){navigator.serviceWorker.getRegistrations().then(regs=>Promise.all(regs.map(r=>r.unregister()))).catch(()=>{});}if('caches' in window){caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('lanquetin-')).map(k=>caches.delete(k)))).catch(()=>{});}
  }
  document.addEventListener('DOMContentLoaded',init);
})();
