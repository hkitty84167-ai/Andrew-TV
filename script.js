/* eslint-disable no-unused-vars */
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

// ----- Mock catalog (royalty-free sources) -----
const CATALOG = [
  {
    id: "sintel",
    title: "Sintel",
    type: "movie",
    year: 2010,
    durationMin: 14,
    tags: ["Animation","Fantasy","Adventure"],
    description: "A young huntress tracks a dragon through a harsh world in this open movie by the Blender Foundation.",
    poster: "https://mango.blender.org/wp-content/themes/mango/images/project_files/sintel_poster.jpg",
    artwork: "https://download.blender.org/durian/trailer/sintel_trailer-480p.jpg",
    sources: [
      { label: "720p MP4", src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4", type: "video/mp4" }
    ]
  },
  {
    id: "bbb",
    title: "Big Buck Bunny",
    type: "movie",
    year: 2008,
    durationMin: 10,
    tags: ["Animation","Comedy","Short"],
    description: "The classic open film featuring a gentle giant bunny and his forest foes.",
    poster: "https://peach.blender.org/wp-content/uploads/title_anouncement.jpg",
    artwork: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg",
    sources: [
      { label: "720p MP4", src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", type: "video/mp4" }
    ]
  },
  {
    id: "tos",
    title: "Tears of Steel",
    type: "movie",
    year: 2012,
    durationMin: 12,
    tags: ["Sci-Fi","Short"],
    description: "A live-action sci-fi short film made with open content and Blender.",
    poster: "https://mango.blender.org/wp-content/uploads/2013/05/tears_of_steel.jpg",
    artwork: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/TearsOfSteel.jpg",
    sources: [
      { label: "720p MP4", src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4", type: "video/mp4" }
    ]
  },
  {
    id: "elephants",
    title: "Elephant Dream",
    type: "movie",
    year: 2006,
    durationMin: 10,
    tags: ["Animation","Experimental"],
    description: "The first open movie project from the Blender Foundation.",
    poster: "https://orange.blender.org/wp-content/themes/orange/images/common/ed_header.jpg",
    artwork: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Elephants_Dream_s5_both.jpg/640px-Elephants_Dream_s5_both.jpg",
    sources: [
      { label: "720p MP4", src: "https://archive.org/download/ElephantsDream/ed_1024_512kb.mp4", type: "video/mp4" }
    ]
  },
  {
    id: "live-news",
    title: "Andrew News Live",
    type: "live",
    year: 2025,
    durationMin: null,
    tags: ["Live","News"],
    description: "Demo live channel (24/7 stream).",
    poster: "https://i.imgur.com/6o5K1S4.jpeg",
    artwork: "https://i.imgur.com/7Dn45bF.jpeg",
    sources: [
      // Public demo HLS stream (Apple sample)
      { label: "HLS", src: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", type: "application/x-mpegURL" }
    ]
  }
];

// --- State & storage helpers ---
const store = {
  get(k, def){ try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; } },
  set(k, v){ localStorage.setItem(k, JSON.stringify(v)); }
};
const state = {
  theme: document.documentElement.dataset.theme || 'dark',
  activeSection: 'home',
  query: '',
  favorites: new Set(store.get('favorites', [])),
  continue: store.get('continue', {}), // {id: time}
  prefs: store.get('prefs', { autoplay: true, largeText: false }),
  selection: null // currently highlighted item
};
function persist(){
  store.set('favorites', [...state.favorites]);
  store.set('continue', state.continue);
  store.set('prefs', state.prefs);
}

// --- UI builders ---
function pill(text){ const s=document.createElement('span'); s.className='pill'; s.textContent=text; return s; }

function buildCard(item){
  const el = document.createElement('div');
  el.className = 'card';
  el.tabIndex = 0;
  el.dataset.id = item.id;
  el.innerHTML = `
    <img src="${item.poster}" alt="${item.title} poster" loading="lazy" />
    <div class="meta">
      <div class="title">${item.title}</div>
      <div class="desc">${item.description}</div>
      <div class="pillbar">${item.tags.map(t=>'<span class="pill">'+t+'</span>').join('')}</div>
    </div>`;
  el.addEventListener('click', ()=> openDetails(item));
  el.addEventListener('keydown', (e)=>{
    if(e.key === 'Enter') play(item);
    if(e.key.toLowerCase() === 'f') toggleFavorite(item);
  });
  return el;
}

function buildRow(title, items){
  const row = document.createElement('section');
  row.className = 'row';
  row.innerHTML = `<h3>${title}</h3>`;
  const scroller = document.createElement('div');
  scroller.className = 'scroller';
  items.forEach(it => scroller.appendChild(buildCard(it)));
  row.appendChild(scroller);
  return row;
}

function renderHome(){
  $('#hero').style.display = 'block';
  const rows = $('#rows'); rows.innerHTML='';
  const q = state.query.toLowerCase();
  const items = CATALOG.filter(i => [i.title, i.description, ...(i.tags||[])].join(' ').toLowerCase().includes(q));
  if(!items.length){
    rows.innerHTML = '<p class="muted" style="padding:.5rem 0">No results. Try a different search.</p>';
    return;
  }
  const featured = items[0];
  setHero(featured);
  rows.appendChild(buildRow('Popular on Andrew TV', items));
  const movies = items.filter(i=>i.type==='movie');
  if(movies.length) rows.appendChild(buildRow('Movies', movies));
  const live = items.filter(i=>i.type==='live');
  if(live.length) rows.appendChild(buildRow('Live Channels', live));
  const favs = items.filter(i=> state.favorites.has(i.id));
  if(favs.length) rows.appendChild(buildRow('Your Favorites', favs));
  const cont = items.filter(i=> state.continue[i.id] > 0);
  if(cont.length) rows.appendChild(buildRow('Continue Watching', cont));
}

function renderTvGuide() {
  const rows = $('#rows');
  rows.innerHTML = '';
  $('#hero').style.display = 'none'; // Hide hero on guide page

  const guideContainer = document.createElement('div');
  guideContainer.className = 'guide';

  // --- Generate Timeline ---
  const timeline = document.createElement('div');
  timeline.className = 'guide-timeline';
  const now = new Date();
  now.setMinutes(0, 0, 0); // Start from the top of the hour

  // Create a "channel" column header
  const channelHeader = document.createElement('div');
  channelHeader.className = 'guide-channel-info-header';
  channelHeader.textContent = 'Channel';
  timeline.appendChild(channelHeader);

  for (let i = 0; i < 6; i++) { // 3 hours of programming, 30-min slots
    const timeSlot = document.createElement('div');
    timeSlot.className = 'guide-time';
    const hour = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    timeSlot.textContent = `${displayHour}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    timeline.appendChild(timeSlot);
    now.setMinutes(now.getMinutes() + 30);
  }
  guideContainer.appendChild(timeline);

  // --- Generate Channels & Programs ---
  const channels = CATALOG.filter(i => i.type === 'live');
  const programs = CATALOG.filter(i => i.type !== 'live');
  let progIdx = 0;

  channels.forEach(channel => {
    const channelRow = document.createElement('div');
    channelRow.className = 'guide-channel';

    const channelInfo = document.createElement('div');
    channelInfo.className = 'guide-channel-info';
    channelInfo.textContent = channel.title;
    channelRow.appendChild(channelInfo);

    const programsContainer = document.createElement('div');
    programsContainer.className = 'guide-programs';

    // Create some fake programs
    let timeCursor = 0;
    while(timeCursor < 180) { // 3 hours in minutes
        const programItem = programs[progIdx % programs.length];
        progIdx++;
        const programBlock = document.createElement('div');
        programBlock.className = 'guide-program';
        programBlock.innerHTML = `<span>${programItem.title}</span><span class="muted">${programItem.durationMin} min</span>`;
        const duration = programItem.durationMin || 30;
        // 1 minute = 4px width. Total width is 180 * 4 = 720px
        programBlock.style.width = `${duration * 4}px`;
        programBlock.onclick = () => play(channel);
        programsContainer.appendChild(programBlock);
        timeCursor += duration;
    }

    channelRow.appendChild(programsContainer);
    guideContainer.appendChild(channelRow);
  });

  rows.appendChild(guideContainer);
}

function setHero(item){
  $('#heroTitle').textContent = item.title;
  $('#heroDesc').textContent = item.description;
  $('#heroImg').src = item.artwork || item.poster;
  $('#heroPlay').onclick = ()=> play(item);
  $('#heroFav').onclick = ()=> toggleFavorite(item);
  $('#heroDetails').onclick = ()=> openDetails(item);
  state.selection = item;
}

// --- Details modal ---
function openDetails(item){
  $('#detailsTitle').textContent = item.title;
  $('#detailsDesc').textContent = item.description;
  $('#detailsImg').src = item.poster;
  $('#detailsMeta').textContent = [item.type, item.year, item.durationMin? (item.durationMin+' min') : 'Live'].filter(Boolean).join(' • ');
  const tags = $('#detailsTags'); tags.innerHTML=''; (item.tags||[]).forEach(t=> tags.appendChild(pill(t)));
  $('#detailsPlay').onclick = ()=> { details.close(); play(item); };
  $('#detailsFav').onclick = ()=> toggleFavorite(item);
  const details = $('#detailsModal');
  details.showModal();
}
$('#detailsClose').addEventListener('click', ()=> $('#detailsModal').close());

// --- Favorites ---
function toggleFavorite(item){
  if(state.favorites.has(item.id)) state.favorites.delete(item.id);
  else state.favorites.add(item.id);
  persist();
  renderHome();
}

// --- Player ---
const video = $('#video');
function play(item){
  // Prefer HLS if available and supported via native video or hls.js fallback (not included to keep demo simple)
  const src = item.sources[0];
  video.innerHTML = '';
  const source = document.createElement('source');
  source.src = src.src;
  source.type = src.type;
  video.appendChild(source);
  $('#playerTitle').textContent = item.title;
  $('#playerDesc').textContent = item.description;
  $('#playerDrawer').classList.add('open');
  video.play().catch(()=>{});
  state.selection = item;
  // restore last time if exists
  if(state.continue[item.id]) { video.currentTime = state.continue[item.id]; }
}
$('#btnClose').addEventListener('click', ()=> $('#playerDrawer').classList.remove('open'));
$('#btnPlayPause').addEventListener('click', ()=> { if(video.paused) video.play(); else video.pause(); });
$('#btnSeekBack').addEventListener('click', ()=> video.currentTime = Math.max(0, video.currentTime - 10));
$('#btnSeekFwd').addEventListener('click', ()=> video.currentTime = Math.min(video.duration||1e9, video.currentTime + 10));
$('#btnFavorite').addEventListener('click', ()=> state.selection && toggleFavorite(state.selection));
$('#btnPip').addEventListener('click', async ()=> { if(document.pictureInPictureEnabled && !video.disablePictureInPicture){ try { await video.requestPictureInPicture(); } catch(e){} } });

// Save progress
video.addEventListener('timeupdate', ()=> {
  if(!state.selection) return;
  state.continue[state.selection.id] = Math.floor(video.currentTime);
  persist();
});
video.addEventListener('ended', ()=> {
  if(state.selection) { state.continue[state.selection.id] = 0; persist(); }
  if(state.prefs.autoplay){
    // autoplay next catalog item
    const idx = CATALOG.findIndex(i=>i.id===state.selection.id);
    const next = CATALOG[(idx+1)%CATALOG.length];
    setTimeout(()=> play(next), 600);
  }
});

// --- Navigation & sections (simple demo uses same renderer with filters) ---
$('#navList').addEventListener('click', (e)=>{
  const li = e.target.closest('li'); if(!li) return;
  $$('#navList li').forEach(x=>x.classList.remove('active'));
  li.classList.add('active');
  state.activeSection = li.dataset.section;
  applySectionFilter();
});
function applySectionFilter(){
  state.query = $('#search').value.trim();
  const section = state.activeSection;
  if(section === 'favorites'){
    const items = CATALOG.filter(i=> state.favorites.has(i.id));
    $('#rows').innerHTML='';
    setHero(items[0] || CATALOG[0]);
    if(items.length) $('#rows').appendChild(buildRow('Your Favorites', items)); else $('#rows').innerHTML='<p class="muted" style="padding:.5rem 0">No favorites yet. Press “F” on any title to add it.</p>';
    return;
  }
  if(section === 'continue'){
    const items = CATALOG.filter(i=> state.continue[i.id] > 0);
    $('#rows').innerHTML='';
    setHero(items[0] || CATALOG[0]);
    if(items.length) $('#rows').appendChild(buildRow('Continue Watching', items)); else $('#rows').innerHTML='<p class="muted" style="padding:.5rem 0">Nothing to continue. Start something!</p>';
    return;
  }
  if(section === 'movies'){
    state.query = ''; $('#search').value=''; // show all movies
    const items = CATALOG.filter(i=> i.type==='movie');
    $('#rows').innerHTML='';
    setHero(items[0] || CATALOG[0]);
    $('#rows').appendChild(buildRow('Movies', items));
    return;
  }
  if(section === 'live'){
    const items = CATALOG.filter(i=> i.type==='live');
    $('#rows').innerHTML='';
    setHero(items[0] || CATALOG[0]);
    $('#rows').appendChild(buildRow('Live Channels', items));
    return;
  }
  if(section === 'guide'){
    renderTvGuide();
    return;
  }
  renderHome();
}

// --- Search ---
$('#search').addEventListener('input', ()=> { state.query = $('#search').value.trim(); renderHome(); });
window.addEventListener('keydown', (e)=>{
  if(e.key === '/' && document.activeElement !== $('#search')){ e.preventDefault(); $('#search').focus(); }
});

// --- Theme & settings ---
function applyTheme(){
  document.documentElement.dataset.theme = state.theme;
  document.body.classList.toggle('large-text', !!state.prefs.largeText);
}
$('#toggleTheme').addEventListener('click', ()=>{
  state.theme = (state.theme === 'dark') ? 'light' : 'dark';
  applyTheme();
});
window.addEventListener('keydown', (e)=>{
  if(e.key.toLowerCase() === 'd'){ state.theme = (state.theme === 'dark') ? 'light' : 'dark'; applyTheme(); }
  if(e.key.toLowerCase() === 'f' && state.selection){ toggleFavorite(state.selection); }
  if(e.key === 'Escape'){ $('#playerDrawer').classList.remove('open'); }
  if(e.key === ' ' && $('#playerDrawer').classList.contains('open')){ e.preventDefault(); if(video.paused) video.play(); else video.pause(); }
  if(e.key === 'ArrowLeft' && $('#playerDrawer').classList.contains('open')){ video.currentTime = Math.max(0, video.currentTime - 10); }
  if(e.key === 'ArrowRight' && $('#playerDrawer').classList.contains('open')){ video.currentTime = Math.min(video.duration||1e9, video.currentTime + 10); }
});

// Settings modal
$('#openSettings').addEventListener('click', ()=> $('#settingsModal').showModal());
$('#settingsClose').addEventListener('click', ()=> $('#settingsModal').close());
$('#prefAutoplay').addEventListener('change', (e)=> { state.prefs.autoplay = e.target.checked; persist(); });
$('#prefLargeText').addEventListener('change', (e)=> { state.prefs.largeText = e.target.checked; applyTheme(); persist(); });

// --- Init ---
function init(){
  // load prefs
  $('#prefAutoplay').checked = !!state.prefs.autoplay;
  $('#prefLargeText').checked = !!state.prefs.largeText;
  applyTheme();
  // hash routing (optional)
  const fromHash = location.hash.slice(1);
  if(fromHash) state.activeSection = fromHash;
  $$('#navList li').forEach(li => { li.classList.toggle('active', li.dataset.section === state.activeSection); });
  renderHome();
}
init();
