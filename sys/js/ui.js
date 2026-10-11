// UI部品: トースト / メニュー(多段パネル) / 入力ポップアップ
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/</g,'&lt;');
const UI=(()=>{
 let tt,panels=[],cb=null;
 const lab=i=>typeof i.t==='function'?i.t():i.t;
 const last=()=>panels[panels.length-1];
 const toast=(t,ms=window.TOAST_MS||3000)=>{const e=$('#toast');e.textContent=t;e.style.display='block';clearTimeout(tt);tt=setTimeout(()=>e.style.display='none',ms)};
 function render(){
  $('#menu').innerHTML=panels.map(p=>`<div class="box mp" style="margin-top:${p.mt}px">${p.title?`<div class="mh">${esc(p.title)}</div>`:''}${p.items.map((it,i)=>`<div class="it${i===p.idx?' on':''}"><span>${esc(lab(it))}</span>${it.sub?'<span>&gt;</span>':''}</div>`).join('')}</div>`).join('');
 }
 function push(it){const p=last();panels.push({items:typeof it.sub==='function'?it.sub():it.sub,idx:0,mt:p.mt+(p.title?44:0)+p.idx*23})}
 const menu={
  active:()=>panels.length>0,
  open(items,first,title='Menu'){panels=[{title,items,idx:first||0,mt:0}];if(first&&items[first].sub)push(items[first]);render()},
  close(){panels=[];render()},
  back(){if(panels.length>1)panels.pop();else panels=[];render()},
  key(k){
   const p=last(),n=p.items.length;
   if(k==='up')p.idx=(p.idx+n-1)%n;else if(k==='down')p.idx=(p.idx+1)%n;
   else if(k==='left')menu.back();
   else{const it=p.items[p.idx];if(it.sub)push(it);else if(k==='enter'&&it.f){if(it.f()!=='stay')panels=[]}}
   render();
  }
 };
 const ask={
  open(label,f,init=''){const a=$('#ask');a.style.display='block';a.innerHTML=`<div class="mh">${esc(label)}</div><input class="in" id="ain" autocomplete="off">`;const i=$('#ain');i.value=init;i.focus();cb=f},
  close(){$('#ask').style.display='none';cb=null;if(document.activeElement)document.activeElement.blur()},
  submit(){const v=$('#ain').value.trim(),f=cb;ask.close();if(v&&f)f(v)},
  active:()=>!!cb
 };
 return{toast,menu,ask};
})();
