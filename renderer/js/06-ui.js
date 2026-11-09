/* SA Mod Manager - 06-ui.js: sidebar panel state, patchList() DOM morphing, ask() dialog, expanding mod rows */
/* Classic script: loaded in order by index.html, shares globals with the other files. */
document.querySelectorAll('.side details').forEach(d=>{if(d.id in S.panels)d.open=S.panels[d.id];d.addEventListener('toggle',()=>{S.panels[d.id]=d.open;save()})});
new ResizeObserver(()=>document.documentElement.style.setProperty('--hh',(document.querySelector('header').offsetHeight+40)+'px')).observe(document.querySelector('header'));
function patchList(mods,hs){const L=$('#list');
 if(!mods.length){L.innerHTML='<div class="empty">No mods to show. Scan your GTA folder to list the mods you already have, or install a new one.</div>';return}
 if(L.firstElementChild&&L.firstElementChild._k===undefined)L.innerHTML='';
 const old=new Map();[...L.children].forEach(el=>{if(el._k!==undefined)old.set(el._k,el)});const t=document.createElement('template');
 mods.forEach((m,i)=>{const h=hs[i];let el=old.get(m.name);old.delete(m.name);
  if(!el||el._h!==h){t.innerHTML=h;const n=t.content.firstElementChild;if(el){morph(el,n);el._h=h}else{n._k=m.name;n._h=h;el=n}}
  const cur=L.children[i];if(cur!==el)L.insertBefore(el,cur||null)});
 old.forEach(el=>el.remove())}
function pulse(){document.body.classList.add('anim');clearTimeout(pulse.t);pulse.t=setTimeout(()=>document.body.classList.remove('anim'),750)}
function ask(o){return new Promise(res=>{const d=$('#askd'),inp=$('#askin');
 $('#asktitle').textContent=o.title||'';$('#asktext').textContent=o.text||'';inp.hidden=!o.input;inp.type=o.password?'password':'text';inp.value=o.value||'';inp.placeholder=o.placeholder||'';
 $('#askok').textContent=o.ok||'OK';$('#askno').hidden=!!o.info;$('#askok').classList.toggle('del',!!o.danger);
 let done=false;const fin=v=>{if(done)return;done=true;d.close();res(v)};
 $('#askok').onclick=()=>fin(o.input?inp.value:true);$('#askno').onclick=()=>fin(o.input?null:false);
 const al=$('#askalt');al.hidden=!o.alt;al.textContent=o.alt||'';al.onclick=()=>fin('alt');
 inp.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();fin(inp.value)}};
 d.oncancel=e=>{e.preventDefault();fin(o.input?null:false)};
 d.showModal();if(o.input){inp.focus();inp.select()}else $('#askok').focus()})}
const notice=(title,text)=>ask({title,text,info:true});
/* smooth expanding: only the affected rows animate, the rest of the list is left alone */
function toggleMod(el,m){const fi=el.querySelector('.files>.fi');clearTimeout(el._t);
 if(!m._o){m._o=true;fi.innerHTML=tree(m);void fi.offsetHeight;el.classList.add('open')}
 else{m._o=false;el.classList.remove('open');el._t=setTimeout(()=>{if(!m._o)fi.innerHTML=''},360)}
 {const cb=el.querySelector('.chev');if(cb)cb.setAttribute('aria-expanded',String(!!m._o))}save()}
function foldDir(m,row){const p=row.dataset.p,kids=row.nextElementSibling,ki=kids.firstElementChild;m._x=m._x||{};clearTimeout(kids._t);
 if((m._q||'').trim()){row.classList.toggle('open');kids.classList.toggle('open');return}
 if(!m._x[p]){m._x[p]=true;row.classList.add('open');ki.innerHTML=treeBody(m,{p});void ki.offsetHeight;kids.classList.add('open')}
 else{m._x[p]=false;row.classList.remove('open');kids.classList.remove('open');kids._t=setTimeout(()=>{if(!m._x[p])ki.innerHTML=''},340)}
 save()}
function bulkFold(el,m,open){const tb=el.querySelector('.tb');m._x={};if(open)dirsOf(m).forEach(d=>m._x[d]=true);
 tb.innerHTML=treeBody(m);tb.classList.add('swap');setTimeout(()=>tb.classList.remove('swap'),320);save()}
