// 共通: 設定(setting.json + localStorage)・ファンクションバー・キー正規化
window.KMAP=(()=>{
 const K='kmap_settings',L=window.localStorage;
 const ls={get:k=>{try{return L.getItem(k)}catch(e){return null}},set:(k,v)=>{try{L.setItem(k,v)}catch(e){}},del:k=>{try{L.removeItem(k)}catch(e){}}};
 const own=()=>{try{return JSON.parse(ls.get(K)||'{}')}catch(e){return{}}};
 const S={
'General settings':[['followOnStart','Follow current location at start',[false,true]],['startAtCurrent','Jump to current location at start',[true,false]],['showLogo','Show K-MAP logo',[true,false]]],
'Default Value':[['startPoint','Start point (lat, lng)','text','35.681236, 139.767125'],['defaultZoom','Start zoom',[17,12,14,15,16,18,20]],['defaultMode','Start display',['2D','3D']],['defaultCompass','Start compass',['North-up','Heading-up']]],
'Unit Setting':[['distUnit','Distance unit',['km','mi']],['coordFormat','Coordinate format',['DMS','Decimal']],['timeFormat','Time format',['24h','12h']]],
'Regional Settings':[['language','Map / search language',['ja','en']],['country','Search area',['JP','All']]],
'Display settings':[['labels','Map labels',[false,true]],['pitch3d','3D tilt angle',[60,45,75]],['crosshair','Crosshair',[true,false]],['showCompass','Compass',[true,false]],['showScale','Scale bar',[true,false]],['showStatus','Status line',[true,false]]],
'UI/UX Settings':[['toastSec','Message time (sec)',[3,2,5,8]],['panStep','Cursor move step (px)',[110,60,180]],['zoomStep','Zoom step',[0.5,1,0.25]],['animMs','Move animation (ms)',[140,0,300]],['showKeyBar','Function key bar',[true,false]]],
'Key binding Settings':[['menuKeys','Menu keys',['Space=Menu / Tab=Tool','Tab=Menu / Space=Tool']],['enterInfo','Enter opens Information',[true,false]],['rotKeys','Rotate keys',['Q / E',', / .']]],
'Player Icon Settings':[['iconShape','Icon shape',['Arrow','Circle','Diamond']],['iconSize','Icon size',[26,20,36]]],
'BIOS Operation Settings':[['autoBoot','Auto boot after check',[false,true]],['bootWait','Auto boot wait (sec)',[3,5,10]]],
'Operational Load Reduction Settings':[['antialias','Anti-aliasing',[true,false]],['tileFade','Tile fade animation',[true,false]],['tileCache','Tile cache',['Auto','Small']],['geoAccuracy','Location accuracy',['High','Low']]],
'Developer settings':[['debug','Debug status',[false,true]],['clearPts','Clear registered points','act']]
};
const DEF={mapboxAccessToken:'',startup:'modan'};
Object.values(S).flat().forEach(e=>{if(Array.isArray(e[2]))DEF[e[0]]=e[2][0];else if(e[2]==='text')DEF[e[0]]=e[3]});
 let cfg={...DEF};
 return{ls,SCHEMA:S,
  async load(url){let b={};try{const r=await fetch(url,{cache:'no-store'});if(r.ok)b=await r.json()}catch(e){}cfg={...DEF,...b,...own()};return cfg},
  get cfg(){return cfg},
  save(p){ls.set(K,JSON.stringify({...own(),...p}));cfg={...cfg,...p}},
  reset(){ls.del(K)},
  okToken:t=>/^pk\.[\w-]+\.[\w-]+$/.test(t||''),
  bar(el,labels,q){el.innerHTML=labels.map((l,i)=>`<div class="k"><div class="kl">Key ${i+1} / Num ${i+1}</div><div class="kb">${l}</div></div>`).join('')+(q!==undefined?`<div class="k q"><div class="kl">Key Q / Num 0</div><div class="kb">${q}</div></div>`:'')},
  on(el,n){el.querySelectorAll('.kb').forEach((b,i)=>b.classList.toggle('on',i===n-1))},
  norm(e){const k=e.key;if(/^[0-8]$/.test(k))return k==='0'?'q':k;if(k==='q'||k==='Q')return'q';return{ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',Enter:'enter',Escape:'esc'}[k]||''}
 }
})();
