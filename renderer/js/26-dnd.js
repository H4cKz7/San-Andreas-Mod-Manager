/* SA Mod Manager - 26-dnd.js: selection, drag & drop, cut / copy / paste of mods, folders and files */
/* Classic script: loaded in order by index.html, shares globals with the other files. */
/* ===== SAMM-DND (v1.2.6): selection, drag & drop and cut / copy / paste of mods, folders and files ===== */
var SEL=new Map(),SELA=null,CLIP=null,DRAG=null,DNDBUSY=false;
const selKey=(mod,rel)=>mod+'\u0001'+rel;
const isCut=(mod,rel)=>!!(CLIP&&CLIP.cut&&CLIP.items.some(i=>i.mod===mod&&i.rel===rel));
function selCls(mod,rel){return(SEL.has(selKey(mod,rel))?'sel ':'')+(isCut(mod,rel)?'cutm':'')}
const itAbs=it=>locAbs(it.mod,it.rel);
const within=(a,b)=>{a=a.toLowerCase();b=b.toLowerCase();return a===b||a.startsWith(b+pathN.sep.toLowerCase())};
const itName=it=>it.rel?it.rel.split('/').pop():it.mod;
const itemsLabel=a=>a.length===1?'“'+itName(a[0])+'”':a.length+' items';
function normItems(a){const o=a.map(i=>({mod:i.mod,rel:i.rel,dir:i.dir,abs:itAbs(i)}));
 return o.filter((x,i)=>!o.some((y,j)=>j!==i&&within(x.abs,y.abs)&&(x.abs.toLowerCase()!==y.abs.toLowerCase()||j<i)))}
function modEl(name){return[...document.querySelectorAll('#list .mod')].find(el=>{const m=S.mods[+el.dataset.i];return m&&m.name===name})||null}
function rowEl(it){if(it.mod.startsWith('::'))return rvRowEl(it);const me=modEl(it.mod);if(!me)return null;if(!it.rel)return me;return[...me.querySelectorAll('.tr[data-rel]')].find(t=>t.dataset.rel===it.rel)||null}
function rowItem(el){{const rr=el.closest&&el.closest('#rootlist [data-it]');if(rr)return{mod:rr.dataset.mod,rel:rr.dataset.rel,dir:rr.dataset.dir==='1'}}const me=el.closest&&el.closest('.mod');if(!me)return null;const m=S.mods[+me.dataset.i];if(!m)return null;
 const tr=el.closest('.tr');if(!tr||tr.classList.contains('root'))return{mod:m.name,rel:'',dir:true};
 if(tr.dataset.rel==null)return null;return{mod:m.name,rel:tr.dataset.rel,dir:tr.classList.contains('dir')}}
function selPaint(){if(typeof rvPaint==='function')rvPaint();document.querySelectorAll('#list .mod').forEach(el=>{const m=S.mods[+el.dataset.i];if(!m)return;
 el.classList.toggle('sel',SEL.has(selKey(m.name,'')));el.classList.toggle('cutm',isCut(m.name,''));
 el.querySelectorAll('.tr[data-rel]:not(.root)').forEach(t=>{t.classList.toggle('sel',SEL.has(selKey(m.name,t.dataset.rel)));t.classList.toggle('cutm',isCut(m.name,t.dataset.rel))})})}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const reduceMo=()=>matchMedia('(prefers-reduced-motion:reduce)').matches;
const SECT=document.querySelector('main>section');

/* --- selection: click, Ctrl+click, Shift+click --- */
$('#list').addEventListener('click',e=>{
 if(e.target.closest('button,input,label,output,.fh,.tag.mi,.mi-c'))return;
 const it=rowItem(e.target);if(!it)return;const k=selKey(it.mod,it.rel);
 if(e.ctrlKey||e.metaKey){e.stopPropagation();e.preventDefault();SEL.has(k)?SEL.delete(k):SEL.set(k,it);SELA=it;selPaint();return}
 if(e.shiftKey&&SELA){const rows=[...document.querySelectorAll('#list .mod, #list .tr:not(.root)')].filter(x=>x.offsetParent!==null),
   a=rows.indexOf(rowEl(SELA)),b=rows.indexOf(e.target.closest('.tr:not(.root)')||e.target.closest('.mod'));
  if(a>=0&&b>=0){e.stopPropagation();e.preventDefault();SEL.clear();rows.slice(Math.min(a,b),Math.max(a,b)+1).forEach(r=>{const x=rowItem(r);if(x)SEL.set(selKey(x.mod,x.rel),x)});selPaint();return}}
 SEL.clear();SEL.set(k,it);SELA=it;selPaint()},true);
/* SAMM-SELECT-CLEAR: clicking an empty place (side panel, margins, gaps, header, title bar) clears the mod selection */
document.addEventListener('click',e=>{
 if(!SEL.size||e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
 const t=e.target;
 /* the click already removed or re-rendered what was clicked: we can't tell where it was, so leave the selection alone */
 if(!t||!t.closest||!t.isConnected)return;
 /* clicks on mods, controls, menus, dialogs and toasts keep the selection (the Game folder dialog has its own) */
 if(t.closest('.mod,dialog,.ddm,.dd,.cdd,.cpop,.toast,#tipbox,.dtip,button,input,select,textarea,label,a,summary,output,[role=button],[role=menuitem],[contenteditable]'))return;
 /* finishing a text selection (e.g. in the .ini preview) is not an "empty click" */
 try{const s=window.getSelection();if(s&&!s.isCollapsed&&String(s).trim())return}catch(x){}
 SEL.clear();SELA=null;selPaint()});

/* --- Ctrl+C / Ctrl+X / Ctrl+V, Esc --- */
function clipSet(cut){const items=normItems([...SEL.values()]);if(!items.length)return;CLIP={items,cut};selPaint();
 toast((cut?'Cut ':'Copied ')+itemsLabel(items)+(cut?'. Select a folder and press Ctrl+V':''))}
function pasteTarget(){const a=SELA&&SEL.has(selKey(SELA.mod,SELA.rel))?SELA:[...SEL.values()].pop();
 if(!a)return{mod:'',rel:''};let rel=a.rel;if(!a.dir)rel=rel.includes('/')?rel.slice(0,rel.lastIndexOf('/')):'';return{mod:a.mod,rel}}
async function pasteClip(){if(!CLIP||(!root&&!gameOpenDir()))return;const items=CLIP.items,cut=CLIP.cut,ok=await transfer(items,pasteTarget(),!cut);
 if(ok&&cut)CLIP=null;selPaint()}
document.addEventListener('keydown',e=>{
 if(document.querySelector('dialog[open]:not(#rootd)'))return;
 const t=e.target;if(t&&(t.isContentEditable||t.tagName==='TEXTAREA'||t.tagName==='SELECT'||(t.tagName==='INPUT'&&!/^(checkbox|range|radio)$/.test(t.type))))return;
 if(e.key==='Escape'){if(SEL.size||CLIP){SEL.clear();SELA=null;CLIP=null;selPaint()}return}
 if(!(e.ctrlKey||e.metaKey)||e.altKey||e.shiftKey)return;const k=e.key.toLowerCase();
 if((k==='c'||k==='x')&&SEL.size){e.preventDefault();clipSet(k==='x')}
 else if(k==='v'&&CLIP){e.preventDefault();pasteClip()}});

/* --- the transfer itself: move or copy items into a mod / folder (tgt.mod '' = the modloader folder) --- */
async function leave(items){if(reduceMo())return;let any=false;
 items.forEach(it=>{const el=rowEl(it);if(!el)return;any=true;
  if(el.classList.contains('mod')){el.style.maxHeight=el.offsetHeight+'px';void el.offsetHeight}
  else{const k=el.nextElementSibling;if(el.classList.contains('dir')&&k&&k.classList.contains('kids'))k.classList.remove('open')}
  el.classList.add('leaving')});
 if(any)await sleep(300)}
function landed(list){requestAnimationFrame(()=>{let first=true;list.forEach(it=>{const el=rowEl(it);if(!el)return;
 el.classList.remove('landed');void el.offsetWidth;el.classList.add('landed');el.addEventListener('animationend',()=>el.classList.remove('landed'),{once:true});
 if(first){first=false;try{el.scrollIntoView({block:'nearest',behavior:reduceMo()?'auto':'smooth'})}catch(x){}}})})}
async function transfer(items,tgt,copy){
 if(DNDBUSY)return false;DNDBUSY=true;
 try{
  const base=root?root._path:'',dstDir=locAbs(tgt.mod,tgt.rel),tName=tgt.rel?tgt.rel.split('/').pop():(tgt.mod?(tgt.mod.replace(/^::/,'')||'game root'):'modloader');
  if(!fsN.existsSync(dstDir)){toast('That destination no longer exists');return false}
  const jobs=[];let noop=0,bad=0,gone=0;
  for(const it of normItems(items)){const src=it.abs,name=pathN.basename(src);
   if(!fsN.existsSync(src)){gone++;continue}
   if(!rvAllowed(it,tgt)){bad++;continue}if(!tgt.mod&&!it.dir){bad++;continue}
   if(within(dstDir,src)){bad++;continue}
   if(!copy&&pathN.dirname(src).toLowerCase()===dstDir.toLowerCase()){noop++;continue}
   const dst=pathN.join(dstDir,name);if(dst.toLowerCase()!==src.toLowerCase()&&within(src,dst)){bad++;continue}
   jobs.push({it,src,dst,name,isDir:it.dir})}
  if(!jobs.length){toast(bad?'Those items can’t go there: a folder can’t be put inside itself, files can’t go straight into modloader, and mod folders can’t go into cleo or scripts':gone?'The copied items no longer exist':noop?'Already in that folder':'Nothing to do');return false}
  let mode='replace';
  const cf=jobs.filter(j=>fsN.existsSync(j.dst)&&j.dst.toLowerCase()!==j.src.toLowerCase());
  if(cf.length){const ch=await ask({title:cf.length===1?'“'+cf[0].name+'” already exists':cf.length+' items already exist',text:'Replace them with the ones you are '+(copy?'copying':'moving')+' into “'+tName+'”? The existing ones go to the Trash, not away for good. Or keep both.',ok:'Replace',alt:'Keep both'});
   if(!ch)return false;mode=ch==='alt'?'both':'replace'}
  if(!copy)await leave(jobs.map(j=>j.it));
  const used=new Set(),touched=new Set(),out=[];let failed=0,err='';
  const topOf=p=>{const l=locOf(p);return l?l.mod:''};
  const uniq=(dst,isDir)=>{const dir=pathN.dirname(dst),ext=isDir?'':pathN.extname(dst),b=pathN.basename(dst,ext);let k=1,c;
   do{c=pathN.join(dir,b+' (copy'+(k>1?' '+k:'')+')'+ext);k++}while(fsN.existsSync(c)||used.has(c.toLowerCase()));return c};
  for(const j of jobs){try{
   let dst=j.dst;const same=dst.toLowerCase()===j.src.toLowerCase();
   if(used.has(dst.toLowerCase())||(fsN.existsSync(dst)&&(mode==='both'||same)))dst=uniq(dst,j.isDir);
   else if(fsN.existsSync(dst)){const lc=locOf(dst),isD=fsN.statSync(dst).isDirectory();
    await trashPut(lc.mod,lc.rel,isD,isD?listFiles(dst).length:1)}
   used.add(dst.toLowerCase());
   if(copy)await fsN.promises.cp(j.src,dst,{recursive:true});else await TR.move(j.src,dst);
   touched.add(topOf(j.src));touched.add(topOf(dst));out.push({...j,final:dst});
   if(!copy&&!j.it.mod.startsWith('::')){const mr=pathN.join(base,topOf(j.src));let d=pathN.dirname(j.src); /* empty folders are invisible in the list, so tidy them up */
    while(d.toLowerCase()!==mr.toLowerCase()&&within(d,mr)){try{fsN.rmdirSync(d)}catch(x){break}d=pathN.dirname(d)}}
  }catch(x){failed++;err=x.message}}
  document.querySelectorAll('#list .leaving').forEach(el=>{el.classList.remove('leaving');el.style.maxHeight=''});
  touched.forEach(nm=>{if(nm&&!nm.startsWith('.')&&!nm.startsWith('::'))refreshMod(nm)});
  if(typeof miMoved==='function')out.forEach(o=>{if(!o.isDir||!o.it.mod||o.it.mod.startsWith('::'))return;const lc=locOf(o.final);if(lc&&lc.mod&&!lc.mod.startsWith('::'))miMoved(o.it.mod+(o.it.rel?'/'+o.it.rel:''),lc.mod+(lc.rel?'/'+lc.rel:''),copy)}); /* SAMM-NESTED-INFO: mod info follows moved / copied folders */
  const res=[];
  out.forEach(o=>{const lc=locOf(o.final),mn=lc.mod,rel=lc.rel,parts=[mn,...(rel?rel.split('/'):[])],m=S.mods.find(x=>x.name===mn);
   if(m){m._o=true;m._x=m._x||{};parts.slice(1,-1).reduce((a,x)=>{const c=a?a+'/'+x:x;m._x[c]=true;return c},'')}
   res.push({mod:mn,rel,dir:o.isDir})});
  SEL.clear();res.forEach(r=>{if(r.rel||S.mods.some(m=>m.name===r.mod))SEL.set(selKey(r.mod,r.rel),r)});SELA=res.length?res[res.length-1]:null;
  render();runChecks();landed(res);if(typeof rvAfter==='function')rvAfter(res);
  if(out.length)toast((copy?'Copied ':'Moved ')+itemsLabel(out.map(o=>o.it))+' to “'+tName+'”'+(failed?', '+failed+' failed':''));
  if(failed&&!out.length)notice('Couldn’t '+(copy?'copy':'move')+' the items',err);
  return out.length>0}
 catch(e){notice('Something went wrong',e.message);return false}
 finally{DNDBUSY=false}}

/* --- dragging --- */
let _tip=null;
/* SAMM-PATCH-DND-CONFLICTS-ASI: the drag tooltip only touches the DOM when its text changes and is moved with transform inside one requestAnimationFrame (the old code forced a layout on every dragover) */
const tip=(txt,x,y)=>{if(!_tip){_tip=document.createElement('div');_tip.className='dtip';_tip._t=null;_tip._w=0;_tip._x=0;_tip._y=0;_tip._r=0;_tip.style.transform='translate(-999px,-999px)';document.body.appendChild(_tip)}
 if(txt==null){_tip._t=null;if(!_tip.hidden)_tip.hidden=true;return}
 if(_tip.hidden)_tip.hidden=false;
 if(_tip._t!==txt){_tip._t=txt;_tip.textContent=txt;_tip._w=_tip.offsetWidth}
 _tip._x=x;_tip._y=y;
 if(!_tip._r)_tip._r=requestAnimationFrame(()=>{_tip._r=0;if(_tip.hidden)return;_tip.style.transform='translate('+Math.max(6,Math.min(innerWidth-_tip._w-8,_tip._x+16))+'px,'+Math.min(innerHeight-34,_tip._y+18)+'px)'})};
function setHl(el,cls){const D=DRAG;if(!D)return;if(D.hl===el&&D.hc===cls)return;
 if(D.hl)D.hl.classList.remove('dropok','dropbad','dropzone');D.hl=el;D.hc=cls;if(el&&cls)el.classList.add(cls)}
function endDrag(){if(DRAG){clearTimeout(DRAG.tm);setHl(null,'')}DRAG=null;tip(null);document.querySelectorAll('.dghost').forEach(x=>x.remove())}
function dropTarget(e){{const rt=typeof rvDrop==='function'?rvDrop(e):undefined;if(rt!==undefined)return rt}const me=e.target.closest&&e.target.closest('#list .mod');if(!me)return{mod:'',rel:'',el:$('#list'),zone:true,name:'modloader'};
 const m=S.mods[+me.dataset.i];if(!m)return null;const tr=e.target.closest('#list .tr');
 if(tr&&tr.dataset.rel!=null&&!tr.classList.contains('root')){
  if(tr.classList.contains('dir'))return{mod:m.name,rel:tr.dataset.rel,el:tr,m,name:tr.dataset.rel.split('/').pop()};
  const r=tr.dataset.rel,pr=r.includes('/')?r.slice(0,r.lastIndexOf('/')):'',pe=pr?[...me.querySelectorAll('.tr.dir[data-rel]')].find(x=>x.dataset.rel===pr):me;
  return{mod:m.name,rel:pr,el:pe||me,m,name:pr?pr.split('/').pop():m.name}}
 return{mod:m.name,rel:'',el:me,m,name:m.name}}
function canDrop(items,tgt,copy){const dd=locAbs(tgt.mod,tgt.rel);
 return items.some(it=>{const src=itAbs(it);if(!rvAllowed(it,tgt))return false;if(!tgt.mod&&!it.dir)return false;if(within(dd,src))return false;
  if(!copy&&pathN.dirname(src).toLowerCase()===dd.toLowerCase())return false;return true})}
const dndStart=e=>{const el=e.target.closest&&e.target.closest('[draggable="true"]');if(!el||DNDBUSY){return}
 const it=rowItem(el);if(!it)return;const k=selKey(it.mod,it.rel);
 if(!SEL.has(k)){SEL.clear();SEL.set(k,it);SELA=it;selPaint()}
 const items=normItems([...SEL.values()]);DRAG={items,hl:null,hc:'',tk:null,tm:0,hb:document.querySelector('header').getBoundingClientRect().bottom,ce:null,cc:false,ct:null,ok:false,sp:0,st:0,raf:0};
 e.dataTransfer.effectAllowed='copyMove';e.dataTransfer.setData('application/x-samm-items',JSON.stringify(items.map(i=>[i.mod,i.rel])));
 const g=document.createElement('div');g.className='dghost';g.textContent=itemsLabel(items);document.body.appendChild(g);try{e.dataTransfer.setDragImage(g,14,14)}catch(x){}
 setTimeout(()=>g.remove(),0)};
$('#list').addEventListener('dragstart',dndStart);$('#rootlist').addEventListener('dragstart',dndStart);
/* SAMM-PATCH-DND-CONFLICTS-ASI: edge auto-scroll runs on requestAnimationFrame instead of scrolling on every dragover event */
function dndScroll(){const D=DRAG;if(!D||D.raf)return;
 const step=()=>{const D=DRAG;if(!D||!D.sp||performance.now()-D.st>600){if(D)D.raf=0;return}
  window.scrollBy(0,D.sp);D.raf=requestAnimationFrame(step)};
 D.raf=requestAnimationFrame(step)}
/* dragover fires many times a second: when the pointer is still over the same element (and Ctrl is unchanged) the drop target and canDrop() result are reused */
document.addEventListener('dragover',e=>{const D=DRAG;if(!D)return;const T=e.target;if(!T||!T.closest||!T.closest('main>section,#rootd'))return;
 const inRoot=!!T.closest('#rootd');
 if(inRoot)D.sp=0;else{D.sp=e.clientY<D.hb+46?-6:e.clientY>innerHeight-56?6:0;D.st=performance.now();if(D.sp)dndScroll()}
 const copy=e.ctrlKey||e.metaKey;let tg,ok;
 if(!inRoot&&D.ce===T&&D.cc===copy){tg=D.ct;ok=D.ok}
 else{tg=dropTarget(e);ok=!!(tg&&canDrop(D.items,tg,copy));if(!inRoot){D.ce=T;D.cc=copy;D.ct=tg;D.ok=ok}}
 if(ok){e.preventDefault();e.dataTransfer.dropEffect=copy?'copy':'move';
  setHl(tg.el,tg.zone?'dropzone':'dropok');tip((copy?'Copy ':'Move ')+itemsLabel(D.items)+' to “'+tg.name+'”',e.clientX,e.clientY);
  const key=tg.mod+'\u0001'+tg.rel;
  if(D.tk!==key){D.tk=key;clearTimeout(D.tm);
   if(tg.rv)D.tm=setTimeout(()=>{if(DRAG&&DRAG.tk===key)rvHoverOpen(tg)},650);else if(tg.m)D.tm=setTimeout(()=>{if(!DRAG||DRAG.tk!==key)return; /* hovering a closed folder opens it, like a file manager */
    if(!tg.rel){if(!tg.m._o)toggleMod(tg.el,tg.m)}else if(!tg.el.classList.contains('open'))foldDir(tg.m,tg.el)},650)}}
 else{clearTimeout(D.tm);D.tk=null;setHl(tg&&!tg.zone?tg.el:null,'dropbad');tip(null)}});
document.addEventListener('dragleave',e=>{if(DRAG&&!(e.relatedTarget&&e.relatedTarget.closest&&e.relatedTarget.closest('main>section,#rootd'))){clearTimeout(DRAG.tm);DRAG.tk=null;setHl(null,'');tip(null)}});
document.addEventListener('drop',async e=>{if(!DRAG||!e.target.closest||!e.target.closest('main>section,#rootd'))return;e.preventDefault();
 const tg=dropTarget(e),copy=e.ctrlKey||e.metaKey,items=DRAG.items;endDrag();
 if(tg&&canDrop(items,tg,copy))await transfer(items,tg,copy)});
document.addEventListener('dragend',endDrag);
document.addEventListener('drop',()=>{if(DRAG)endDrag()});

var MLWATCH=false;
window.addEventListener('focus',()=>{if(root||!game||MLWATCH||document.querySelector('dialog[open]:not(#rootd)'))return;MLWATCH=true;
 (async()=>{try{if(await findML(game)){await setRoot(game,{silent:true});toast('Mod Loader found: scanned the modloader folder')}}catch(e){}finally{MLWATCH=false}})()});
$('#chkml').onclick=async()=>{if(!game)return;const c=await mlMissing(game);if(c)openBaseInstaller(game,c)};
