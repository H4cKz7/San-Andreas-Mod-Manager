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
 $('#asktitle').textContent=o.title||'';{const at=$('#asktext');at.classList.toggle('rn',!!o.html);if(o.html)at.innerHTML=o.html;else at.textContent=o.text||''}inp.hidden=!o.input;inp.type=o.password?'password':'text';inp.value=o.value||'';inp.placeholder=o.placeholder||'';
 $('#askok').textContent=o.ok||'OK';$('#askno').hidden=!!o.info;$('#askok').classList.toggle('del',!!o.danger);
 let chk=null;{const oc=$('#askchk');if(oc)oc.remove();
 if(o.check||o.keep){chk=document.createElement('div');chk.id='askchk';chk.style.cssText='display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;margin:12px 0 0;text-align:left';
  chk._kept=new Set();chk._cb=null;let syncEss=()=>{};
  if(o.keep){/* SAMM-KEEP: expandable, searchable list of folders that stay on (o.keep={label,list:[{id,t,s}],value:[ids]}), read back from ask.kept. Same details/.ckf look as the list below. */
   const L=o.keep.list||[],ids=new Set(L.map(n=>n.id)),dt=document.createElement('details'),sm=document.createElement('summary'),s1=document.createElement('span'),s2=document.createElement('span'),bd=document.createElement('div'),tb=document.createElement('div'),sr=document.createElement('input'),cl=document.createElement('button'),ls=document.createElement('div'),em=document.createElement('div'),rows=[];
   (o.keep.value||[]).forEach(n=>{if(ids.has(n))chk._kept.add(n)});
   dt.className='ckf';dt.style.flex='1 0 100%';dt.style.margin='0';s1.textContent=o.keep.label||'Keep these folders on during all tests';s2.className='pill';sm.append(s1,s2);
   bd.style.cssText='padding:6px 0 2px;font-size:13px';
   tb.style.cssText='display:flex;gap:8px;align-items:center;margin-bottom:6px';
   sr.type='search';sr.placeholder='Search folders';sr.style.cssText='flex:1;min-width:0;height:30px;padding:4px 10px;font-size:13px';
   cl.type='button';cl.className='btn sm';cl.textContent='Clear';tb.append(sr,cl);
   ls.style.cssText='max-height:150px;overflow:auto';
   em.style.cssText='color:var(--mut);padding:4px 0';em.hidden=true;
   const cnt=()=>{s2.textContent=chk._kept.size;cl.disabled=!chk._kept.size};
   L.forEach(n=>{const r=document.createElement('label'),ic=document.createElement('input'),a=document.createElement('span'),g=n.t||n.id;
    ic.type='checkbox';ic.checked=chk._kept.has(n.id);a.textContent=g;a.style.cssText='overflow:hidden;text-overflow:ellipsis;white-space:nowrap';
    r.title=g;r.style.cssText='display:flex;gap:10px;align-items:center;padding:3px 0;cursor:pointer';r.append(ic,a);
    if(n.s){const s=document.createElement('small');s.textContent=n.s;s.style.cssText='margin-left:auto;color:var(--mut);font-size:12px;white-space:nowrap';r.append(s)}
    ic.addEventListener('change',()=>{if(ic.checked)chk._kept.add(n.id);else chk._kept.delete(n.id);cnt();syncEss()});
    rows.push({r,ic,k:g.toLowerCase()});ls.append(r)});
   const filt=()=>{const q=sr.value.trim().toLowerCase();let v=0;rows.forEach(x=>{const h=!!q&&!x.k.includes(q);x.r.hidden=h;if(!h)v++});em.textContent=L.length?'No folders match “'+sr.value.trim()+'”.':'No turned-on mod folders in this profile.';em.hidden=v>0};
   sr.addEventListener('input',filt);
   sr.addEventListener('keydown',e=>{if(e.key==='Escape'&&sr.value){e.preventDefault();e.stopPropagation();sr.value='';filt()}});/* Esc clears the search first instead of closing the dialog */
   cl.onclick=()=>{chk._kept.clear();rows.forEach(x=>{x.ic.checked=false});cnt();syncEss()};
   bd.append(tb,ls,em);dt.append(sm,bd);chk.append(dt);cnt();filt()}
  if(o.check){
   const lb=document.createElement('label'),cb=document.createElement('input'),sp=document.createElement('span'),nt=document.createElement('div');
   lb.style.cssText='display:flex;gap:8px;align-items:center;cursor:pointer';
   cb.type='checkbox';cb.checked=!!o.check.value;sp.textContent=o.check.label||'';lb.append(cb,sp);chk.append(lb);chk._cb=cb;
   nt.style.cssText='flex:1 0 100%;color:var(--mut);font-size:12.5px';nt.hidden=true;chk.append(nt);
   let dt=null,s2=null;
   if(o.check.list){/* expandable list of the items that stay on (details/summary, .ckf look from 06-header-checker.css). An item with m (a mod folder name) that is in a kept folder is locked. */
    const L=o.check.list,sm=document.createElement('summary'),s1=document.createElement('span'),bd=document.createElement('div');
    dt=document.createElement('details');s2=document.createElement('span');
    dt.className='ckf';dt.style.flex='1 0 100%';dt.style.margin='0';s1.textContent='Plugins that stay on (untick one to test it)';s2.className='pill';sm.append(s1,s2);
    bd.style.cssText='max-height:150px;overflow:auto;padding:6px 0 2px;font-size:13px';
    if(L.length)L.forEach(n=>{const r=document.createElement(n.id?'label':'div'),a=document.createElement('span'),g=typeof n==='string'?n:n.t;
     a.textContent=g;a.style.cssText='overflow:hidden;text-overflow:ellipsis;white-space:nowrap';r.title=g+(n.s?' – '+n.s:'');r.style.cssText='display:flex;gap:10px;align-items:center;padding:3px 0'+(n.id?';cursor:pointer':'');
     let ic=null,sm2=null;
     if(n.id){ic=document.createElement('input');ic.type='checkbox';ic.checked=n.on!==false;r.append(ic);ic.addEventListener('change',()=>upd())}
     r.append(a);
     if(n.s){sm2=document.createElement('small');sm2.textContent=n.s;sm2.style.cssText='margin-left:auto;color:var(--mut);font-size:12px;white-space:nowrap;max-width:45%;overflow:hidden;text-overflow:ellipsis';r.append(sm2)}
     if(ic)(chk._rows=chk._rows||[]).push({id:n.id,m:n.m,cb:ic,row:r,sm:sm2,s:n.s});
     bd.append(r)});
    else{bd.textContent='No Essentials pack plugins were found in this profile.';bd.style.color='var(--mut)'}
    dt.append(sm,bd);chk.append(dt)}
   /* locks plugins that sit in a kept folder; when all of them do, the whole option is greyed out */
   const upd=()=>{const ks=chk._kept,R=chk._rows||[];
    R.forEach(x=>{const k=!!x.m&&ks.has(x.m);x.cb.disabled=k;x.row.style.opacity=k?'.5':'';x.row.style.cursor=k?'default':'pointer';if(x.sm)x.sm.textContent=k?'in a kept folder':x.s});
    const all=R.length>0&&R.every(x=>!!x.m&&ks.has(x.m));
    cb.disabled=all;lb.style.opacity=all?'.5':'';lb.style.cursor=all?'default':'pointer';
    nt.hidden=!all;nt.textContent=all?(o.check.lockNote||'All the Essentials plugins are already in the kept folders, so they stay on for every test.'):'';
    if(s2)s2.textContent=R.filter(x=>x.cb.checked&&!x.cb.disabled).length;
    if(dt)dt.style.display=cb.checked&&!all?'':'none'};
   cb.addEventListener('change',upd);syncEss=upd;upd()}
  $('#asktext').after(chk)}}
 ask.checked=false;ask.items=[];ask.kept=[];
 let done=false;const fin=v=>{if(done)return;done=true;if(chk){ask.checked=!!(chk._cb&&chk._cb.checked);ask.items=(chk._rows||[]).filter(x=>x.cb.checked&&!x.cb.disabled).map(x=>x.id);ask.kept=[...chk._kept];chk.remove()}d.close();res(v)};
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
