/* SA Mod Manager - 09-installs.js: game installation selector (Game drop-down) */
/* Classic script: loaded in order by index.html, shares globals with the other files. */
/* game selector */
const CHK='<svg class="ck" viewBox="0 0 12 12" width="12" height="12"><path d="M2.5 6.5 5 9l4.5-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
function renderInst(){const ci=curInst();$('#tbs').textContent=ci?`${ci.name} · ${S.cur}`:'';$('#iddt').textContent=ci?ci.name:(S.gname||'No game');
 $('#iddm').innerHTML=S.installs.map(i=>`<div class="ddi ${i.id===S.curInst?'sel':''}" role="option" data-id="${esc(i.id)}"${i.path?` title="${esc(i.path)}"`:''}>${CHK}<span class="nmx">${esc(i.name)}</span>${i.path?`<small>${esc(i.path)}</small>`:''}<button class="x" data-del="${esc(i.id)}" aria-label="Forget this installation" title="Forget this installation">×</button></div>`).join('')+(S.installs.length?'<div class="ddsep"></div>':'')+'<div class="ddi add" data-add="1">+ Add installation…</div>'}
const iOpen=o=>{if(!o)tipOff();$('#iddm').hidden=!o;$('#iddb').setAttribute('aria-expanded',o)};
$('#iddb').onclick=()=>iOpen($('#iddm').hidden);
$('#iddb').onkeydown=e=>{if(e.key==='Escape')iOpen(false)};
document.addEventListener('click',e=>{if(!e.target.closest('#idd'))iOpen(false)});
$('#iddm').onclick=async e=>{const del=e.target.closest('[data-del]');
 if(del){e.stopPropagation();iOpen(false);const i=S.installs.find(x=>x.id===del.dataset.del);
  if(i&&await ask({title:`Forget “${i.name}”?`,text:'Only this manager’s link to the folder is removed. Nothing is deleted from disk.',ok:'Forget',danger:true})){const o=await idb('get',i.id).catch(()=>null),rec={...i};await forgetInst(i.id);toast(`Forgot “${i.name}”`,async()=>{S.installs.push(rec);if(o)try{await idb('put',rec.id,o)}catch(e){}render()})}return}
 if(e.target.closest('[data-add]')){iOpen(false);pick();return}
 const row=e.target.closest('[data-id]');if(row){iOpen(false);switchInst(row.dataset.id)}};
