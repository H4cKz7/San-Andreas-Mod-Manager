/* SA Mod Manager - 49-multi-install.js: install several mods at once (install all automatically, or review each one) */
/* Classic script: loaded in order by index.html, shares globals with the other files. */
/* SAMM-MULTI-INSTALL. Several archives / folders (dropped on the window, dropped on the installer, or chosen with "Choose archives")
   become a queue. "Install all" runs every package through the same plan + copy code as a single install (runInstall in 21-installer.js)
   with the placement the installer detects. "Review each" loads them into the normal dialog one after another (Install & next / Skip). */
var QS={on:false,auto:false,stop:false,list:[],i:-1,res:[],used:new Set()};
const qName=p=>pathN.basename(p).replace(/\.[^.]+$/,'');
const qShort=s=>String(s==null?'':s).replace(/\s+/g,' ').trim().slice(0,160);
function qLabel(){return QS.on&&!QS.auto&&QS.i<QS.list.length-1?'Install & next':'Install'}
function qUi(on){dlg.classList.toggle('qauto',!!on&&QS.auto);dlg.classList.toggle('qrev',!!on&&!QS.auto);$('#qbar').hidden=!on;
 if(on){const s=$('#qskip');s.disabled=false;s.textContent=QS.auto?'Stop':'Skip this mod'}}
function qReset(){if(typeof qStageClear==='function')qStageClear();/* SAMM-MULTI-STACK */QS.on=false;QS.auto=false;QS.stop=false;QS.list=[];QS.i=-1;QS.res=[];QS.used=new Set();qUi(false)}
function qBar(i,label){const n=QS.list.length;$('#qtxt').textContent=(QS.auto?'Installing ':'Mod ')+(i+1)+' of '+n;$('#qsub').textContent=label||'';$('#qfill').style.width=Math.round(i/n*100)+'%'}
/* a mod name that is free: not used by an installed mod and not by one installed earlier in this batch */
function qUnique(n){n=String(n).replace(/[\\/:*?"<>|]/g,'').trim()||'New mod';
 const used=x=>QS.used.has(x.toLowerCase())||S.mods.some(m=>m.name.toLowerCase()===x.toLowerCase());
 if(!used(n))return n;let i=2;while(used(n+' ('+i+')'))i++;return n+' ('+i+')'}
/* dropped files -> the archives and folders among them, in drop order */
function qPicks(fl){const out=[];
 fl.forEach(f=>{const p=pathOf(f);if(!p)return;let d=false;try{d=fsN.statSync(p).isDirectory()}catch(e){}
  if(d)out.push({p,kind:'dir'});else if(ARCH_RE.test(f.name))out.push({p,kind:'arc'})});
 return out}
/* "Choose archives": several at once. Falls back to the old single picker when the main process has no multi picker */
async function qPick(){
 try{const r=await require('electron').ipcRenderer.invoke('pick-archives');if(Array.isArray(r))return r;if(r===null)return null}catch(e){}
 const p=await window.__native.pickArchive();return p?[p]:null}
/* one package: the old behaviour. Several: the queue */
function qGo(list){
 if(!list.length)return;
 if(typeof qStaging==='function'&&qStaging(list))return; /* SAMM-MULTI-STACK: a package is already open or a batch exists: add to the batch */
 if(list.length===1||baseInstall){
  if(list.length>1)toast('One package at a time here. Opened “'+pathN.basename(list[0].p)+'”');
  QS.pending=list[0]; /* SAMM-MULTI-STACK: remembered so a later pick / drop can put this package on the batch list */
  return Promise.resolve(list[0].kind==='dir'?dzFolder(list[0].p):openArchive(list[0].p)).finally(()=>{QS.pending=null})}
 if(!root)return toast('Mod Loader isn’t installed yet. Use “Set up Mod Loader…” in the Version & Essentials card');
 return queueStart(list)}
/* archive (password aware, nested single archive opened) -> items, or an error text. No dialogs except the password prompt. */
async function qExtract(file){
 let cur=file,depth=0;const fb=pathN.basename(file).replace(/\.[^.]+$/,'').replace(/_+/g,' ').trim();
 for(;;){
  const nm=pathN.basename(cur);let pw='',r;
  for(;;){
   r=await window.__native.extract(cur,pw);
   if(r&&r.needPassword){
    const p=await ask({title:'Password required',text:pw&&r.wrong?'That password didn’t work. Try again.':'“'+nm+'” is password protected. Download pages and readmes usually say what the password is.',input:true,password:true,placeholder:'Password',ok:'Unlock'});
    if(p===null)return{err:'password protected (skipped)'};pw=p;continue}
   break}
  if(!r||!r.ok)return{err:qShort(r&&r.error)||'could not be opened'};
  ARCH.tmps.push(r.dir);
  const items=listFiles(r.dir).map(rel=>({rel,abs:pathN.join(r.dir,rel)}));
  if(!items.length)return{err:'the archive is empty'};
  const real=items.filter(i=>!JUNK.test(i.rel)&&!isDoc(i.rel));
  if(depth<3&&real.length===1&&ARCH_RE.test(real[0].rel)){cur=real[0].abs;depth++;continue}
  return{items,fb}}}
async function qSource(it){
 if(it.kind==='dir'){const nm=pathN.basename(it.p);let items;
  try{items=listFiles(it.p).map(r=>String(r).replace(/\\/g,'/')).filter(r=>!JUNK.test(r)).map(r=>({rel:nm+'/'+r,abs:pathN.join(it.p,...r.split('/'))}))}
  catch(e){return{err:qShort(e.message)}}
  return items.length?{items,fb:''}:{err:'the folder is empty'}}
 return qExtract(it.p)}
async function queueStart(list,mode){
 const names=list.map(x=>pathN.basename(x.p));
 const r=mode==='auto'?true:mode==='review'?'alt':await ask({title:'Install '+list.length+' mods',
  text:names.slice(0,10).join('\n')+(names.length>10?'\n…and '+(names.length-10)+' more':'')
   +'\n\nInstall all: every mod is installed straight away with the placement the installer detects. A mod that already exists is not overwritten (the new one gets a number), programs (.exe) are skipped, and an Essentials Pack is left for you to install on its own.'
   +'\nReview each: the mods open one after another, so you can check the files, name and options before each install.',
  ok:'Install all',alt:'Review each'});
 if(r!==true&&r!=='alt')return;
 if(typeof qStageClear==='function')qStageClear();/* SAMM-MULTI-STACK */
 QS.on=true;QS.auto=r===true;QS.stop=false;QS.list=list;QS.i=-1;QS.res=[];QS.used=new Set();
 PLAN=null;pend=null;clearTmps();
 ['#asum','#destbox','#hrow','#erow','#ibusy','#pickbox'].forEach(x=>$(x).hidden=true);
 $('#plist').textContent='';$('#ok').disabled=true;$('#inex').checked=false;exUi();qUi(true);
 return QS.auto?qRunAuto():qNext()}
/* ---- Install all ---- */
async function qOne(it){
 const n0=qName(it.p);PLAN=null;pend=null;clearTmps();
 const src=await qSource(it);
 if(src.err)return{n:n0,st:'fail',msg:src.err};
 try{await loadPackage(src.items,src.fb)}catch(e){return{n:n0,st:'fail',msg:qShort(e&&e.message)}}
 if(!PLAN)return{n:n0,st:'fail',msg:'the files could not be analysed'};
 if(PLAN.ess||PLAN.files.some(f=>f.exe))return{n:n0,st:'skip',msg:'it replaces gta_sa.exe (Essentials Pack). Install it on its own'};
 const bins=PLAN.files.filter(f=>f.bin&&!PLAN.off.has(f.k));bins.forEach(f=>PLAN.off.add(f.k));
 $('#inex').checked=false;exUi();
 const want=PLAN.name,name=qUnique(want);$('#mname').value=name;drawPlan();
 const R=route(),cnt=R.ml.filter(x=>x.c!=='doc').length+R.root.length+R.scripts.length+R.cleo.length;
 if(!cnt)return{n:n0,st:'skip',msg:'no installable files were found'};
 const note=[],warns=PLAN.warns.slice();
 if(name.toLowerCase()!==want.toLowerCase())note.push('a mod named “'+want+'” already exists');
 if(bins.length)note.push(bins.length+' program file'+(bins.length===1?'':'s')+' skipped');
 const r=await runInstall(true);
 if(!r||!r.J)return{n:name,st:'fail',msg:(r&&r.err)||'it could not be installed'};
 QS.used.add(name.toLowerCase());
 return{n:r.J.name,st:'ok',J:r.J,bdir:r.bdir,note:note.join(', '),warns}}
async function qRunAuto(){
 const L=QS.list;
 for(let i=0;i<L.length;i++){
  if(!QS.on)return;
  if(QS.stop){QS.res.push({n:qName(L[i].p),st:'skip',msg:'not installed (stopped)'});continue}
  QS.i=i;qBar(i,pathN.basename(L[i].p));
  let r;try{r=await qOne(L[i])}catch(e){r={n:qName(L[i].p),st:'fail',msg:qShort(e&&e.message)}}
  QS.res.push(r);await new Promise(x=>setTimeout(x))}
 return qFinish()}
function qStop(){QS.stop=true;const s=$('#qskip');s.disabled=true;s.textContent='Stopping…'}
/* ---- Review each ---- */
async function qNext(){
 if(!QS.on)return;
 QS.i++;
 if(QS.i>=QS.list.length)return qFinish();
 const it=QS.list[QS.i],n0=qName(it.p);qBar(QS.i,pathN.basename(it.p));
 $('#qskip').disabled=true;PLAN=null;pend=null;clearTmps();
 ['#asum','#destbox','#hrow','#erow','#pickbox'].forEach(x=>$(x).hidden=true);
 $('#plist').textContent='';$('#ok').disabled=true;$('#inex').checked=false;$('#exq').value='';K3.forEach(([,id])=>$('#'+id).checked=false);exUi();
 const src=await qSource(it);
 if(!QS.on)return;
 if(src.err){QS.res.push({n:n0,st:'fail',msg:src.err});await notice('Couldn’t open “'+pathN.basename(it.p)+'”',src.err);return qNext()}
 await loadPackage(src.items,src.fb);
 if(!QS.on)return;
 if(!PLAN){QS.res.push({n:n0,st:'fail',msg:'the files could not be analysed'});return qNext()}
 $('#qskip').disabled=false}
function qInstalled(r){QS.res.push({n:r.J.name,st:'ok',J:r.J,bdir:r.bdir,note:'',warns:[]});qNext()}
function qSkip(){if(!QS.on||QS.auto||!PLAN||$('#ok').textContent==='Copying…')return;
 QS.res.push({n:qName(QS.list[QS.i].p),st:'skip',msg:'skipped'});qNext()}
/* ---- the end ---- */
async function qFinish(){
 const res=QS.res.slice();QS.on=false;qUi(false);
 try{dlg.close()}catch(e){}
 render();runChecks();return qSummary(res)}
async function qSummary(res){
 const ok=res.filter(r=>r.st==='ok'),bad=res.filter(r=>r.st!=='ok'),L=[];
 const cap=(a,f)=>{a.slice(0,25).forEach(x=>L.push(f(x)));if(a.length>25)L.push('…and '+(a.length-25)+' more')};
 if(ok.length){L.push(ok.length+' installed:');cap(ok,r=>'✓ '+r.n+(r.note?' ('+r.note+')':''))}
 const rep=ok.reduce((a,r)=>a+r.J.replaced.length,0);
 if(rep)L.push('',rep+' existing file'+(rep===1?'':'s')+' replaced (backed up)');
 if(bad.length){if(L.length)L.push('');L.push(bad.length+' not installed:');cap(bad,r=>'✗ '+r.n+': '+r.msg)}
 const wn=ok.filter(r=>r.warns&&r.warns.length).length;
 if(wn)L.push('',wn+' installed mod'+(wn===1?' has':'s have')+' notes from the installer (several versions of a file, plugins that were not found …). Install a mod on its own to read them.');
 const rs=await ask({title:ok.length?'Installed '+ok.length+' of '+res.length+' mods':'Nothing was installed',text:L.join('\n'),ok:'Done',info:true,alt:ok.length?'Undo all':''});
 if(rs==='alt'){for(const r of ok.slice().reverse()){try{await undoInstall(r.J,true);ibMarkRestored(r.bdir)}catch(e){}}toast('Undid '+ok.length+' install'+(ok.length===1?'':'s'))}}
/* ---- wiring ---- */
$('#qskip').onclick=()=>QS.auto?qStop():qSkip();
dlg.addEventListener('cancel',e=>{if(QS.on&&QS.auto){e.preventDefault();qStop()}}); /* Esc while installing everything stops after the current mod */
dlg.addEventListener('close',()=>{ /* the dialog was closed during "Review each": what is left is not installed */
 if(!QS.on)return;
 QS.list.slice(Math.max(QS.i,0)).forEach(it=>QS.res.push({n:qName(it.p),st:'skip',msg:'not installed (closed)'}));
 const res=QS.res.slice();QS.on=false;qUi(false);
 if(res.some(r=>r.st==='ok')){render();runChecks();qSummary(res)}});
