/* SA Mod Manager - 33-folder-tools.js: Rescan chevron menu (open game folder) and the Root cleo / scripts dialog */
/* Classic script: loaded in order by index.html, shares globals with the other files. */
/* ---- game folder of the active installation ---- */
function gameOpenDir(){let d='';try{d=gameDir()||''}catch(e){}
 if(!d)d=(game&&game._path)||(root&&root._path?pathN.dirname(root._path):'');
 return d}
/* Opens the folder in a plain Explorer window. explorer.exe /n, does not make the navigation pane jump open and expand the whole
   tree the way shell.openPath does. Other systems use shell.openPath. Returns '' or an error text. */
function openFolderPlain(d){
 if(process.platform==='win32'){
  try{const c=require('child_process').spawn('explorer.exe',['/n,"'+d+'"'],{detached:true,stdio:'ignore',windowsVerbatimArguments:true});c.on('error',()=>{});c.unref();return Promise.resolve('')}
  catch(e){}}
 return nOpenPath(d)}
/* ---- Rescan chevron menu ---- */
const rsMenu=o=>{$('#rescanm').hidden=!o;$('#rescanmore').setAttribute('aria-expanded',String(o))};
$('#rescanmore').onclick=()=>rsMenu($('#rescanm').hidden);
document.addEventListener('click',e=>{if(!e.target.closest('#rescand'))rsMenu(false)});
document.addEventListener('keydown',e=>{if(e.key==='Escape')rsMenu(false)});
$('#rescanm').onclick=async e=>{const it=e.target.closest('[data-r]');if(!it)return;rsMenu(false);
 if(it.dataset.r==='open'){const d=gameOpenDir();
  if(!d||!fsN.existsSync(d))return toast('The game folder was not found');
  const r=await openFolderPlain(d);
  if(r)notice('Couldn’t open the folder',r)}};
/* ---- Root cleo / scripts: a docked panel with a real folder tree of game/cleo and game/scripts (Mod Loader's own folders are skipped).
   Its items use the same {mod, rel, dir} shape as the mod list. Their "mod" is '::' + the top folder name ('::cleo'), which no real
   mod folder can be called (a colon is not allowed in Windows file names). locAbs() / locOf() in 23-trash.js translate it to a path. ---- */
const RV={files:[],dirs:[],asi:[],other:[],scope:(()=>{try{return localStorage.getItem('samm-rvscope')==='cs'?'cs':'all'}catch(e){return'all'}})(),q:'',f:'all',open:{'@root':true},busy:false,gd:'',t:0,none:false};
async function rvScan(keep){const gd=gameOpenDir();if(!gd)return;
 const t=++RV.t;RV.busy=true;RV.gd=gd;if(!keep){RV.files=[];RV.dirs=[];RV.asi=[]}rvDraw();
 const files=[],dirs=[];let n=0;
 const walk=async(dir,depth)=>{let ents;try{ents=await fsN.promises.readdir(dir,{withFileTypes:true})}catch(e){return}
  for(const e of ents){const p=pathN.join(dir,e.name),rel=pathN.relative(gd,p).replace(/\\/g,'/'),ps=rel.split('/');
   if(e.isDirectory()){if(depth<12&&e.name.toLowerCase()!=='modloader'){dirs.push({rel,top:ps[0].toLowerCase(),mod:'::'+ps[0],sub:ps.slice(1).join('/'),name:e.name,parent:ps.slice(0,-1).join('/'),abs:p});await walk(p,depth+1)}}
   else{let sz=0;try{sz=(await fsN.promises.stat(p)).size}catch(x){}
    files.push({abs:p,rel,size:sz,ext:e.name.indexOf('.')>=0?e.name.split('.').pop().toLowerCase():'',top:ps[0].toLowerCase(),mod:'::'+ps[0],sub:ps.slice(1).join('/'),name:e.name,dirRel:ps.slice(0,-1).join('/')})}
   if(++n%250===0)await new Promise(r=>setTimeout(r))}};
 let tops=[];try{tops=fsN.readdirSync(gd,{withFileTypes:true}).filter(e=>e.isDirectory()&&(RV.scope==='all'||/^(cleo|scripts)$/i.test(e.name))).map(e=>e.name).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}))}catch(e){}
 for(const tp of tops){const ro=/^modloader$/i.test(tp);dirs.push({rel:tp,top:tp.toLowerCase(),mod:'::'+tp,sub:'',name:tp,parent:'',abs:pathN.join(gd,tp),ro});if(!ro)await walk(pathN.join(gd,tp),1)}
 if(t!==RV.t)return;
 files.sort((a,b)=>a.rel.localeCompare(b.rel,undefined,{numeric:true}));
 let asi=[];
 try{asi=fsN.readdirSync(gd,{withFileTypes:true}).filter(e=>e.isFile()&&/\.asi$/i.test(e.name)).map(e=>{const p=pathN.join(gd,e.name);let sz=0;try{sz=fsN.statSync(p).size}catch(x){}return{abs:p,name:e.name,size:sz}}).sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true}))}catch(e){}
 let other=[];
 if(RV.scope==='all')try{other=fsN.readdirSync(gd,{withFileTypes:true}).filter(e=>e.isFile()&&!/\.asi$/i.test(e.name)).map(e=>{const p=pathN.join(gd,e.name);let sz=0;try{sz=fsN.statSync(p).size}catch(x){}return{abs:p,name:e.name,size:sz,ext:e.name.indexOf('.')>=0?e.name.split('.').pop().toLowerCase():''}}).sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true}))}catch(e){}
 RV.none=!tops.length&&!asi.length&&!other.length;RV.asi=asi;RV.other=other;RV.files=files;RV.dirs=dirs;RV.busy=false;rvDraw()}
function rvDraw(){const box=$('#rootlist');if(!box)return;
 const q=RV.q.trim().toLowerCase(),F=RV.f,all=RV.files,asi=RV.asi||[],oth=RV.scope==='all'?(RV.other||[]):[];
 const nc=all.filter(f=>f.top==='cleo').length,ns=all.filter(f=>f.top==='scripts').length,tot=all.length+asi.length+oth.length;
 $('#rootinfo').textContent=RV.busy?'Scanning…':tot+' file'+(tot===1?'':'s')+(RV.scope==='all'?' · '+RV.dirs.length+' folder'+(RV.dirs.length===1?'':'s'):' · asi '+asi.length+' · cleo '+nc+' · scripts '+ns);
 if(RV.busy&&!RV.dirs.length&&!asi.length&&!oth.length){box.innerHTML='<div class="stats" style="padding:10px">Scanning…</div>';return}
 if(RV.none){box.innerHTML='<div class="stats" style="padding:10px">'+(RV.scope==='all'?'The game folder is empty.':'There is no cleo or scripts folder, and no .asi plugin, in the game folder.')+'</div>';return}
 const TRB='<button class="btn sm del eb ib" data-del title="Move to Trash" aria-label="Move to Trash">'+TI+'</button>';
 const nodes=new Map();
 RV.dirs.filter(d=>F==='all'||d.top===F).forEach(d=>nodes.set(d.rel,Object.assign({},d,{dirs:[],files:[],n:0})));
 all.filter(f=>(F==='all'||f.top===F)&&(!q||f.rel.toLowerCase().includes(q))).forEach(f=>{const nd=nodes.get(f.dirRel);if(nd)nd.files.push(f)});
 const tops=[];
 [...nodes.values()].sort((a,b)=>a.rel.localeCompare(b.rel,undefined,{numeric:true})).forEach(nd=>{
  if(nd.parent){const p=nodes.get(nd.parent);if(p)p.dirs.push(nd)}else tops.push(nd)});
 const cnt=nd=>{nd.n=nd.files.length+nd.dirs.reduce((s,d)=>s+cnt(d),0);return nd.n};tops.forEach(cnt);
 let rows=0,capped=false;
 const attrs=(mod,sub,dir,abs)=>' data-it data-mod="'+esc(mod)+'" data-rel="'+esc(sub)+'" data-dir="'+dir+'" data-abs="'+esc(abs)+'"';
 const html=nd=>{if(q&&!nd.n)return'';
  const open=!!q||RV.open[nd.rel]===true;
  let h='<div class="rvd'+(open?' open':'')+'" data-d="'+esc(nd.rel)+'"><div class="edg"'+attrs(nd.mod,nd.sub,1,nd.abs)+' data-d="'+esc(nd.rel)+'"'+(nd.sub?' draggable="true"':'')+'>'+CV+FO+'<span class="nm" title="'+esc(nd.rel)+'">'+esc(nd.name)+'</span><small'+(nd.ro?' title="Mod Loader’s mods are managed in the mod list">mod list':'>'+nd.n)+'</small>'+(nd.sub?'<button class="btn sm eb" data-show>Show</button>'+TRB:(RV.scope==='all'?'<button class="btn sm eb" data-show>Show</button>':''))+'</div><div class="rvk">';
  nd.dirs.forEach(d=>{h+=html(d)});
  nd.files.forEach(f=>{if(rows>=5000){capped=true;return}rows++;const cfg=/^(ini|json|jsonc)$/.test(f.ext);
   h+='<div class="edr"'+attrs(f.mod,f.sub,0,f.abs)+' draggable="true" title="'+esc(f.rel)+'"><span class="ext '+esc(f.ext)+'">'+esc(f.ext||'file')+'</span><span class="nm">'+esc(f.name)+'</span>'+(cfg?'<button class="btn sm eb" data-edit>Edit</button>':'')+'<button class="btn sm eb" data-show>Show</button>'+TRB+'<small>'+fmtSize(f.size)+'</small></div>'});
  return h+'</div></div>'};
 /* .asi plugins in the game root: view only (no drag / trash), they are not cleo or scripts items */
 const asiShow=(F==='all'||F==='root')?asi.filter(a=>!q||a.name.toLowerCase().includes(q)):[];
 const asiRow=a=>'<div class="edr rva"'+attrs('::',a.name,0,a.abs)+' draggable="true" title="'+esc(a.name)+'"><span class="ext asi">asi</span><span class="nm">'+esc(a.name)+'</span><button class="btn sm eb" data-show>Show</button>'+TRB+'<small>'+fmtSize(a.size)+'</small></div>';
 /* other files in the game root (gta_sa.exe, .dll, .txt ...): view only. They have no data-it, so they can't be selected, dragged or trashed */
 const othShow=(F==='all'||F==='root')?oth.filter(a=>!q||a.name.toLowerCase().includes(q)):[];
 const othRow=a=>'<div class="edr rvo" data-abs="'+esc(a.abs)+'" title="'+esc(a.name)+'"><span class="ext '+esc(a.ext)+'">'+esc(a.ext||'file')+'</span><span class="nm">'+esc(a.name)+'</span>'+(/^(ini|json|jsonc)$/.test(a.ext)?'<button class="btn sm eb" data-edit>Edit</button>':'')+'<button class="btn sm eb" data-show>Show</button><small>'+fmtSize(a.size)+'</small></div>';
 const kids=tops.map(html).join('')+[...asiShow.map(a=>[a.name,asiRow(a)]),...othShow.map(a=>[a.name,othRow(a)])].sort((x,y)=>x[0].localeCompare(y[0],undefined,{numeric:true})).map(x=>x[1]).join('');
 const rootN=tops.reduce((s,d)=>s+d.n,0)+asiShow.length+othShow.length;
 const rootOpen=!!q||RV.open['@root']!==false;
 let h='';
 if(kids)h='<div class="rvd rvtop'+(rootOpen?' open':'')+'" data-d="@root"><div class="edg rvroot" data-abs="'+esc(RV.gd)+'" data-d="@root">'+CV+FO+'<span class="nm" title="'+esc(RV.gd)+'">Game root</span><small>'+rootN+'</small><button class="btn sm eb" data-show>Show</button></div><div class="rvk">'+kids+'</div></div>';
 else h='<div class="stats" style="padding:10px">'+((all.length||asi.length||oth.length)?'No files match this search or filter.':(RV.scope==='all'?'The game folder is empty.':'Nothing is installed in the root cleo or scripts folders.'))+'</div>';
 if(capped)h+='<div class="stats" style="padding:10px">Showing the first 5000 files. Use the search to narrow the list.</div>';
 box.innerHTML=h;rvPaint()}
/* ---- plumbing for 26-dnd.js (selection, drag & drop, clipboard) ---- */
function rvPaint(){const b=$('#rootlist');if(!b)return;
 b.querySelectorAll('[data-it]').forEach(el=>{const m=el.dataset.mod,r=el.dataset.rel;el.classList.toggle('sel',SEL.has(selKey(m,r)));el.classList.toggle('cutm',isCut(m,r))})}
function rvRowEl(it){const b=$('#rootlist');if(!b)return null;return[...b.querySelectorAll('[data-it]')].find(el=>el.dataset.mod===it.mod&&el.dataset.rel===it.rel)||null}
/* what may go where: cleo / scripts themselves never move, nothing from there becomes a mod, and whole mod folders do not go into cleo / scripts */
function rvAllowed(it,tgt){const itRoot=it.mod.startsWith('::'),tRoot=!!tgt.mod&&tgt.mod.startsWith('::');
 if(/^::modloader$/i.test(it.mod)||/^::modloader$/i.test(tgt.mod||''))return false;
 if(tgt.mod==='::'&&!tgt.rel)return!it.dir&&/\.asi$/i.test(it.rel||'');
 if(itRoot&&!it.rel)return false;
 if(!tgt.mod&&itRoot)return false;
 if(tRoot&&!itRoot&&it.dir&&!it.rel)return false;
 return true}
const rvRootT=h=>({mod:'::',rel:'',el:h,rv:true,key:'@root',name:'Game root'});
/* drop target under the pointer, or undefined when the pointer is not over the panel */
function rvDrop(e){const d=$('#rootd');if(!d||!d.open||!e.target.closest||!e.target.closest('#rootd'))return undefined;
 const row=e.target.closest('#rootlist [data-it]');if(!row){const rg=e.target.closest('#rootlist .rvroot');return rg?rvRootT(rg):null}
 const h=row.classList.contains('edg')?row:(row.closest('.rvd')&&row.closest('.rvd').firstElementChild);
 if(h&&h.classList.contains('rvroot'))return rvRootT(h);if(!h||h.dataset.mod==null)return null;
 return{mod:h.dataset.mod,rel:h.dataset.rel,el:h,rv:true,key:h.dataset.d,name:h.dataset.rel?h.dataset.rel.split('/').pop():h.dataset.mod.slice(2)}}
function rvHoverOpen(tg){if(!tg.el||!tg.el.parentElement)return;const d=tg.el.parentElement;if(!d.classList.contains('rvd')||d.classList.contains('open'))return;d.classList.add('open');RV.open[tg.key]=true}
/* after a transfer: open the folders the items landed in and refresh the tree */
function rvAfter(res){const d=$('#rootd');if(!d||!d.open)return;
 const mine=(res||[]).filter(r=>r.mod.startsWith('::'));if(mine.length)RV.open['@root']=true;
 mine.forEach(r=>{let p=r.mod.slice(2);RV.open[p]=true;(r.rel?r.rel.split('/').slice(0,-1):[]).forEach(x=>{p+='/'+x;RV.open[p]=true})});
 rvScan(true).then(()=>{rvPaint();if(mine.length)landed(mine)})}
/* ---- Trash for root items ---- */
async function rvDelete(items){const its=normItems(items).filter(i=>i.mod.startsWith('::')&&i.rel);if(!its.length)return;
 if(!await ask({title:'Move '+itemsLabel(its)+' to the Trash?',text:(its.some(i=>i.mod==='::'&&/^modloader\.asi$/i.test(i.rel))?'This includes Mod Loader itself, and without it no mods load. ':'')+'They are moved out of the game folder. You can restore them from the Trash.',ok:'Move to Trash',danger:true}))return;
 const done=[];
 try{for(const it of its){const n=it.dir?listFiles(it.abs).length:1;done.push(await trashPut(it.mod,it.rel,it.dir,n))}}
 catch(e){notice('Couldn’t move it to the Trash',e.message)}
 SEL.clear();SELA=null;selPaint();renderTrash();rvScan(true);runChecks();
 if(done.length)toast('Moved to the Trash',()=>{(async()=>{for(const d of done.slice().reverse())await trashRestore(d.id)})()})}
/* ---- the panel itself ---- */
$('#rootb').onclick=()=>{const d=$('#rootd');if(d.open){d.close();return}
 if(!gameOpenDir())return toast('Scan a GTA folder first');
 RV.open={'@root':true};RV.files=[];RV.dirs=[];RV.asi=[];d.show();rvScan()};
$('#rootx').onclick=()=>$('#rootd').close();
$('#rootrescan').onclick=()=>rvScan(true);
$('#rootexp').onclick=()=>{RV.open={'@root':true};RV.dirs.forEach(d=>{RV.open[d.rel]=true});rvDraw()};
$('#rootcol').onclick=()=>{RV.open={'@root':true};rvDraw()};
$('#rootq').oninput=e=>{RV.q=e.target.value;rvDraw()};
$('#rootlist').addEventListener('click',e=>{
 const vo=e.target.closest('.rvo');
 if(vo){const b=e.target.closest('button');if(!b)return;
  if(b.hasAttribute('data-edit')){EM.set({abs:vo.dataset.abs,view:'form',sc:0,ls:0,f:'all',go:{}});$('#edbtn').click()}
  else if(b.hasAttribute('data-show'))nShow(vo.dataset.abs);
  return}
 const rg=e.target.closest('.rvroot');
 if(rg){if(e.target.closest('button')){openFolderPlain(RV.gd);return}
  if(RV.q.trim())return;const d=rg.parentElement,on=!d.classList.contains('open');d.classList.toggle('open',on);RV.open['@root']=on;return}
 const row=e.target.closest('[data-it]');if(!row)return;const btn=e.target.closest('button');
 const it=rowItem(row);if(!it)return;
 if(btn){const abs=row.dataset.abs;
  if(btn.hasAttribute('data-edit')){EM.set({abs,view:'form',sc:0,ls:0,f:'all',go:{}});$('#edbtn').click()}
  else if(btn.hasAttribute('data-show'))nShow(abs);
  else if(btn.hasAttribute('data-del')){const sel=[...SEL.values()].filter(x=>x.mod.startsWith('::')&&x.rel);rvDelete(SEL.has(selKey(it.mod,it.rel))&&sel.length>1?sel:[it])}
  return}
 const k=selKey(it.mod,it.rel);
 if(e.ctrlKey||e.metaKey){SEL.has(k)?SEL.delete(k):SEL.set(k,it);SELA=it;selPaint();return}
 if(e.shiftKey&&SELA){const rows=[...$('#rootlist').querySelectorAll('[data-it]')].filter(x=>x.offsetParent!==null),a=rows.indexOf(rvRowEl(SELA)),b=rows.indexOf(row);
  if(a>=0&&b>=0){SEL.clear();rows.slice(Math.min(a,b),Math.max(a,b)+1).forEach(r=>{const x=rowItem(r);if(x)SEL.set(selKey(x.mod,x.rel),x)});selPaint();return}}
 SEL.clear();SEL.set(k,it);SELA=it;
 if(row.classList.contains('edg')&&!RV.q.trim()){const d=row.parentElement,on=!d.classList.contains('open');d.classList.toggle('open',on);RV.open[row.dataset.d]=on}
 selPaint()});
/* scroll the panel while dragging near its top or bottom edge */
document.addEventListener('dragover',e=>{if(!DRAG)return;const l=$('#rootlist');if(!l||!$('#rootd').open)return;const r=l.getBoundingClientRect();
 if(e.clientX<r.left||e.clientX>r.right)return;if(e.clientY>r.top&&e.clientY<r.top+36)l.scrollTop-=14;else if(e.clientY<r.bottom&&e.clientY>r.bottom-36)l.scrollTop+=14});
/* Delete key moves the selected root items to the Trash */
document.addEventListener('keydown',e=>{if(e.key!=='Delete'||!$('#rootd').open||document.querySelector('dialog[open]:not(#rootd)'))return;
 const t=e.target;if(t&&(t.isContentEditable||t.tagName==='TEXTAREA'||t.tagName==='SELECT'||(t.tagName==='INPUT'&&!/^(checkbox|range|radio)$/.test(t.type))))return;
 const sel=[...SEL.values()].filter(x=>x.mod.startsWith('::')&&x.rel);if(!sel.length)return;e.preventDefault();rvDelete(sel)});
/* ---- game folder explorer: scope switch (everything / cleo & scripts only) and Open game folder ---- */
function rvScopeUi(){const all=RV.scope==='all';
 $('#roottitle').textContent=all?'Game folder':'Root cleo & scripts';
 $('#rootnote').textContent=all?'Everything in the game folder. These files load without Mod Loader, so profiles can’t switch them off. Mod Loader’s own folder is managed in the mod list and only shown here for reference.':'The game’s own folders. They load without Mod Loader, so profiles can’t switch them off.';
 $('#rootall').classList.toggle('on',all);$('#rootcs').classList.toggle('on',!all);
 $('#rootall').setAttribute('aria-pressed',String(all));$('#rootcs').setAttribute('aria-pressed',String(!all))}
function rvScope(s){if(RV.scope===s)return;RV.scope=s;try{localStorage.setItem('samm-rvscope',s)}catch(e){}
 RV.open={'@root':true};rvScopeUi();rvScan()}
$('#rootall').onclick=()=>rvScope('all');$('#rootcs').onclick=()=>rvScope('cs');
$('#rootopen').onclick=()=>{const d=gameOpenDir();
 if(!d||!fsN.existsSync(d))return toast('The game folder was not found');
 Promise.resolve(openFolderPlain(d)).then(r=>{if(r)notice('Couldn’t open the folder',r)})};
rvScopeUi();
