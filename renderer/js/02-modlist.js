/* SA Mod Manager - 02-modlist.js: icons, file tree, render() of the mod list, list events, profile / Folder.Config sidebar UI */
/* Classic script: loaded in order by index.html, shares globals with the other files. */
const FO='<svg class="fo" viewBox="0 0 16 16"><path d="M1.5 4A1.5 1.5 0 0 1 3 2.5h2.9l1.6 1.7H13A1.5 1.5 0 0 1 14.5 5.7v6.8A1.5 1.5 0 0 1 13 14H3a1.5 1.5 0 0 1-1.5-1.5z" fill="currentColor" fill-opacity=".28" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M1.5 6.7h13" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>',
 FI='<svg class="fi" viewBox="0 0 16 16"><path d="M4 1.5h5.5L13 5v9a.5.5 0 0 1-.5.5h-8.5a.5.5 0 0 1-.5-.5v-12a.5.5 0 0 1 .5-.5z" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>',
 CV='<svg class="cv" viewBox="0 0 12 12"><path d="M4 2.5 8 6 4 9.5"/></svg>';
const TI='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.8 4.5h10.4M6.2 4.5V3h3.6v1.5M4.2 4.5l.6 8.6h6.4l.6-8.6M6.6 7v3.8M9.4 7v3.8"/></svg>';
const dirsOf=m=>{const o=new Set();m.files.forEach(f=>{const ps=f.split('/');ps.pop();ps.forEach((_,i)=>o.add(ps.slice(0,i+1).join('/')))});return[...o]};
function treeBody(m,focus){const q=(m._q||'').trim().toLowerCase(),root={d:{},f:[]};
 m.files.forEach((f,j)=>{if(q&&!f.toLowerCase().includes(q))return;const ps=f.split('/'),n=ps.pop();let c=root;ps.forEach(x=>c=c.d[x]||(c.d[x]={d:{},f:[]}));c.f.push([n,j])});
 const cnt=n=>n.f.length+Object.values(n.d).reduce((a,x)=>a+cnt(x),0),cmp=(a,b)=>a.localeCompare(b,undefined,{numeric:true,sensitivity:'base'});
 const draw=(n,path,d)=>{let h='';
  Object.keys(n.d).sort(cmp).forEach(k=>{const p=path?path+'/'+k:k,pat=`${p}/**`,open=!!q||!!(m._x&&m._x[p]),ig=pat in E.ig,c=n.d[k],k2=cnt(c);
   h+=`<div class="tr dir ${open?'open':''} ${ig?'ign':''} ${selCls(m.name,p)}" style="--d:${d}" data-a="fold" data-p="${esc(p)}" data-rel="${esc(p)}" draggable="true">${CV}${FO}<span class="nm">${esc(k)}</span><small>${k2} file${k2>1?'s':''}</small><button data-a="idir" data-p="${esc(p)}">${ig?'Unignore':'Ignore'}</button><button class="trash" data-a="tdir" data-p="${esc(p)}" title="Move folder to Trash" aria-label="Move folder to Trash">${TI}</button></div><div class="kids ${open?'open':''}"><div class="ki">${open?draw(c,p,d+1):''}</div></div>`});
  n.f.sort((a,b)=>cmp(a[0],b[0])).forEach(([nm,j])=>{const ig=fileIgnored(m.name,m.files[j]);
   h+=`<div class="tr ${ig?'ign':''} ${selCls(m.name,m.files[j])}" style="--d:${d}" data-rel="${esc(m.files[j])}" draggable="true">${FI}<span class="nm">${esc(nm)}</span><button data-a="if" data-j="${j}">${ig?'Unignore':'Ignore'}</button><button class="trash" data-a="tf" data-j="${j}" title="Move file to Trash" aria-label="Move file to Trash">${TI}</button></div>`});
  return h};
 if(focus){let n=root;for(const x of focus.p.split('/'))n=n.d[x]||{d:{},f:[]};return draw(n,focus.p,focus.p.split('/').length+1)}
 if(q&&!Object.keys(root.d).length&&!root.f.length)return '<div class="stats" style="padding:8px 4px">No files match</div>';
 const mi=!!hit(E.im,m.name);return `<div class="tr root ${mi?'ign':''}" style="--d:0" data-rel="">${FO}<span class="nm">${esc(m.name)}</span><small>${q?'matching files':m.files.length+' file'+(m.files.length>1?'s':'')}</small></div>`+draw(root,'',1)}
function tree(m){const nd=dirsOf(m).length;
 return `<div class="fh">${nd?'<button class="btn sm" data-a="expand">Expand all</button><button class="btn sm" data-a="collapse">Collapse all</button>':''}<input type="search" class="tq" placeholder="Search files" value="${esc(m._q||'')}" aria-label="Search files in this mod"></div><div class="tb">${treeBody(m)}</div>`}
function status(m){const n=m.name;
 if(E.ia)return['Ignored (profile ignores all mods)','bad'];
 if(E.ea){if(!hit(E.inc,n))return['Excluded (not in IncludeMods)','warn']}
 else{if(hit(E.im,n))return['Ignored','bad'];if(prio(n)===0)return['Disabled (priority 0)','bad']}
 const x=exOther(n);if(x)return[`Exclusive to ${x}`,'warn'];
 return['Active','st']}
function render(){
  undoTrack();E=eff();const p=P(),q=$('#q').value.toLowerCase();
  const ns=Object.keys(S.profiles),rest=ns.filter(n=>n!=='Default'),it=n=>{const pa=fx(n).par;return `<div class="ddi ${n===S.active?'sel':''}" role="option" data-v="${esc(n)}"><svg class="ck" viewBox="0 0 12 12" width="12" height="12"><path d="M2.5 6.5 5 9l4.5-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>${esc(n)}${n===S.cur?'<span class="cb">current</span>':''}${pa.length?`<small>inherits ${esc(pa.map(a=>a.toLowerCase()==='$current'?`$current (${S.cur===n?'itself':S.cur})`:a).join(', '))}</small>`:''}</div>`};
  $('#ddt').textContent=S.active;$('#curp').textContent='$current = '+S.cur;$('#setcur').hidden=S.active===S.cur;
  $('#ddm').innerHTML=(ns.includes('Default')?`<div class="ddg">Default</div>${it('Default')}`:'')+(rest.length?`<div class="ddg">Session profiles</div>${rest.map(it).join('')}`:'');
  const act=S.mods.filter(m=>status(m)[1]==='st').length;
  $('#stats').textContent=`${act} of ${S.mods.length} mods active`+(E.ia?' · ignoring all mods':E.ea?' · include-only mode':'');
  const byName=(a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true,sensitivity:'base'});
  const sorters={name:byName,namez:(a,b)=>byName(b,a),prio:(a,b)=>prio(b.name)-prio(a.name)||byName(a,b),priol:(a,b)=>prio(a.name)-prio(b.name)||byName(a,b),status:(a,b)=>(status(a)[1]==='st'?0:1)-(status(b)[1]==='st'?0:1)||byName(a,b),files:(a,b)=>b.files.length-a.files.length||byName(a,b)};
  $('#sortsel').value=S.sort;
  const mods=S.mods.filter(m=>!q||m.name.toLowerCase().includes(q)||m.files.some(f=>f.toLowerCase().includes(q))).sort(sorters[S.sort]||byName);
  const hs=mods.map(m=>{const[st,c]=status(m),i=S.mods.indexOf(m),on=c==='st',v=prio(m.name);
   return `<div class="mod ${on?'':'off'} ${m._o?'open':''} ${selCls(m.name,'')}" data-i="${i}" style="--n:${Math.min(i,10)}">
   <div class="row"><div class="lead"><button class="chev" data-a="open" aria-expanded="${!!m._o}" aria-label="Show or hide the files of ${esc(m.name)}" title="Show or hide files"><svg viewBox="0 0 12 12" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 2.5 8 6 4 9.5"/></svg></button><label class="switch" title="${E.ea?'Include this mod':'Ignore this mod'}"><input type="checkbox" data-a="ign" ${swOn(m.name)?'checked':''} aria-label="Toggle ${esc(m.name)}"><span class="slider"></span></label></div>
   <div style="min-width:0" class="mdrag" draggable="true"><div class="name" data-a="open">${FO}<span class="nt">${esc(m.name)}</span></div><div class="meta"><span class="tag ${c}">${st}</span>${typesOf(m).map(t=>`<span class="tag">${t}</span>`).join('')}<span>${m.files.length} files</span>${inh(m.name)}</div></div>
   <div class="pr"><input type="range" min="0" max="${S.pl??100}" value="${v}" style="--p:${Math.min(100,v/(S.pl??100)*100)}%" data-a="pr" aria-label="Priority"><output title="Double-click to type a priority">${v}</output></div>
   <div style="display:flex;gap:6px"><button class="star ${hit(E.ex,m.name)?'on':''}" data-a="ex" title="Exclusive: hidden from other profiles unless they inherit this one" aria-label="Exclusive"><svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M8 1.9l1.85 3.9 4.25.55-3.1 2.95.78 4.2L8 11.4l-3.78 2.1.78-4.2L1.9 6.35l4.25-.55z" transform="translate(0 .4)" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg></button><button class="btn sm del" data-a="rm">Remove</button></div></div>
   <div class="files"><div class="fi">${m._o?tree(m):''}</div></div></div>`});patchList(mods,hs);
  {const fi=FO.replace('<svg ','<svg width="12" height="12" ');
   $('#chips').innerHTML=(p.im.length||p.ig.length)?p.im.map((x,i)=>`<span class="chip" title="Ignored mod folder">${fi}${esc(x)}<button data-m="${i}" aria-label="Remove">×</button></span>`).join('')+p.ig.map((x,i)=>`<span class="chip">${esc(x)}<button data-r="${i}" aria-label="Remove">×</button></span>`).join(''):'<span class="stats">Nothing ignored</span>'}
  $('#ini').textContent=ini();save();
  $('#src').textContent=srcText;{const n=files().filter(([p,t])=>written[p]!==t).length;if(!SAVEHOLD){$('#save').disabled=!root||!n;$('#save').classList.toggle('pri',n>0);$('#savet').textContent=n?`Save changes (${n})`:'Save changes'}$('#rescan').disabled=!(root||game);$('#undo').disabled=!UNDO.stack.length;$('#redo').disabled=!UNDO.redo.length;{const u=UNDO.stack.length,r=UNDO.redo.length;$('#undomore').disabled=!u;$('#redomore').disabled=!r;$('#undoalln').textContent=u;$('#redoalln').textContent=r}}
  $('#logb').style.visibility=root?'visible':'hidden';$('#mkcut').disabled=!S.exes.length;renderProf();renderSettings();renderPlugins();renderInst();renderChecks();mlBtnSync();renderTrash();{const cl=!canLaunch();$('#launch').disabled=cl;$('#launchmore').disabled=cl}
}
let PVsel='',PVlast='';
function curFile(){const fl=files(),a=ppath(S.active);if(S.active!==PVlast){PVlast=S.active;PVsel=a}return fl.find(x=>x[0]===PVsel)||fl.find(x=>x[0]===a)||fl[0]}
function ini(){const fl=files(),f=curFile();
 cddOptions($('#pvsel'),fl.map(([p])=>({v:p,t:p+(p===ppath(S.active)?'  · editing':'')})),f[0]);
 $('#pvpath').textContent='modloader/'+f[0];return f[1]||'; (empty)'}
$('#pvsel').onchange=e=>{PVsel=e.target.value;render()};
const tog=(a,v)=>{const i=a.indexOf(v);i<0?a.push(v):a.splice(i,1)};
/* The row is updated in place (never replaced), so the switch under the cursor keeps its hover and focus.
   The browser reverts the click's own toggle after the handler (preventDefault), so the final state is applied on the
   next frame: the same element then slides from the old position to the new one. */
function slideSw(i,now){requestAnimationFrame(()=>{const n=document.querySelector('#list .mod[data-i="'+i+'"] .switch input');if(n&&n.checked!==now)n.checked=now})}
function morph(a,b){
 if(a.nodeType!==b.nodeType||a.nodeName!==b.nodeName)return false;
 if(a.nodeType!==1){if(a.data!==b.data)a.data=b.data;return true}
 for(const at of [...a.attributes])if(!b.hasAttribute(at.name))a.removeAttribute(at.name);
 for(const at of [...b.attributes])if(a.getAttribute(at.name)!==at.value)a.setAttribute(at.name,at.value);
 if(a.nodeName==='INPUT'){if(a.type==='checkbox'||a.type==='radio'){const c=b.hasAttribute('checked');if(a.checked!==c)a.checked=c}else{const v=b.getAttribute('value')||'';if(a.value!==v)a.value=v}}
 const ac=[...a.childNodes],bc=[...b.childNodes];
 for(let i=0;i<bc.length;i++){if(i<ac.length){if(!morph(ac[i],bc[i]))ac[i].replaceWith(bc[i])}else a.appendChild(bc[i])}
 while(a.childNodes.length>bc.length)a.lastChild.remove();
 return true}
$('#list').addEventListener('click',e=>{const t=e.target.closest('[data-a]');if(!t)return;
 const m=S.mods[t.closest('.mod').dataset.i],p=P(),a=t.dataset.a;let wasOn=null;if(a==='ign'){e.preventDefault();wasOn=!t.checked}
 if(a==='open'){toggleMod(t.closest('.mod'),m);return}
 else if(a==='fold'){foldDir(m,t);return}
 else if(a==='expand'||a==='collapse'){bulkFold(t.closest('.mod'),m,a==='expand');return}
 else if(a==='idir'){const pat=`${t.dataset.p}/**`,i=p.ig.findIndex(x=>x.toLowerCase()===pat.toLowerCase());
  if(i>=0)p.ig.splice(i,1);else if(pat in E.ig)return toast(`Ignored by parent “${E.ig[pat]}” — change it there`);else{p.ig.push(pat);toast('Ignored in every mod that has this folder')}}
 else if(a==='ign'){if(E.ia)return toast('This profile ignores all mods');
  const lst=E.ea?p.inc:p.im,o=E.ea?E.inc:E.im;
  if(!hit(o,m.name))lst.push(m.name);
  else{const i=lst.findIndex(x=>x.toLowerCase()===m.name.toLowerCase());if(i>=0)lst.splice(i,1);else{const q=hit(o,m.name);return toast(q!==S.active?`Set by parent “${q}” — change it there`:'Matched by a wildcard in this profile — edit the pattern')}}}
 else if(a==='ex'){const i=p.ex.findIndex(x=>x.toLowerCase()===m.name.toLowerCase());
  if(i>=0)p.ex.splice(i,1);else if(hit(E.ex,m.name))return toast('Matched by a wildcard in this profile — edit the pattern');else p.ex.push(m.name)}
 else if(a==='if'){const f=m.files[t.dataset.j],i=p.ig.findIndex(x=>x.toLowerCase()===f.toLowerCase());
   if(fileIgnored(m.name,f)){if(i>=0)p.ig.splice(i,1);else return toast('Ignored by a wildcard pattern or a parent — edit the pattern on the right')}else{p.ig.push(f);toast('Ignored in every mod that has this path')}}
 else if(a==='rm'){trashMod(m);return}
 else if(a==='tf'){trashPath(m,m.files[t.dataset.j],false);return}
 else if(a==='tdir'){trashPath(m,t.dataset.p,true);return}
 else return;render();if(wasOn!==null)slideSw(S.mods.indexOf(m),swOn(m.name))});
$('#list').addEventListener('input',e=>{if(e.target.classList.contains('tq')){const el=e.target.closest('.mod'),m=S.mods[el.dataset.i];m._q=e.target.value;clearTimeout(el._qt);el._qt=setTimeout(()=>{el.querySelector('.tb').innerHTML=treeBody(m)},90);return}
 if(e.target.dataset.a!=='pr')return;
 const m=S.mods[e.target.closest('.mod').dataset.i],v=+e.target.value;setPr(P(),m.name,v);
 e.target.nextElementSibling.textContent=v;e.target.style.setProperty('--p',Math.min(100,v/(+e.target.max||100)*100)+'%');$('#ini').textContent=ini();save()});
$('#list').addEventListener('change',e=>{if(e.target.dataset.a==='pr')render()});
var _qt;$('#q').oninput=()=>{clearTimeout(_qt);_qt=setTimeout(render,90)};$('#sortsel').onchange=e=>{S.sort=e.target.value;render()};
const ddb=$('#ddb'),ddm=$('#ddm');let hl=-1;
const hlSet=()=>{const it=[...ddm.querySelectorAll('.ddi')];it.forEach((x,i)=>x.classList.toggle('hl',i===hl));if(it[hl])it[hl].scrollIntoView({block:'nearest'})};
const ddOpen=o=>{ddm.hidden=!o;ddb.setAttribute('aria-expanded',o);if(o){hl=[...ddm.querySelectorAll('.ddi')].findIndex(x=>x.dataset.v===S.active);hlSet()}};
ddb.onclick=()=>ddOpen(ddm.hidden);
ddm.onclick=e=>{const i=e.target.closest('.ddi');if(i){S.active=i.dataset.v;ddOpen(false);render()}};
document.addEventListener('click',e=>{if(!e.target.closest('#dd'))ddOpen(false)});
ddb.onkeydown=e=>{const it=ddm.querySelectorAll('.ddi');
 if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if(ddm.hidden)return ddOpen(true);hl=(hl+(e.key==='ArrowDown'?1:-1)+it.length)%it.length;hlSet()}
 else if(e.key==='Enter'&&!ddm.hidden&&it[hl]){e.preventDefault();it[hl].click()}
 else if(e.key==='Escape')ddOpen(false)};
const curLabel=(a,n)=>a.toLowerCase()==='$current'?(S.cur===n?'$current → itself (ignored)':`$current → ${S.cur}`):a;
function renderProf(){const p=P();
 const ch=(a,k,f)=>a.length?a.map((x,i)=>`<span class="chip">${esc(f?f(x):x)}<button data-r="${i}" aria-label="Remove">×</button></span>`).join(''):'<span class="stats">None</span>';
 $('#parchips').innerHTML=p.par.length?ch(p.par,'par',x=>curLabel(x,S.active)):'<span class="stats">None ($None)</span>';
 $('#inchips').innerHTML=ch(p.inc,'inc');
 if(document.activeElement!==$('#um'))$('#um').value=p.um||'';
 $('#ia').checked=!!E.ia;$('#ea').checked=!!E.ea;
 if(document.activeElement!==$('#plim'))$('#plim').value=S.pl??'';
 $('#plnote').textContent=S.pl!=null?`Mod priorities are currently capped at ${S.pl}.`:'Default limit: priorities go up to 100.'}
const setLim=()=>{const v=parseInt($('#plim').value,10);if(isNaN(v)||v<1)return toast('Enter a whole number of 1 or more');S.pl=v;render()};
$('#plset').onclick=setLim;$('#plim').onkeydown=e=>{if(e.key==='Enter')setLim()};
document.querySelectorAll('.step [data-st]').forEach(b=>b.onclick=e=>{const i=$('#plim'),v=parseInt(i.value||S.pl||100,10)||100;i.value=Math.max(1,v+(+b.dataset.st)*(e.shiftKey?10:1));setLim()});
$('#plclr').onclick=()=>{S.pl=null;$('#plim').value='';render()};
$('#parchips').onclick=e=>{const b=e.target.closest('button');if(!b)return;P().par.splice(b.dataset.r,1);render()};
$('#inchips').onclick=e=>{const b=e.target.closest('button');if(!b)return;P().inc.splice(b.dataset.r,1);render()};
const addPar=v=>{v=v.trim();const p=P();if(!v)return;const l=v.toLowerCase();
 if(l==='$none')return toast('Leave Parents empty for $None');
 if(l==='$current')v='$current';
 else{const k=Object.keys(S.profiles).find(x=>x.toLowerCase()===l);
  if(!k)return toast(`No profile named “${v}”`);if(k===S.active)return toast('A profile can’t be its own parent');
  if(reach(k,S.active))return toast(`“${k}” already inherits from this profile (circular)`);v=k}
 if(!p.par.some(x=>x.toLowerCase()===v.toLowerCase()))p.par.push(v);$('#par').value='';render()};
$('#padd').onclick=()=>addPar($('#par').value);$('#pcur').onclick=()=>addPar('$current');$('#par').onkeydown=e=>{if(e.key==='Enter')addPar(e.target.value)};
const setUm=()=>{P().um=$('#um').value.trim();render()};
$('#uset').onclick=setUm;$('#um').onkeydown=e=>{if(e.key==='Enter')setUm()};$('#uclr').onclick=()=>{P().um='';$('#um').value='';render()};
const addIn=()=>{const v=$('#inpat').value.trim(),p=P();if(!v)return;if(!p.inc.includes(v))p.inc.push(v);$('#inpat').value='';render()};
$('#inadd').onclick=addIn;$('#inpat').onkeydown=e=>{if(e.key==='Enter')addIn()};
$('#ia').onchange=e=>{P().ia=e.target.checked;render()};$('#ea').onchange=e=>{P().ea=e.target.checked;render()};
$('#newProf').onclick=async()=>{const raw=await ask({title:'New profile',text:'It is saved as .profiles/<name>.ini',input:true,placeholder:'Profile name',ok:'Create'});if(raw===null)return;
 const n=raw.trim().replace(/\.ini$/i,'').replace(/[\\/:*?"<>|\[\]]/g,'').replace(/\./g,'_').trim();if(!n)return;
 if(Object.keys(S.profiles).some(k=>k.toLowerCase()===n.toLowerCase()))return toast('A profile with that name already exists');
 S.profiles[n]=newP();src[n]={path:`.profiles/${n}.ini`};S.active=n;render();
 undoReset();await commit(`.profiles/${n}.ini`,`Created .profiles/${n}.ini`);
 toast(`Created .profiles/${n}.ini`,async()=>{const path=`.profiles/${n}.ini`;delete S.profiles[n];delete src[n];S.active=S.cur;
  try{const abs=pathN.join(root._path,...path.split('/'));BK.save(abs,fsN.readFileSync(abs,'utf8'));fsN.rmSync(abs,{force:true});delete written[path]}catch(e){}
  undoReset();render();toast('Profile removed')})};
$('#delProf').onclick=async()=>{const n=S.active;if(n==='Default')return toast('Default can’t be deleted');
 if(n===S.cur)return toast('This is the current profile. Set another profile as current first');
 const path=ppath(n);if(!await ask({title:`Delete profile “${n}”?`,text:root?`It will be removed from ${path}.`:'',ok:'Delete',danger:true}))return;
 const prof0=S.profiles[n],s0=src[n];delete S.profiles[n];delete src[n];undoReset();
 const left=Object.keys(S.profiles).some(k=>ppath(k)===path);
 if(path===S.main||left)await commit(path,`Updated ${path}`);
 else if(root&&await canWrite()){try{try{const abs=pathN.join(root._path,...path.split('/'));BK.save(abs,fsN.readFileSync(abs,'utf8'))}catch(e){}const ps=path.split('/'),f=ps.pop();let d=root;for(const x of ps)d=await d.getDirectoryHandle(x);await d.removeEntry(f);delete written[path];toast(`Removed ${path}`)}catch(e){}}
 S.active=S.cur;render();
 toast(`Deleted “${n}”`,async()=>{S.profiles[n]=prof0;src[n]=s0;S.active=n;undoReset();render();await commit(path,`Restored “${n}”`)})};
const addIg=()=>{const v=$('#ipat').value.trim();if(!v)return;if(!P().ig.includes(v))P().ig.push(v);$('#ipat').value='';render()};
$('#iadd').onclick=addIg;$('#ipat').onkeydown=e=>{if(e.key==='Enter')addIg()};
$('#chips').onclick=e=>{const r=e.target.dataset.r,m=e.target.dataset.m;if(m!=null){P().im.splice(m,1);render()}else if(r!=null){P().ig.splice(r,1);render()}};
$('#copy').onclick=()=>{require('electron').clipboard.writeText(ini());toast('Copied')};
$('#imp').onclick=()=>{const i=document.createElement('input');i.type='file';i.accept='.ini';
 i.onchange=async()=>{const fl=i.files[0],r=parseIniFile(await fl.text()),isMain=/^modloader\.ini$/i.test(fl.name),names=Object.keys(r.profs);
  if(isMain){S.topSecs=r.top;S.pl=r.fc.pl;S.fcl=r.fc.lines;const k=r.fc.profile&&Object.keys(S.profiles).find(x=>x.toLowerCase()===r.fc.profile.toLowerCase());if(k)S.cur=k}
  names.forEach(n=>{S.profiles[n]=r.profs[n];src[n]={path:isMain?S.main:`.profiles/${fl.name}`}});
  if(!isMain&&names.length)S.active=names[0];
  render();toast(`Imported ${names.length} profile${names.length===1?'':'s'}`)};i.click()};

