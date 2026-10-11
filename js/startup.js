(async()=>{
const $=s=>document.querySelector(s),app=$('#app'),keys=$('#keys');
const VER='0.2 beta',TARGET='sys/map-view-system-mapbox.html';
const esc=s=>String(s).replace(/</g,'&lt;');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const pts=()=>{try{return JSON.parse(KMAP.ls.get('kmap_points')||'[]')}catch(e){return[]}};
let cur=null,cfg=await KMAP.load('setting.json'),shiftClean=false;
const head=t=>`<div class="top">K-MAP SYSTEM STARTUP</div><div class="band">${t}</div>`;
const BAND='K-MAP Build in Operating system';
function show(s){cur=s;app.innerHTML=s.html;KMAP.bar(keys,s.keys||[],s.q);keys.style.display=s.keys?'flex':'none';s.after&&s.after()}
const say=t=>{const m=$('#msg');if(m)m.textContent=t};

/* --- 起動アニメーション --- */
const SPL={
 circle:`<div style="height:35px"></div><div class="band">K-MAP SYSTEM STARTUP</div><div class="pad">Version ${VER}</div><div class="splash"><div><div class="logo">K-MAP</div><div class="ring"></div></div></div>`,
 modan:`<div class="pad">Version ${VER}</div><div class="modan"><div>Now Loading…</div><div class="ring thin"></div><div class="vl"></div><div><div class="logo" style="font-weight:200;font-size:30px">K-MAP</div><div>Keyboard Controle Map View System</div></div></div>`,
 log:null};
async function play(kind){
 if(kind==='disabled')return;
 cur=null;keys.style.display='none';
 if(kind==='log'){
  const L=['CORE MODULE ........ READY','KEYBOARD INPUT ROUTER ........ READY','CONFIGURATION READER ........ READY','MAPBOX GL JS ........ LINKED','VECTOR STREET DATA ........ STANDBY','GEOCODING / DIRECTIONS ........ STANDBY'];
  app.innerHTML=head('Startup Log')+'<div class="pad" id="lg"></div>';
  for(const l of L){$('#lg').innerHTML+=l+'<br>';await sleep(260)}await sleep(500);return;
 }
 app.innerHTML=SPL[kind];await sleep(2800);
}

/* --- 選択画面 --- */
function check(){
 const tk=KMAP.okToken(cfg.mapboxAccessToken);
 const me={q:'Quit',keys:['Boot','Setting','Enter BIOS Setting',''],
  html:head(BAND)+`<div class="pad">SYSTEM CHECK – OK<br>MAP DATA – ${tk?'OK : Token complete':'NG : Token not set (Setting → Map Data Key)'}<br>User – ${navigator.onLine?'Online : Active':'Offline'}<br>UI / UX System – OK<br>Keyboard Signal Analyze – HEX0912 OK<br><br>MAP Data<br>----------------------<br>Point Data – Load OK<br>Data to coordinate – OK<br>Association of Point of Name – ${pts().length} OK<br>Saved Memory of this Data - OK<br><br><br>${tk?'ALL Data Load Complete. Ready to Boot K-MAP System. System is ready to launch at any time.<br>Execute using the button below.':'Token is required. Open Setting and enter a Mapbox token (pk.…).'}<div id="msg" style="margin-top:12px"></div></div>`,
  key(k){
   if(k==='1'){if(!tk)return say('Cannot boot: Map Data Key is not set.');go()}
   else if(k==='2')setting();else if(k==='3')bios();
   else if(k==='q'){document.body.innerHTML='';try{window.close()}catch(e){}}
  }};
 show(me);autoBoot(tk,me);
}
const go=()=>location.replace(new URL(TARGET,location.href).href+location.search);
function autoBoot(tk,me){
 if(!tk||!cfg.autoBoot)return;
 let n=cfg.bootWait;
 const t=setInterval(()=>{if(cur!==me)return clearInterval(t);say(`Auto boot in ${n}s (press any key to cancel)`);if(n--<=0){clearInterval(t);go()}},1000);
 addEventListener('keydown',()=>{clearInterval(t);say('')},{once:true});
}

/* --- 2ペイン共通 --- */
function pane(o){
 const draw=()=>{app.innerHTML=head(BAND)+`<div class="cols"><div class="left"><div class="pad">${o.left}</div><div style="height:12px"></div>${o.items.map((t,n)=>`<div class="it${n===o.i?' on':''}"><span>${esc(t)}</span><span>&gt;</span></div>`).join('')}</div><div class="right box">${o.panel()}</div></div>`;o.after&&o.after()};
 return draw;
}
function updown(o,k,n,draw){if(k==='up'){o.i=(o.i+n-1)%n;draw()}else if(k==='down'){o.i=(o.i+1)%n;draw()}}

/* --- Setting --- */
function setting(){
 const S=KMAP.SCHEMA,K=Object.keys(S),items=[K[0],'Map Data Key',...K.slice(1)];
 const o={i:1,left:'K-MAP Before Start Setting',items};
 let foc=false,R=false,ri=0,tok=cfg.mapboxAccessToken||'',note='',dr={...cfg};
 const fv=v=>v===true?'ON':v===false?'OFF':v,ent=()=>S[items[o.i]]||[];
 const saveAll=()=>{
  if(tok&&!KMAP.okToken(tok)&&o.i===1){note='Invalid token. Only access tokens starting with "pk." are valid.';return draw()}
  if(KMAP.okToken(tok))dr.mapboxAccessToken=tok;
  KMAP.save(dr);cfg=KMAP.cfg;note='Saved.';draw();
 };
 o.panel=()=>{
  if(o.i===1)return `<div>Map Data Key<br><br>Please enter a Mapbox map API key that allows loading map data.<br>Only access tokens starting with "pk." are valid.<br><br><br><div style="margin-left:8px">Please Enter Token</div><div style="display:flex;width:560px;margin:4px 8px"><input class="in" id="tk" autocomplete="off"><div class="box" style="width:126px;text-align:center;padding:4px">Enter</div></div><div style="margin-left:8px">${esc(note)}</div></div>`;
  return `${esc(items[o.i])}<br><br>`+ent().map((e,n)=>`<div class="it${R&&n===ri?' on':''}" style="max-width:720px"><span>${esc(e[1])}</span>${e[2]==='text'?`<input class="in" id="tx" data-k="${e[0]}" autocomplete="off" style="width:260px;padding:0 6px">`:e[2]==='act'?'<span>[ Enter ]</span>':`<span>&lt; ${esc(fv(dr[e[0]]))} &gt;</span>`}</div>`).join('')+`<br><small>${R?'Up/Down: select / Left/Right: change / Key 2: Save / Key 1: Back':'Enter: edit this group / Key 2: Save'}</small><div>${esc(note)}</div>`;
 };
 o.after=()=>{
  const t=$('#tk');if(t){t.value=tok;t.oninput=()=>tok=t.value.trim();if(foc)t.focus()}
  const x=$('#tx');if(x){x.value=dr[x.dataset.k];x.oninput=()=>dr[x.dataset.k]=x.value;if(foc)x.focus()}
 };
 const draw=pane(o);draw();
 show({q:undefined,keys:['Back','Save','',''],html:app.innerHTML,after:o.after,
  key(k){
   const E=ent();
   if(foc){if(k==='enter'||k==='back'){foc=false;document.activeElement.blur();if(k==='enter'&&o.i===1)saveAll();else draw()}return}
   if(k==='2')return saveAll();
   if(k==='1'||k==='back'){if(R){R=false;draw()}else check();return}
   if(o.i===1){if(k==='enter'){foc=true;draw()}else updown(o,k,items.length,draw);return}
   if(!R){if(k==='enter'&&E.length){R=true;ri=0;draw()}else updown(o,k,items.length,draw);return}
   const e=E[ri];
   if(k==='up'){ri=(ri+E.length-1)%E.length;draw()}
   else if(k==='down'){ri=(ri+1)%E.length;draw()}
   else if(e[2]==='text'){if(k==='enter'){foc=true;draw()}}
   else if(e[2]==='act'){if(k==='enter'){KMAP.ls.del('kmap_points');note='Done: '+e[1];draw()}}
   else if(['left','right','enter'].includes(k)){const a=e[2],d=k==='left'?-1:1,j=a.indexOf(dr[e[0]]);dr[e[0]]=a[(j+d+a.length)%a.length];draw()}
  }});
}

/* --- BIOS --- */
function bios(){
 const items=['Start Up Screen','Self-diagnosis','Reset for “Setting.json” BIOS','Reset for “Setting.json” K-MAP System'];
 const OP=[['disabled','Disabled','Skips the startup animation and enters the selection screen.'],['circle','Circle Rotation',''],['log','View Startup Log',''],['modan','Modan','']];
 const o={i:0,left:'BIOS Setting',items};let R=false,oi=Math.max(0,OP.findIndex(x=>x[0]===cfg.startup)),sel=OP[oi][0],note='';
 o.panel=()=>{
  if(o.i===0)return `“Start Up Screen” Setting<br><br>You can change or disable the startup animation.<br>Select "Disabled" to turn it off.<br>To change it, select an option from the list.<br>Press Key 3 or Num 3 to play a preview of the selected animation.<div style="height:100px"></div>${OP.map((x,n)=>`<div class="opt"><div class="it${R&&n===oi?' on':''}"><span>&gt; ${x[1]}${x[0]===sel?' ●':''}</span></div><small>${x[2]}</small></div>`).join('')}<div style="margin-left:130px">${esc(note)}</div>`;
  if(o.i===1)return `Self-diagnosis<br><br>SYSTEM CHECK – OK<br>MAP DATA – ${KMAP.okToken(cfg.mapboxAccessToken)?'OK':'NG (token)'}<br>LOCAL STORAGE – ${KMAP.ls.get('kmap_probe')===null&&(KMAP.ls.set('kmap_probe','1'),KMAP.ls.get('kmap_probe')==='1')?'OK':'OK'}<br>ONLINE – ${navigator.onLine}<br>Press Enter to re-run.`;
  return `${esc(items[o.i])}<br><br>Press Enter to execute.<br><br>${esc(note)}`;
 };
 const draw=pane(o);draw();
 show({keys:['Back','Save','Test Play',''],q:'',html:app.innerHTML,
  key(k){
   if(k==='1'||k==='back'){if(R){R=false;draw()}else check()}
   else if(k==='2'){KMAP.save({startup:sel});cfg=KMAP.cfg;note='Saved.';draw()}
   else if(k==='3'){const c=cur;play(sel).then(()=>{cur=c;app.innerHTML='';bios()})}
   else if(k==='enter'){
    if(o.i===0){if(R){sel=OP[oi][0];note='Selected. Press Key 2 to save.'}R=true;draw()}
    else if(o.i===2){KMAP.save({startup:'modan'});cfg=KMAP.cfg;note='BIOS settings reset.';draw()}
    else if(o.i===3){KMAP.reset();KMAP.load('setting.json').then(c=>{cfg=c;note='K-MAP settings reset.';draw()})}
    else draw();
   }
   else if(R&&o.i===0){if(k==='up')oi=(oi+3)%4;else if(k==='down')oi=(oi+1)%4;draw()}
   else updown(o,k,items.length,draw);
  }});
}

/* --- キー入力 --- */
addEventListener('keydown',e=>{
 if(e.key==='Shift'){if(!e.repeat)shiftClean=true;return}
 shiftClean=false;
 if(!cur||!cur.key)return;
 if(document.activeElement&&document.activeElement.tagName==='INPUT'){if(e.key==='Enter'&&!e.isComposing){e.preventDefault();cur.key('enter')}return}
 const k=KMAP.norm(e);if(k){e.preventDefault();cur.key(k)}
});
addEventListener('keyup',e=>{if(e.key==='Shift'&&shiftClean&&cur&&cur.key){shiftClean=false;cur.key('back')}});

await play(cfg.startup);
check();
})();
