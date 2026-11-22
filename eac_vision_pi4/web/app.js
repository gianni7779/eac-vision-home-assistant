'use strict';

const $ = id => document.getElementById(id);
const base = location.pathname.endsWith('/') ? location.pathname : location.pathname + '/';
const apiUrl = path => base + path;
let state = null, page = 'live', players = [], visibleIds = '', selectedCam = null, toastTimer = 0, hideTimer = 0, storageDirty = false;
let budget = Number(localStorage.getItem('eac-live-budget') || '4');
if (![4, 8, 16].includes(budget)) budget = 4;
$('live-budget').value = String(budget);

function toast(message) {
  const el = $('toast'); el.textContent = message; el.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 3500);
}
async function request(path, options = {}) {
  const response = await fetch(apiUrl(path), {cache:'no-store', ...options});
  if (!response.ok) throw new Error((await response.text()).slice(0, 250) || `HTTP ${response.status}`);
  return response.json();
}
function showControls() {
  document.body.classList.add('controls-visible');
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => { if (page === 'live' && !document.body.classList.contains('menu-open')) document.body.classList.remove('controls-visible'); }, 3500);
}
function setPage(next) {
  page = next;
  document.body.classList.toggle('live-mode', page === 'live');
  document.body.classList.remove('menu-open');
  document.body.classList.add('controls-visible');
  for (const name of ['live','recordings','settings']) $(name+'-page').hidden = name !== page;
  for (const el of document.querySelectorAll('.nav')) el.classList.toggle('active', el.dataset.page === page);
  $('page-title').textContent = ({live:'Telecamere',recordings:'Registrazioni',settings:'Impostazioni'})[page];
  $('top-subtitle').textContent = page === 'live' ? 'Vista Principale' : 'EAC Vision Pi 4';
  $('live-budget-label').hidden = page !== 'live';
  if (page !== 'live') { stopPlayers(); visibleIds = ''; }
  if (page === 'live') renderLive(true);
  if (page === 'recordings') loadRecordings();
  if (page === 'settings') renderSettings();
  showControls();
}

function stopPlayers() {
  players.forEach(p => p.stop()); players = [];
  for (const video of document.querySelectorAll('#camera-grid video')) { video.pause(); video.removeAttribute('src'); video.load(); }
}
function cameraRows(n) {
  const w = $('camera-grid').clientWidth || innerWidth, h = $('camera-grid').clientHeight || innerHeight;
  let best = 1, score = Infinity;
  for (let rows=1; rows<=n; rows++) {
    const avg = n/rows, ratio = (w/avg)/(h/rows);
    const cost = Math.abs(Math.log(ratio/(16/9))) + (rows * Math.ceil(avg)-n)*.06;
    if (cost < score) { score=cost; best=rows; }
  }
  const result=[], quotient=Math.floor(n/best), extra=n%best;
  for (let i=0;i<best;i++) result.push(quotient+(i<extra?1:0));
  return result;
}
function makeTile(cam, live) {
  const tile = document.createElement('div'); tile.className='tile'; tile.dataset.id=cam.id;
  const image = document.createElement('img'); image.alt=''; image.loading='lazy'; image.src=apiUrl('api/snapshot/'+encodeURIComponent(cam.id)+'?t='+Date.now()); tile.append(image);
  if (live) {
    const video=document.createElement('video'); video.autoplay=true; video.muted=true; video.playsInline=true; tile.append(video);
    const error=document.createElement('div'); error.className='tile-error'; error.hidden=true; tile.append(error);
    const player=new MsePlayer(video, cam.id, message => { error.textContent=message; error.hidden=false; video.style.display='none'; });
    players.push(player); player.start();
  }
  const shade=document.createElement('div'); shade.className='tile-shade';
  const name=document.createElement('span'); name.textContent=cam.name; shade.append(name);
  const badge=document.createElement('span'); badge.className='badge'; badge.textContent=live?'LIVE':'ANTEPRIMA'; shade.append(badge);
  tile.append(shade);
  if (cam.recording) { const rec=document.createElement('span'); rec.className='badge rec'; rec.textContent='● REC'; rec.style.cssText='position:absolute;top:12px;right:12px'; tile.append(rec); }
  tile.addEventListener('click', () => { tile.classList.add('focus'); setTimeout(()=>tile.classList.remove('focus'),3000); });
  return tile;
}
function renderLive(force=false) {
  if (!state || page !== 'live') return;
  const cams=state.cameras.filter(c=>c.selected&&c.has_source).slice(0,16);
  const signature=cams.map(c=>c.id+':'+c.name+':'+c.recording).join('|')+':'+budget;
  if (!force && signature===visibleIds) return;
  visibleIds=signature; stopPlayers();
  const grid=$('camera-grid'); grid.replaceChildren();
  $('empty-live').hidden=cams.length>0; grid.hidden=cams.length===0;
  if (!cams.length) return;
  let offset=0;
  for (const count of cameraRows(cams.length)) {
    const row=document.createElement('div'); row.className='grid-row';
    for (let i=0;i<count;i++) { const cam=cams[offset]; row.append(makeTile(cam,offset<budget)); offset++; }
    grid.append(row);
  }
}

class MsePlayer {
  constructor(video,id,onError) { this.video=video;this.id=id;this.onError=onError;this.queue=[];this.closed=false;this.started=false;this.lastData=Date.now(); }
  start() {
    if (!window.MediaSource) { this.onError('Anteprima disponibile'); return; }
    const codecs=['avc1.640029','avc1.64002A','avc1.640033','avc1.42E01E','hvc1.1.6.L153.B0'].filter(c=>MediaSource.isTypeSupported('video/mp4; codecs="'+c+'"')).join(',');
    const url=new URL(apiUrl('api/live/'+encodeURIComponent(this.id)),location.origin); url.protocol=location.protocol==='https:'?'wss:':'ws:';
    const ws=new WebSocket(url); this.ws=ws; ws.binaryType='arraybuffer';
    ws.onopen=()=>ws.send(JSON.stringify({type:'mse',value:codecs}));
    ws.onmessage=event=>{
      if (this.closed) return;
      this.lastData=Date.now();
      if (typeof event.data==='string') { let message;try{message=JSON.parse(event.data)}catch{return} if(message.type==='mse')this.setup(message.value);else if(message.type==='error')this.onError('Video non disponibile');return; }
      this.queue.push(new Uint8Array(event.data));this.flush();
    };
    ws.onclose=()=>{if(!this.closed)this.onError('Live interrotto')};
    this.watch=setInterval(()=>{if(!this.closed&&Date.now()-this.lastData>15000)this.onError('Il live non parte')},3000);
  }
  setup(mime) {
    try {
      this.ms=new MediaSource(); const objectURL=URL.createObjectURL(this.ms); this.objectURL=objectURL;this.video.src=objectURL;
      this.ms.addEventListener('sourceopen',()=>{if(this.closed)return;try{this.sb=this.ms.addSourceBuffer(mime);this.sb.addEventListener('updateend',()=>this.updated());this.flush()}catch{this.onError('Codec non supportato sul dispositivo')}});
    } catch { this.onError('Video non supportato'); }
  }
  flush() {
    if(!this.sb||this.sb.updating||!this.queue.length||this.closed)return;
    let total=0;for(const q of this.queue)total+=q.length;
    const data=new Uint8Array(total);let at=0;for(const q of this.queue){data.set(q,at);at+=q.length}this.queue=[];
    try{this.sb.appendBuffer(data)}catch{try{const b=this.sb.buffered;if(b.length)this.sb.remove(b.start(0),Math.max(b.start(0),b.end(b.length-1)-3))}catch{}this.queue.unshift(data)}
  }
  updated() {
    if(this.closed||!this.sb)return;
    try{const b=this.sb.buffered;if(b.length){const start=b.start(0),end=b.end(b.length-1);if(!this.started&&end>start){this.started=true;this.video.currentTime=Math.max(start,end-.6);this.video.play().catch(()=>{})}if(end-this.video.currentTime>4)this.video.currentTime=end-.5;if(end-start>30){this.sb.remove(start,end-15);return}}}catch{}
    this.flush();
  }
  stop() {this.closed=true;clearInterval(this.watch);if(this.ws)this.ws.close();if(this.video)this.video.pause();if(this.objectURL)URL.revokeObjectURL(this.objectURL)}
}

async function update() {
  try {
    state=await request('api/status');
    $('ha-dot').classList.toggle('ok',!state.ha_error);
    $('ha-label').textContent=state.ha_error?'Home Assistant non disponibile':'Home Assistant collegato';
    if(page==='settings')renderSettings();
    if(page==='live')renderLive();
  } catch(error) { toast('Servizio non disponibile: '+error.message); }
}
function renderSettings() {
  if(!state)return;
  $('ha-error').hidden=!state.ha_error;$('ha-error').textContent=state.ha_error||'';
  $('video-error').hidden=state.relay&&state.ffmpeg&&!state.memory_paused;$('video-error').textContent=!state.relay?'Motore video go2rtc non avviato. Controlla il registro dell’app.':!state.ffmpeg?'FFmpeg non disponibile: il live funziona, la registrazione no.':state.memory_paused?'Memoria disponibile bassa: registrazione sospesa per proteggere Home Assistant.':'';
  $('cam-count').textContent=state.cameras.filter(c=>c.has_source).length+' / '+state.max_cameras;
  const list=$('camera-list');list.replaceChildren();
  if(!state.cameras.length){const p=document.createElement('p');p.className='muted';p.style.gridColumn='1 / -1';p.textContent='Nessuna telecamera ONVIF trovata. Aggiungila prima in Impostazioni → Dispositivi e servizi di Home Assistant.';list.append(p)}
  for(const cam of state.cameras){
    const card=document.createElement('div');card.className='camera-item';
    const head=document.createElement('div');head.className='camera-item-head';
    const name=document.createElement('strong');name.textContent=cam.name;head.append(name);
    const mark=document.createElement('span');mark.className='state'+(cam.has_source?' ok':'');mark.textContent=cam.has_source?'● Collegata':'○ Da configurare';head.append(mark);card.append(head);
    const info=document.createElement('small');info.textContent=cam.entity_id;card.append(info);
    const bottom=document.createElement('div');bottom.className='camera-item-bottom';
    const detail=document.createElement('span');detail.className='muted';detail.textContent=cam.mode==='continuous'?'Registrazione continua':cam.mode==='motion'?'Registrazione al movimento':'Solo visione';bottom.append(detail);
    const button=document.createElement('button');button.textContent='Configura';button.addEventListener('click',()=>openCamera(cam));bottom.append(button);card.append(bottom);list.append(card);
    if(cam.record_error){const warning=document.createElement('small');warning.className='state';warning.textContent=cam.record_error;card.append(warning)}
  }
  if(!storageDirty){$('storage-path').value=state.storage.path||'';$('retention-days').value=state.retention_days;$('max-gb').value=state.max_gb}
  $('storage-pill').textContent=state.storage.ready?'● Disco pronto':'● Disco non pronto';$('storage-pill').classList.toggle('ok',state.storage.ready);
  $('storage-message').textContent=state.storage.ready?`Spazio libero: ${state.storage.free_gb} GB`:state.storage.message;
  $('client-key').textContent=state.client_key;
}
function openCamera(cam) {
  selectedCam=cam;$('dialog-title').textContent=cam.name;$('dialog-entity').textContent=cam.entity_id;
  $('cam-name').value=cam.name;$('cam-source').value='';$('cam-mode').value=cam.has_source?cam.mode:'continuous';
  $('cam-selected').checked=cam.selected;
  $('source-hint').textContent=cam.has_source?'Collegamento già salvato. Lascia vuoto per conservarlo.':'Inserisci indirizzo ONVIF o RTSP e credenziali della telecamera.';
  $('camera-dialog').showModal();
}
async function saveCamera(event) {
  event.preventDefault();if(!selectedCam)return;
  const body={name:$('cam-name').value,source:$('cam-source').value.trim(),mode:$('cam-mode').value,selected:$('cam-selected').checked};
  try{await request('api/cameras/'+encodeURIComponent(selectedCam.id),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});$('camera-dialog').close();toast('Telecamera salvata');await update()}catch(error){toast(error.message)}
}
async function saveStorage(event) {
  event.preventDefault();
  const body={path:$('storage-path').value.trim(),retention_days:Number($('retention-days').value),max_gb:Number($('max-gb').value)};
  try{await request('api/storage',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});storageDirty=false;toast('Archivio pronto');await update()}catch(error){toast(error.message)}
}
async function loadRecordings() {
  if(!state)return;
  const select=$('record-cam'),old=select.value;select.replaceChildren();
  for(const cam of state.cameras.filter(c=>c.has_source)){const opt=document.createElement('option');opt.value=cam.id;opt.textContent=cam.name;select.append(opt)}
  if([...select.options].some(o=>o.value===old))select.value=old;
  if(!select.value){$('record-list').textContent='Configura una telecamera per vedere le registrazioni.';return}
  try{const days=await request('api/days/'+encodeURIComponent(select.value));const daySelect=$('record-day'),previous=daySelect.value;daySelect.replaceChildren();for(const item of days){const opt=document.createElement('option');opt.value=item.day;opt.textContent=item.day;daySelect.append(opt)}if([...daySelect.options].some(o=>o.value===previous))daySelect.value=previous;await loadSegments()}catch(error){toast(error.message)}
}
async function loadSegments() {
  const cid=$('record-cam').value,day=$('record-day').value,list=$('record-list');list.replaceChildren();
  if(!cid||!day){list.textContent='Nessuna registrazione disponibile.';return}
  try{const segments=(await request('api/recordings/'+encodeURIComponent(cid)+'?day='+encodeURIComponent(day))).filter(s=>!s.live);
    if(!segments.length){list.textContent='Nessuna registrazione completata in questo giorno.';return}
    for(const segment of segments){const button=document.createElement('button');button.className='record-item';const time=new Date(segment.start*1000).toLocaleTimeString('it-IT');button.textContent=time+' · '+Math.round(segment.dur/60)+' min';button.addEventListener('click',()=>{for(const el of list.querySelectorAll('.record-item'))el.classList.remove('active');button.classList.add('active');$('playback').src=apiUrl('api/recording/'+encodeURIComponent(cid)+'/'+encodeURIComponent(segment.name));$('playback').play().catch(()=>{});$('playback-title').textContent=day+' · '+time});list.append(button)}
  }catch(error){toast(error.message)}
}

document.querySelectorAll('.nav').forEach(el=>el.addEventListener('click',()=>setPage(el.dataset.page)));
$('menu-button').addEventListener('click',()=>{document.body.classList.toggle('menu-open');showControls()});
$('setup-button').addEventListener('click',()=>setPage('settings'));
$('live-budget').addEventListener('change',()=>{budget=Number($('live-budget').value);localStorage.setItem('eac-live-budget',String(budget));renderLive(true)});
$('refresh-button').addEventListener('click',async()=>{try{state=await request('api/refresh',{method:'POST'});renderSettings();renderLive(true);toast('Telecamere aggiornate')}catch(error){toast(error.message)}});
$('discover-button').addEventListener('click',()=>$('refresh-button').click());
$('camera-form').addEventListener('submit',saveCamera);
$('dialog-close').addEventListener('click',()=>$('camera-dialog').close());
$('clear-source').addEventListener('click',async()=>{if(!selectedCam||!confirm('Rimuovere il flusso diretto di questa telecamera?'))return;try{await request('api/cameras/'+selectedCam.id,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({clear_source:true,selected:false})});$('camera-dialog').close();await update();toast('Collegamento rimosso')}catch(error){toast(error.message)}});
$('storage-form').addEventListener('submit',saveStorage);
for(const id of ['storage-path','retention-days','max-gb'])$(id).addEventListener('input',()=>{storageDirty=true});
$('copy-key').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(state.client_key);toast('Codice copiato')}catch{toast('Seleziona e copia il codice mostrato')}});
$('record-cam').addEventListener('change',loadRecordings);$('record-day').addEventListener('change',loadSegments);$('record-refresh').addEventListener('click',loadRecordings);
document.addEventListener('mousemove',showControls);document.addEventListener('touchstart',event=>{if(event.touches[0]&&event.touches[0].clientY<85)showControls()},{passive:true});
window.addEventListener('resize',()=>{if(page==='live')renderLive(true)});
setPage(['live','recordings','settings'].includes(new URLSearchParams(location.search).get('page'))?new URLSearchParams(location.search).get('page'):'live');update();setInterval(update,10000);setInterval(()=>{if(page==='live')for(const image of document.querySelectorAll('.tile img'))image.src=image.src.replace(/([?&])t=\d+/, '$1t='+Date.now())},30000);
