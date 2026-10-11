// 地図本体: 初期化 / 現在地 / 検索 / 経路 / Information / キー入力
let map,TOKEN='',mode3d=false,northUp=true,follow=false,showLabels=false;
let curPos=null,curMk,destMk,route=null,stepIdx=0,infoOn=false,infoPage=0,seq=0,ptMks=[],raf=0,shiftClean=false;
const EMPTY={type:'FeatureCollection',features:[]},KEYBAR=$('#keys');let D=140,C={};
const pts=()=>{try{return JSON.parse(KMAP.ls.get('kmap_points')||'[]')}catch(e){return[]}};
const savePts=a=>KMAP.ls.set('kmap_points',JSON.stringify(a));
const api=(u,q)=>fetch('https://api.mapbox.com/'+u+'?'+new URLSearchParams({...q,access_token:TOKEN,language:C.language})).then(r=>r.json());
const fm=m=>C.distUnit==='mi'?(m>=161?(m/1609.344).toFixed(1)+'mi':Math.round(m*3.28084)+'ft'):(m>=1000?(m/1000).toFixed(1)+'km':Math.round(m)+'m');
const ft=s=>(s>=3600?Math.floor(s/3600)+'H ':'')+Math.max(1,Math.round(s%3600/60))+'M';
const dms=(v,p,n)=>{const s=v<0?n:p;v=Math.abs(v);const d=Math.floor(v),m=Math.floor((v-d)*60),x=((v-d)*60-m)*60;return `${s} ${d}°${m}'${x.toFixed(3)}"`};
function dist(a,b){const R=6371000,r=Math.PI/180,dl=(b.lat-a.lat)*r,dn=(b.lng-a.lng)*r;const x=Math.sin(dl/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dn/2)**2;return 2*R*Math.asin(Math.sqrt(x))}
const mkEl=c=>{const e=document.createElement('div');e.className=c;return e};

/* ===== 起動 ===== */
(async()=>{
 C=await KMAP.load('../setting.json');TOKEN=C.mapboxAccessToken;applyCfg();
 KMAP.bar(KEYBAR,['Menu','Tool','Registering a Location','Registered location','coordinate','Information','Reload Map','Exit']);
 if(typeof mapboxgl==='undefined'||!KMAP.okToken(TOKEN)){UI.toast('Map Data Key / Mapbox GL JS unavailable. Returning to startup…',99999);setTimeout(()=>location.replace('../index.html'),2500);return}
 mapboxgl.accessToken=TOKEN;
 map=new mapboxgl.Map({container:'map',style:STYLE,center:sp(),zoom:C.defaultZoom,minZoom:0,maxZoom:22,maxPitch:85,interactive:false,antialias:C.antialias,fadeDuration:C.tileFade?300:0,...(C.tileCache==='Small'?{maxTileCacheSize:20}:{}),
  localIdeographFontFamily:"'Meiryo','Noto Sans JP',sans-serif"});
 map.on('style.load',setup);
 ['move','zoom','rotate','pitch'].forEach(e=>map.on(e,hudSoon));
 map.on('moveend',()=>{if(infoOn)drawInfo()});
 map.on('error',e=>{if(/401|403/.test((e.error&&e.error.message)||''))UI.toast('Map Data Key is invalid. Check Setting.',99999)});
 startGeo();drawPts();
})();
function setup(){
 map.addSource('route',{type:'geojson',data:route?{type:'Feature',geometry:route.geometry}:EMPTY});
 map.addLayer({id:'route-c',type:'line',source:'route',paint:{'line-color':'#000','line-width':8},layout:{'line-cap':'round','line-join':'round'}});
 map.addLayer({id:'route-l',type:'line',source:'route',paint:{'line-color':O,'line-width':2},layout:{'line-cap':'round','line-join':'round'}});
 try{map.addLayer({id:'broof',type:'line',source:'mb','source-layer':'building',minzoom:14,filter:['==',['get','extrude'],'true'],
  layout:{visibility:'none','line-elevation-reference':'ground','line-z-offset':['get','height']},paint:{'line-color':O,'line-width':2}},'rlabel')}catch(e){}
 vis();if(mode3d&&!map.getPitch())map.setPitch(C.pitch3d);hud();
}
function vis(){
 ['b3d','broof'].forEach(l=>map.getLayer(l)&&map.setLayoutProperty(l,'visibility',mode3d?'visible':'none'));
 ['rlabel','place'].forEach(l=>{if(!map.getLayer(l))return;map.setLayoutProperty(l,'visibility',showLabels?'visible':'none');map.setLayoutProperty(l,'text-field',['coalesce',['get',C.language==='en'?'name_en':'name_ja'],['get','name']])});
}

/* ===== HUD ===== */
function hudSoon(){if(!raf)raf=requestAnimationFrame(()=>{raf=0;hud()})}
function hud(){
 if(!map)return;
 const c=map.getCenter(),z=map.getZoom(),h=map.getBearing();
 const mpp=78271.51696*Math.cos(c.lat*Math.PI/180)/Math.pow(2,z);
 $('#stat').textContent=`${mode3d?'3D':'2D'} / ${northUp?'N-UP':'HDG-UP'} / ZOOM ${z.toFixed(1)} / 1:${Math.round(mpp/0.000264583).toLocaleString()}${follow?' / FOLLOW':''}${C.debug?` | ${c.lat.toFixed(5)},${c.lng.toFixed(5)} B${h.toFixed(0)} P${map.getPitch().toFixed(0)}`:''}`;
 const raw=mpp*140,k=Math.pow(10,Math.floor(Math.log10(raw))),n=[10,5,2,1].find(v=>v*k<=raw)||1,m=n*k,el=$('#scale');
 el.style.width=Math.max(20,m/mpp)+'px';el.style.borderLeft=el.style.borderRight='2px solid '+O;el.style.borderBottom='2px solid '+O;
 el.textContent=m>=1000?(m/1000)+' km':m+' m';
 $('#compass').innerHTML=`<svg viewBox="0 0 100 100" width="76" height="76" fill="none" stroke="${O}" stroke-width="3"><g transform="rotate(${-h} 50 50)"><circle cx="50" cy="50" r="38"/><path d="M50 18L58 50H42Z"/><path d="M50 50V82"/><text x="50" y="13" text-anchor="middle" fill="${O}" stroke="none" font-size="14" font-weight="bold">N</text></g>${northUp?'':'<path d="M50 0L55 9H45Z"/>'}</svg>`;
}

/* ===== 表示操作 ===== */
const zoomBy=d=>map.easeTo({zoom:map.getZoom()+d,duration:D});
function set3d(on){mode3d=on;vis();map.easeTo({pitch:on?C.pitch3d:0,zoom:on&&map.getZoom()<15.5?15.5:map.getZoom(),duration:600});UI.toast(on?'3D':'2D')}
function setNorth(v){northUp=v;if(v)map.easeTo({bearing:0,duration:400});else if(curPos&&curPos.heading!=null)map.easeTo({bearing:curPos.heading,duration:400});UI.toast(v?'Compass: North-up':'Compass: Heading-up (Q/E rotate)')}
const rotate=d=>{if(northUp)UI.toast('Heading-up mode only');else map.easeTo({bearing:map.getBearing()+d,duration:D})};
const tilt=d=>{if(!mode3d)UI.toast('3D mode only');else map.easeTo({pitch:Math.max(0,Math.min(85,map.getPitch()+d)),duration:D})};
function goHere(){if(!curPos)return UI.toast('Current location unavailable');map.easeTo({center:[curPos.lng,curPos.lat],duration:500})}
function setFollow(v){follow=v;if(v)goHere();UI.toast('Follow '+(v?'ON':'OFF'))}
function jump(co,bbox){
 if(bbox)map.fitBounds([[bbox[0],bbox[1]],[bbox[2],bbox[3]]],{maxZoom:17,duration:800});else map.easeTo({center:co,zoom:Math.max(map.getZoom(),16.5),duration:800});
 setDest(co);
}
function setDest(co){if(!destMk)destMk=new mapboxgl.Marker({element:mkEl('mk')});destMk.setLngLat(co).addTo(map)}

/* ===== 現在地 ===== */
function startGeo(){
 if(!navigator.geolocation)return;
 const el=mkEl('');el.innerHTML=iconSvg();
 curMk=new mapboxgl.Marker({element:el,rotationAlignment:'map',pitchAlignment:'map'});
 navigator.geolocation.watchPosition(p=>{
  const first=!curPos;curPos={lat:p.coords.latitude,lng:p.coords.longitude,heading:p.coords.heading};
  curMk.setLngLat([curPos.lng,curPos.lat]).addTo(map);if(curPos.heading!=null)curMk.setRotation(curPos.heading);
  if(first&&C.startAtCurrent)map.jumpTo({center:[curPos.lng,curPos.lat]});
  if(follow){const o={center:[curPos.lng,curPos.lat],duration:800};if(!northUp&&curPos.heading!=null)o.bearing=curPos.heading;map.easeTo(o)}
  advance();
 },()=>UI.toast('Current location unavailable'),{enableHighAccuracy:C.geoAccuracy==='High',maximumAge:2000});
}

/* ===== 検索・座標・登録地点 ===== */
async function search(q,types){
 const c=map.getCenter();UI.toast('Searching…');
 try{
  const r=await api('search/geocode/v6/forward',{q,limit:6,proximity:c.lng+','+c.lat,...(C.country==='JP'?{country:'jp'}:{}),...(types?{types}:{})});
  if(!r.features||!r.features.length)return UI.toast('No results');
  UI.menu.open(r.features.map(f=>({t:f.properties.full_address||f.properties.name,f:()=>jump(f.geometry.coordinates,f.properties.bbox)})),0,'Result');
 }catch(e){UI.toast('Search failed')}
}
function goCoord(s){
 const m=s.match(/(-?\d+(?:\.\d+)?)[\s,]+(-?\d+(?:\.\d+)?)/);if(!m)return UI.toast('Format: lat, lng  (e.g. 35.6812, 139.7671)');
 let a=+m[1],b=+m[2];if(Math.abs(a)>90){[a,b]=[b,a]}jump([b,a]);
}
function drawPts(){
 ptMks.forEach(m=>m.remove());
 ptMks=pts().map(p=>new mapboxgl.Marker({element:mkEl('mk sq')}).setLngLat([p.lng,p.lat]).addTo(map));
}
function registerHere(){
 const P=pts(),c=map.getCenter(),p={n:'Point '+String(P.length+1).padStart(3,'0'),lng:c.lng,lat:c.lat,a:''};
 P.push(p);savePts(P);drawPts();UI.toast('Registered: '+p.n);
 api('search/geocode/v6/reverse',{longitude:c.lng,latitude:c.lat,limit:1}).then(r=>{
  const f=r.features&&r.features[0],Q=pts(),x=Q.find(z=>z.n===p.n);if(f&&x){x.a=f.properties.full_address||f.properties.name;savePts(Q)}}).catch(()=>{});
}
function listPoints(){
 const P=pts();if(!P.length)return UI.toast('No registered location');
 UI.menu.open(P.map(p=>({t:p.n+(p.a?' – '+p.a:''),f:()=>jump([p.lng,p.lat])})),0,'Registered');
}

/* ===== 経路 ===== */
function navTo(){
 if(!curPos)return UI.toast('Current location unavailable');
 const d=map.getCenter();setDest(d);
 api(`directions/v5/mapbox/driving/${curPos.lng},${curPos.lat};${d.lng},${d.lat}`,{steps:'true',geometries:'geojson',overview:'full'}).then(r=>{
  if(!r.routes||!r.routes.length)return UI.toast('No route found');
  route=r.routes[0];stepIdx=0;map.getSource('route').setData({type:'Feature',geometry:route.geometry});
  const b=new mapboxgl.LngLatBounds();route.geometry.coordinates.forEach(c=>b.extend(c));map.fitBounds(b,{padding:110,duration:800});
  UI.toast(`Route: ${fm(route.distance)} / ${ft(route.duration)}`);if(infoOn)drawInfo();
 }).catch(()=>UI.toast('Route failed'));
}
function clearRoute(){route=null;if(map.getSource('route'))map.getSource('route').setData(EMPTY);if(destMk)destMk.remove();UI.toast('Route cleared')}
function advance(){
 if(!route||!curPos)return;const st=route.legs[0].steps;
 while(stepIdx+1<st.length){const m=st[stepIdx+1].maneuver.location;if(dist(curPos,{lng:m[0],lat:m[1]})<30)stepIdx++;else break}
 if(infoOn&&infoPage===2)drawInfo();
}

/* ===== Information window ===== */
async function drawInfo(){
 const e=$('#info'),c=map.getCenter(),my=++seq,P=pts();e.style.display='flex';
 const put=b=>{if(my!==seq)return;e.innerHTML=`<div class="body">Information window\n\n${b}</div><div>&lt;Q  Page ${infoPage+1}/3  E&gt;\n Exit – Key 6/Num 6</div>`};
 const cc={lat:c.lat,lng:c.lng};
 if(infoPage===0){
  put(`Coordinate\n${cf(c.lng,'E','W')}\n${cf(c.lat,'N','S')}\n\nLocation\nLoading…`);
  try{
   const r=await api('search/geocode/v6/reverse',{longitude:c.lng,latitude:c.lat,limit:1}),f=r.features&&r.features[0],p=f&&f.properties,x=p&&p.context||{};
   put(`Coordinate\n${cf(c.lng,'E','W')}\n${cf(c.lat,'N','S')}\n\nLocation\nNearby : ${esc(p?p.full_address||p.name:'-')}\nPost Number [ ${esc(x.postcode?x.postcode.name:'-')} ]\nCountry : ${esc(x.region?x.region.name+' , ':'')}${esc(x.country?x.country.name:'-')}`);
  }catch(er){put(`Coordinate\n${cf(c.lng,'E','W')}\n${cf(c.lat,'N','S')}\n\nLocation\n(offline)`)}
 }else if(infoPage===1){
  put(`Straight-line distance\n${P.length?P.slice(-6).map((p,i)=>`${i+1} : ${fm(dist(cc,p))} ${p.n}${p.a?' – '+esc(p.a):''}`).join('\n'):'No registered location'}\n\nMy : ${curPos?fm(dist(cc,curPos))+' Current':'Current location unavailable'}`);
 }else{
  if(!route)put('Route\nNo active route.\nUse Menu > Route > Route to Cursor.');
  else{
   const st=route.legs[0].steps,nx=st[stepIdx+1],t=new Date(Date.now()+route.duration*1000),z=-t.getTimezoneOffset(),sg=z>=0?'+':'-',zz=String(Math.floor(Math.abs(z)/60)).padStart(2,'0')+':'+String(Math.abs(z)%60).padStart(2,'0');
   put(`Route\nRemaining : ${fm(route.distance)}\n\nEstimated arrival\n${ft(route.duration)} ${clock(t)} ${sg}${zz}\n\nNext\n${nx?esc(nx.maneuver.instruction)+' ('+fm(st[stepIdx].distance)+')':'Arriving'}`);
  }
 }
}
function toggleInfo(){infoOn=!infoOn;if(infoOn){infoPage=0;drawInfo()}else{$('#info').style.display='none';seq++}KMAP.on(KEYBAR,infoOn?6:0)}

/* ===== メニュー構成 ===== */
const TREE=()=>[
 {t:'Search',sub:[
  {t:'Address',f:()=>{setTimeout(()=>UI.ask.open('Enter Address …',q=>search(q)),0)}},
  {t:'Post Code',f:()=>{setTimeout(()=>UI.ask.open('Enter Post Code …',q=>search(q,'postcode')),0)}},
  {t:'Look Up',f:()=>{if(!infoOn)toggleInfo();else drawInfo()}},
  {t:'Resisted Point',f:()=>{setTimeout(listPoints,0)}}]},
 {t:'Tools',sub:()=>[
  {t:()=>`Display : ${mode3d?'3D':'2D'}`,f:()=>{set3d(!mode3d);return'stay'}},
  {t:()=>`Compass : ${northUp?'North-up':'Heading-up'}`,f:()=>{setNorth(!northUp);return'stay'}},
  {t:()=>`Follow : ${follow?'ON':'OFF'}`,f:()=>{setFollow(!follow);return'stay'}},
  {t:()=>`Labels : ${showLabels?'ON':'OFF'}`,f:()=>{showLabels=!showLabels;vis();return'stay'}},
  {t:'Zoom In',f:()=>{zoomBy(1);return'stay'}},{t:'Zoom Out',f:()=>{zoomBy(-1);return'stay'}}]},
 {t:'Route',sub:[{t:'Route to Cursor',f:navTo},{t:'Clear Route',f:clearRoute}]},
 {t:'Move',sub:[{t:'Current Location',f:goHere},{t:'Coordinate',f:()=>{setTimeout(askCoord,0)}}]},
 {t:'Register',sub:[{t:'Register Cursor',f:registerHere},{t:'Delete Last',f:()=>{const P=pts();P.pop();savePts(P);drawPts();UI.toast('Deleted')}}]}
];
const openMenu=first=>{if(UI.menu.active())UI.menu.close();else UI.menu.open(TREE(),first)};
const askCoord=()=>{KMAP.on(KEYBAR,5);UI.ask.open('Enter Coordinate …',goCoord)};

/* ===== キー入力 ===== */
function fk(n){
 UI.menu.close();
 ({1:()=>openMenu(0),2:()=>openMenu(1),3:registerHere,4:listPoints,5:askCoord,6:toggleInfo,7:()=>{map.setStyle(STYLE);UI.toast('Reload Map')},8:()=>location.replace('../index.html')})[n]();
}
function back(){
 if(UI.ask.active()){UI.ask.close();KMAP.on(KEYBAR,infoOn?6:0)}
 else if(UI.menu.active())UI.menu.back();
 else if(infoOn)toggleInfo();
}
addEventListener('keydown',e=>{
 if(!map)return;
 if(e.key==='Shift'){if(!e.repeat)shiftClean=true;return}
 shiftClean=false;
 if(UI.ask.active()){if(e.key==='Enter'&&!e.isComposing){e.preventDefault();UI.ask.submit();KMAP.on(KEYBAR,infoOn?6:0)}else if(e.key==='Escape')back();return}
 const k=e.key,n=KMAP.norm(e);
 if(k==='Tab'||k===' '){e.preventDefault();openMenu((k==='Tab')===(C.menuKeys==='Space=Menu / Tab=Tool')?1:0);return}
 if(/^[1-8]$/.test(n)){e.preventDefault();fk(n);return}
 if(UI.menu.active()){e.preventDefault();if(['up','down','left','right','enter'].includes(n))UI.menu.key(n);else if(n==='esc')UI.menu.back();return}
 if(infoOn&&(k==='q'||k==='Q'||k==='e'||k==='E')){infoPage=(infoPage+(k==='e'||k==='E'?1:2))%3;drawInfo();return}
 const s=C.panStep;
 if(k==='ArrowUp'){e.preventDefault();map.panBy([0,-s],{duration:D})}
 else if(k==='ArrowDown'){e.preventDefault();map.panBy([0,s],{duration:D})}
 else if(k==='ArrowLeft'){e.preventDefault();map.panBy([-s,0],{duration:D})}
 else if(k==='ArrowRight'){e.preventDefault();map.panBy([s,0],{duration:D})}
 else if(k==='+'||k==='='||k==='PageUp'){e.preventDefault();zoomBy(C.zoomStep)}
 else if(k==='-'||k==='_'||k==='PageDown'){e.preventDefault();zoomBy(-C.zoomStep)}
 else if(k.toLowerCase()===rk()[0])rotate(-15);
 else if(k.toLowerCase()===rk()[1])rotate(15);
 else if(k==='w'||k==='W')tilt(10);
 else if(k==='s'||k==='S')tilt(-10);
 else if(k==='Enter'&&C.enterInfo){e.preventDefault();toggleInfo()}
});
addEventListener('keyup',e=>{if(e.key==='Shift'&&shiftClean){shiftClean=false;back()}});
['mousedown','mouseup','click','dblclick','wheel','contextmenu','pointerdown','touchstart','touchmove'].forEach(t=>addEventListener(t,e=>{e.preventDefault();e.stopPropagation()},{capture:true,passive:false}));

/* ===== 設定の反映 ===== */
function sp(){const m=String(C.startPoint).match(/(-?\d+(?:\.\d+)?)[\s,]+(-?\d+(?:\.\d+)?)/);return m?[+m[2],+m[1]]:[139.767125,35.681236]}
function applyCfg(){
 mode3d=C.defaultMode==='3D';northUp=C.defaultCompass==='North-up';follow=C.followOnStart;showLabels=C.labels;D=C.animMs;window.TOAST_MS=C.toastSec*1000;
 [['#cx',C.crosshair],['#compass',C.showCompass],['#scale',C.showScale],['#stat',C.showStatus],['#logo',C.showLogo],['#keys',C.showKeyBar]].forEach(([s,v])=>$(s).style.display=v?'':'none');
}
function iconSvg(){const s=C.iconSize,p={Arrow:'<path d="M13 2L22 23L13 18L4 23Z"/>',Circle:'<circle cx="13" cy="14" r="8"/><path d="M13 2v6"/>',Diamond:'<path d="M13 1L25 13L13 25L1 13Z"/>'}[C.iconShape];return `<svg width="${s}" height="${s}" viewBox="0 0 26 26" fill="none" stroke="#ff8a00" stroke-width="2">${p}</svg>`}
function cf(v,p,n){return C.coordFormat==='Decimal'?`${v<0?n:p} ${Math.abs(v).toFixed(6)}°`:dms(v,p,n)}
function clock(t){return C.timeFormat==='12h'?t.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}):String(t.getHours()).padStart(2,'0')+':'+String(t.getMinutes()).padStart(2,'0')}
function rk(){return C.rotKeys==='Q / E'?['q','e']:[',','.']}
