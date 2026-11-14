/* SA Mod Manager - 25-checker.js: Version & Essentials checker card */
/* Classic script: loaded in order by index.html, shares globals with the other files. */
/* ---- Version & Essentials checker ---- */
const ESSENTIALS=[
 {id:'cleo',name:'CLEO',file:'cleo.asi'},
 {id:'cleoplus',name:'CLEO+',file:'CLEO+.cleo'},
 {id:'repairgta',name:'RepairGTA',file:'RepairGTA.SA.asi'},
 {id:'crashinfo',name:'CrashInfo',file:'CrashInfo.SA.asi'},
 {id:'rundll',name:'Run32dll fix',file:'rundll32exefix.asi'},
 {id:'silentpatch',name:'SilentPatch',file:'SilentPatchSA.asi'},
 {id:'nodep',name:'No DEP',file:'_noDEP.asi'},
 {id:'windowed',name:'Windowed Mode',file:'III.VC.SA.WindowedMode.asi'},
 {id:'fv',name:'FramerateVigilante',file:'FramerateVigilante.SA.asi'},
 {id:'wsfix',name:'Widescreen Fix (ThirteenAG)',file:'GTASA.WidescreenFix.asi'}];
const OLA='III.VC.SA.LimitAdjuster.asi',F92='$fastman92limitAdjuster.asi',ESS_URL='https://www.mixmods.com.br/2019/06/sa-essentials-pack/';
/* Add SHA-256 hashes of executables you trust here: 'sha256 in lower case':'label'. A match is accepted without the signature test. */
const KNOWN_EXE={};
const VC={res:null,t:0,ek:'',er:null,o:{}};
/* ---- ASI loader check v2 (Silent's ASI Loader / Ultimate ASI Loader) ---- */ /* asi-check-v2 */
const ASI_URL='https://github.com/ThirteenAG/Ultimate-ASI-Loader/releases/latest';
const ASI_URL_SILENT='https://github.com/GTAmodding/ASI-Loader/releases/latest';
/* v1.2.8: download buttons for Mod Loader and the limit adjusters */
const DL_URL={ml:'https://github.com/thelink2012/modloader/releases/latest',ola:'https://www.mixmods.com.br/2022/10/open-limit-adjuster/',f92:'https://www.mixmods.com.br/2022/01/fastman92-limit-adjuster/'};
const dlRow=(t,m,k)=>'<div class="ckr"><div class="ckn"><div class="ckt">'+t+'</div><div class="ckm">'+m+'</div></div><button class="btn sm" data-dl="'+k+'">Download</button></div>';
const DLB={ml:dlRow('Mod Loader','GitHub releases','ml')+'<div class="ckx">Download it, then add it with the mod installer.</div>',
 lim:'<div class="ckx cknote"><b>Pick only one.</b> Open Limit Adjuster and Fastman92 Limit Adjuster can conflict and crash the game when used together unless they are properly configured. Running both is for advanced users only.</div>'+dlRow('Open Limit Adjuster','III.VC.SA.LimitAdjuster.asi · MixMods','ola')+'<div class="ckor"><span>or</span></div>'+dlRow('Fastman92 Limit Adjuster','$fastman92limitAdjuster.asi · MixMods','f92')};
const ckBody=a=>'<div class="ckt">'+esc(a.title)+'</div><div class="ckx">'+esc(a.detail)+'</div>'+(a.dl||'');
/* DLL names an ASI loader can be installed as: Silent's uses vorbisFile.dll, Ultimate uses dinput8.dll or one of the other proxy names */
const ASI_DLLS=['vorbisfile.dll','dinput8.dll','dsound.dll','ddraw.dll','d3d8.dll','d3d9.dll','winmm.dll','wininet.dll','msacm32.dll','version.dll'];
/* A DLL counts as an ASI loader when it contains the ".asi" string (ASCII or UTF-16); stock/system DLLs never do.
   Which loader it is comes from stable text inside it, never from hashes, sizes or version numbers, so updated builds keep working. */
async function asiCheck(gd,idx){
 if(!gd)return{state:'warn',title:'Game folder unknown',detail:'Scan the folder that contains gta_sa.exe to check for an ASI loader.'};
 let ents=[];try{ents=fsN.readdirSync(gd)}catch(e){}
 const found=[],other=[];
 for(const n of ents){if(!ASI_DLLS.includes(n.toLowerCase()))continue;
  let buf;try{const st=fsN.statSync(pathN.join(gd,n));if(!st.isFile()||st.size>4*1048576)continue;buf=await fsN.promises.readFile(pathN.join(gd,n))}catch(e){continue}
  const t=buf.toString('latin1').toLowerCase(),t2=t.replace(/\0/g,''),has=s=>t.includes(s)||t2.includes(s);
  if(!has('.asi')){if(n.toLowerCase()==='dinput8.dll')other.push(n);continue}
  const silent=has('silent asi loader')||has("silent's asi loader")||has('exists in more than one directory'),
   ult=!silent&&(has('ultimate asi loader')||has('initializeasi')||has('loadfromscriptsonly')),
   fam=!silent&&!ult&&has('*.asi')&&has('exclusivesets');
  found.push({name:n,kind:silent?'silent':ult?'ultimate':fam?'family':'other',hook:has('vorbishooked')})}
 const hasAsi=[...idx.keys()].some(k=>/\.asi$/.test(k));
 if(found.length>1)return{state:'warn',title:'More than one ASI loader',detail:found.map(x=>x.name).join(', ')+' all look like ASI loaders. Plugins can load twice and crash. Keep only one.'};
 if(found.length===1){const x=found[0],lab={silent:'Silent\u2019s ASI Loader',ultimate:'Ultimate ASI Loader',family:'Silent\u2019s ASI Loader (unconfirmed build)',other:'ASI loader (unidentified)'}[x.kind];
  /* Silent's loader forwards the game's audio calls to the original vorbisFile.dll renamed to vorbisHooked.dll */
  if(x.hook&&x.name.toLowerCase()==='vorbisfile.dll'&&!ents.some(n=>n.toLowerCase()==='vorbishooked.dll'))
   return{state:'bad',title:lab+': vorbisHooked.dll missing',detail:'The loader is installed as vorbisFile.dll, so the game\u2019s original vorbisFile.dll must be renamed to vorbisHooked.dll and sit next to it. Without it the game cannot start or play audio.'};
  return{state:'ok',title:lab,detail:x.name+' in the game folder.'}}
 if(other.length)return{state:'warn',title:'dinput8.dll is not an ASI loader',detail:'The dinput8.dll in the game folder does not look like an ASI loader, so .asi plugins may not load.',link:true};
 return{state:hasAsi?'bad':'warn',title:'No ASI loader found',detail:hasAsi?'.asi plugins were found but nothing loads them. Install Silent\u2019s ASI Loader (vorbisFile.dll) or Ultimate ASI Loader (dinput8.dll) in the game folder.':'Needed for any .asi mod (CLEO, SilentPatch, limit adjusters, Mod Loader). Install Silent\u2019s ASI Loader (vorbisFile.dll) or Ultimate ASI Loader (dinput8.dll).',link:true}}
const asiBody=a=>'<div class="ckt">'+esc(a.title)+'</div><div class="ckx">'+esc(a.detail)+'</div>'+(a.link?'<div class="ckx cknote"><b>Pick only one.</b> Both do the same job. Installing both makes plugins load twice and can crash the game.</div>'+'<div class="ckr"><div class="ckn"><div class="ckt">Ultimate ASI Loader</div><div class="ckm">dinput8.dll \u00b7 GitHub releases</div></div><button class="btn sm" data-open="asi">Download</button></div>'+'<div class="ckor"><span>or</span></div>'+'<div class="ckr"><div class="ckn"><div class="ckt">Silent\u2019s ASI Loader</div><div class="ckm">vorbisFile.dll \u00b7 GitHub</div></div><button class="btn sm" data-open="asis">Download</button></div>':'');
const sha256=p=>new Promise((res,rej)=>{const h=cryptoN.createHash('sha256'),s=fsN.createReadStream(p);s.on('data',d=>h.update(d));s.on('end',()=>res(h.digest('hex')));s.on('error',rej)});
/* v1.0 US / EU are recognised the way mods do it: a marker word at a fixed address (mapped through the PE section table) */
function peVersion(p,size){let fd;try{fd=fsN.openSync(p,'r');const hb=Buffer.alloc(8192),got=fsN.readSync(fd,hb,0,8192,0);
 if(got<64||hb.readUInt16LE(0)!==0x5A4D)return null;const pe=hb.readUInt32LE(0x3C);if(pe+24>got||hb.toString('latin1',pe,pe+4)!=='PE\u0000\u0000')return null;
 const ns=hb.readUInt16LE(pe+6),opt=hb.readUInt16LE(pe+20),base=hb.readUInt32LE(pe+52),at=pe+24+opt,secs=[];
 for(let i=0;i<ns;i++){const o=at+i*40;if(o+40>got)break;secs.push({va:hb.readUInt32LE(o+12),vs:hb.readUInt32LE(o+8),rs:hb.readUInt32LE(o+16),rp:hb.readUInt32LE(o+20)})}
 const rd=va=>{const rva=va-base,s=secs.find(x=>rva>=x.va&&rva<x.va+Math.min(x.vs||x.rs,x.rs||x.vs));if(!s)return null;const off=s.rp+(rva-s.va);if(off+2>size)return null;const b=Buffer.alloc(2);fsN.readSync(fd,b,0,2,off);return b.readUInt16LE(0)};
 if(rd(0x82457C)===0x94BF)return'US';if(rd(0x8245BC)===0x94BF)return'EU';return null}
 catch(e){return null}finally{if(fd!==undefined)try{fsN.closeSync(fd)}catch(e){}}}
async function checkExe(gd){
 if(!gd)return{state:'warn',title:'Game folder unknown',detail:'Scan the folder that contains gta_sa.exe to check the executable.'};
 let ents=[];try{ents=fsN.readdirSync(gd)}catch(e){}
 const name=ents.find(n=>/^gta_sa\.exe$/i.test(n));
 if(!name)return{state:'bad',title:'gta_sa.exe not found',detail:'There is no gta_sa.exe in '+gd+'.'};
 const p=pathN.join(gd,name),st=fsN.statSync(p),key=p+'|'+st.size+'|'+st.mtimeMs;if(VC.ek===key&&VC.er)return VC.er;
 const hash=await sha256(p),ver=peVersion(p,st.size),known=KNOWN_EXE[hash],meta=fmtSize(st.size)+' · SHA-256 '+hash;let r;
 if(known)r={state:'ok',title:'Known executable: '+known,detail:'Compatible with ASI mods and Mod Loader.',meta};
 else if(ver)r={state:'ok',title:'GTA SA v1.0 '+ver+' executable',detail:'Compatible with ASI mods and Mod Loader.',meta};
 else{const steam=ents.some(n=>/^(steam_api\.dll|gta-sa\.exe)$/i.test(n));
  r={state:'warn',title:'Not a recognised v1.0 executable',detail:'Most mods need the v1.0 US or EU exe. Other versions (v1.01, v2.0, Steam, Rockstar Launcher) or a copy-protected retail exe can crash or stop mods loading.'+(steam?' Steam files were found here.':''),meta}}
 VC.ek=key;VC.er=r;return r}
async function asiWalk(dir,pre,add,depth){let ents;try{ents=await fsN.promises.readdir(dir,{withFileTypes:true})}catch(e){return}
 for(const e of ents){if(e.isDirectory()){if(depth<12)await asiWalk(pathN.join(dir,e.name),pre+e.name+'/',add,depth+1)}else if(/\.asi$/i.test(e.name))add(e.name,pre+e.name)}}
/* ---- SAMM-FEATURES: sidebar warnings for a missing modloader.ini and duplicate .asi plugins (both can be ignored) ---- */
/* Ignored warnings are remembered per installation in S.warnIgn[curInst]: 'mlini' and 'dup:<file name in lower case>'. */
const wIgn=()=>{S.warnIgn=S.warnIgn||{};const k=S.curInst||'default';return S.warnIgn[k]=S.warnIgn[k]||[]};
const cwMli=()=>{if(!root||!root._path)return null;try{return{missing:!fsN.readdirSync(root._path).some(n=>/^modloader\.ini$/i.test(n))}}catch(e){return null}};
/* SAMM-PATCH-DUPLICATE-PLUGINS: an .asi counts as a duplicate when the same file name exists in two different places, anywhere it can load from:
   the game folder, scripts, plugins, other game sub-folders (not cleo), loose in the modloader folder, in two different mods inside modloader,
   or twice inside the same mod (different folders). Mods that are off, excluded, at priority 0, or files matched by "Ignored files" are skipped.
   Each warning can still be ignored with its Ignore button. */
function cwDups(all){const out=[];E=eff();
 for(const[k,locs]of all){const shown=[];
  for(const w of locs){
   if(w.startsWith('modloader/')){const p=w.split('/'),mod=p[1],rel=p.slice(2).join('/');
    if(p.length>2&&(mod[0]==='.'||!swOn(mod)||exOther(mod)||prio(mod)<=0||fileIgnored({name:mod},rel)))continue}
   else if(w.includes('/')&&w.split('/')[0].toLowerCase()==='cleo')continue;
   shown.push(w)}
  if(shown.length>1)out.push({key:k,name:shown[0].split('/').pop(),where:shown})}
 return out.sort((a,b)=>a.name.localeCompare(b.name))}
function cwCount(r){const g=wIgn();return(r.mli&&r.mli.missing&&!g.includes('mlini')?1:0)+(r.dups||[]).filter(d=>!g.includes('dup:'+d.key)).length}
function cwSecs(r,sec){const g=wIgn();let h='';
 if(r.mli){
  if(!r.mli.missing)h+=sec('modloader.ini','ok','Found','<div class="ckx">In the modloader folder.</div>');
  else if(g.includes('mlini'))h+=sec('modloader.ini','ok','Ignored','<div class="ckx">This warning is ignored.</div><div style="margin-top:8px"><button class="btn sm" data-wunign="mlini">Show warning again</button></div>');
  else h+=sec('modloader.ini','warn','Missing','<div class="ckt">modloader.ini not found</div><div class="ckx">There is no modloader.ini in the modloader folder. Profile settings (priorities, ignored mods, the current profile) are saved there. Create it to start from the current settings.</div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><button class="btn sm" data-mkini="1">Create modloader.ini</button><button class="btn sm" data-wign="mlini">Ignore</button></div>')}
 const d=r.dups||[],live=d.filter(x=>!g.includes('dup:'+x.key)),skip=d.filter(x=>g.includes('dup:'+x.key));
 const row=(x,btn,cls)=>/*SAMM-PATCH-DUP-ALIGN*/'<div class="ckr ckrp"><i class="ckd '+(cls||'')+'"></i><div class="ckn"><div class="ckt">'+esc(x.name)+'</div><div class="ckm ckw">'+/*SAMM-PATCH-DUP-PATHS*/x.where.map(w=>'<div>'+esc(w).replace(/\//g,'/<wbr>')+'</div>').join('')+'</div></div>'+btn+'</div>';
 h+=sec('Duplicate plugins',live.length?'warn':'ok',live.length?String(live.length):'None',
  (live.length?'<div class="ckx" style="margin-bottom:2px">The same plugin file is in more than one place, so it can load twice and crash the game. Keep one copy, or ignore it if you did this on purpose.</div>'+live.map(x=>row(x,'<button class="btn sm" data-wign="dup:'+esc(x.key)+'">Ignore</button>','warn')).join(''):'<div class="ckx">No .asi plugin is installed in more than one place.</div>')
  +(skip.length?'<details class="ckf" data-k="wign"'+(VC.o.wign?' open':'')+'><summary><span>Ignored</span><span class="pill">'+skip.length+'</span></summary>'+skip.map(x=>row(x,'<button class="btn sm" data-wunign="dup:'+esc(x.key)+'">Restore</button>')).join('')+'</details>':''));
 return h}
async function runChecks(){if(!root&&!game){VC.res=null;renderChecks();return}
 const t=++VC.t,gd=gameDir(),idx=new Map(),all=new Map(),add=(n,w)=>{const k=n.toLowerCase();if(!idx.has(k))idx.set(k,w);if(/\.asi$/.test(k)){const a=all.get(k)||all.set(k,[]).get(k);if(!a.includes(w))a.push(w)}};
 if(gd){for(const sub of['','scripts','plugins']){try{for(const e of fsN.readdirSync(pathN.join(gd,sub),{withFileTypes:true}))if(e.isFile()&&/\.(asi|cleo)$/i.test(e.name))add(e.name,(sub?sub+'/':'')+e.name)}catch(e){}}
  /* cleo folder: every subfolder, any depth (files of a folder first, then its subfolders) */
  const cw=(rel,d)=>{let ents;try{ents=fsN.readdirSync(pathN.join(gd,rel),{withFileTypes:true})}catch(e){return}
   for(const e of ents)if(e.isFile()&&/\.(asi|cleo)$/i.test(e.name))add(e.name,rel+'/'+e.name);
   if(d<12)for(const e of ents)if(e.isDirectory())cw(rel+'/'+e.name,d+1)};cw('cleo',0)}
 if(root&&root._path)await asiWalk(root._path,'modloader/',add,0);
 else S.mods.forEach(m=>m.files.forEach(f=>{if(/\.asi$/i.test(f))add(f.split('/').pop(),'modloader/'+m.name+'/'+f)}));
 let exe;try{exe=await checkExe(gd)}catch(e){exe={state:'bad',title:'Couldn’t check gta_sa.exe',detail:e.message}}
 if(t!==VC.t)return;
 let asi;try{asi=await asiCheck(gd,idx)}catch(e){asi={state:'bad',title:'Couldn\u2019t check the ASI loader',detail:e.message}}
 if(t!==VC.t)return;
 const mlw=idx.get('modloader.asi'),mlc=mlw?{state:'ok',title:'modloader.asi found',detail:mlw==='modloader.asi'?'In the game folder.':'In '+mlw.replace(/\/[^/]*$/,'')+'.'}:{state:'bad',dl:DLB.ml,title:'modloader.asi not found',detail:'Mod Loader’s plugin has to be in the game folder (or scripts / plugins) for the mods in modloader to load.'};
 const o=idx.get(OLA.toLowerCase()),f=idx.get(F92.toLowerCase());let lim;
 if(o&&f&&LIMACK())lim={state:'ok',dl:'<div style="margin-top:8px"><button class="btn sm" data-ack="clear">Show warning again</button></div>',title:'Two limit adjusters (warning dismissed)',detail:'You chose to keep both. They can still conflict unless they are configured to work together.'};
 else if(o&&f)lim={state:'warn',dl:'<div style="margin-top:8px"><button class="btn sm" data-ack="set">I know what I’m doing</button></div>',title:'Two limit adjusters are installed',detail:'Open and Fastman92 limit adjusters can conflict and crash the game unless they are properly configured to work together. That setup is for advanced users. If you did not set it up on purpose, keep only one.'};
 else if(!o&&!f)lim={state:'warn',dl:DLB.lim,title:'No limit adjuster found',detail:'Install Open Limit Adjuster or Fastman92 Limit Adjuster to avoid crashes with large mod packs.'};
 else lim={state:'ok',title:o?'Open Limit Adjuster':'Fastman Limit Adjuster',detail:o||f};
 VC.res={mli:cwMli(),dups:cwDups(all),exe,ml:mlc,asi,lim,ess:ESSENTIALS.map(x=>({...x,where:idx.get(x.file.toLowerCase())||''}))};renderChecks()}
function renderChecks(){const b=$('#chkbody'),c=$('#chkcnt'),r=VC.res;let h;
 const LB={ok:'OK',warn:'Review',bad:'Problem'};
 const sec=(t,st,lab,body)=>`<section class="cks"><div class="cksh"><span>${t}</span><span class="pill ${st}">${lab||LB[st]}</span></div>${body}</section>`;
 if(!root&&!game){h='<span class="stats">Scan a GTA folder to run the checks.</span>';c.textContent='';c.className='cnt'}
 else if(!r){h='<span class="stats">Checking…</span>'}
 else{const ign=S.essIgn,miss=r.ess.filter(x=>!x.where&&!ign.includes(x.id)),skip=r.ess.filter(x=>!x.where&&ign.includes(x.id)),have=r.ess.filter(x=>x.where),
   issues=(r.exe.state==='ok'?0:1)+(r.ml.state==='ok'?0:1)+(r.asi.state==='ok'?0:1)+(r.lim.state==='ok'?0:1)+miss.length+cwCount(r);
  c.textContent=issues?issues+' to review':'All good';c.className='cnt '+(issues?'warn':'ok');
  const rowI=(x,btn,d)=>`<div class="ckr"><i class="ckd ${d||''}"></i><div class="ckn"><div class="ckt">${esc(x.name)}</div><div class="ckm">${esc(x.file)}</div></div>${btn||''}</div>`;
  h=sec('gta_sa.exe',r.exe.state,'',`<div class="ckt">${esc(r.exe.title)}</div><div class="ckx">${esc(r.exe.detail)}</div>`+(r.exe.meta?`<details class="ckf" data-k="file"${VC.o.file?' open':''}><summary><span>File details</span></summary><div class="ckm">${esc(r.exe.meta)}</div></details>`:''))
   +sec('ASI loader',r.asi.state,'',asiBody(r.asi))
   +sec('Mod Loader',r.ml.state,'',ckBody(r.ml))+cwSecs(r,sec)
   +sec('Limit adjuster',r.lim.state,'',ckBody(r.lim))
   +sec('Essentials',miss.length?'warn':'ok',`${have.length} of ${r.ess.length}`,
     (miss.length?`<div class="ckx" style="margin-bottom:2px">Missing:</div>`+miss.map(x=>rowI(x,`<button class="btn sm" data-ign="${x.id}">Ignore</button>`,'warn')).join(''):'<div class="ckx">Nothing missing.</div>')
     +(skip.length?`<details class="ckf" data-k="ign"${VC.o.ign?' open':''}><summary><span>Ignored</span><span class="pill">${skip.length}</span></summary>${skip.map(x=>rowI(x,`<button class="btn sm" data-unign="${x.id}">Restore</button>`)).join('')}</details>`:'')
     +(have.length?`<details class="ckf" data-k="found"${VC.o.found?' open':''}><summary><span>Found</span><span class="pill ok">${have.length}</span></summary>${have.map(x=>`<div class="ckr"><i class="ckd ok"></i><div class="ckn"><div class="ckt">${esc(x.name)}</div><div class="ckm">${esc(x.where)}</div></div></div>`).join('')}</details>`:''))}
 if(b._h!==h){b.innerHTML=h;b._h=h}}
const LIMACK=()=>!!(S.limAck&&S.limAck[S.curInst]);
$('#chkbody').onclick=e=>{const a=e.target.closest('[data-ign]'),u=e.target.closest('[data-unign]');
 {const k=e.target.closest('[data-ack]');if(k){S.limAck=S.limAck||{};if(k.dataset.ack==='set')S.limAck[S.curInst]=true;else delete S.limAck[S.curInst];save();runChecks();return}}
 if(e.target.closest('[data-open="asi"]')){nOpen(ASI_URL);return}
 if(e.target.closest('[data-open="asis"]')){nOpen(ASI_URL_SILENT);return}
 {const dl=e.target.closest('[data-dl]');if(dl&&DL_URL[dl.dataset.dl]){nOpen(DL_URL[dl.dataset.dl]);return}}
 if(a){if(!S.essIgn.includes(a.dataset.ign))S.essIgn.push(a.dataset.ign);save();renderChecks()}
 else if(u){S.essIgn=S.essIgn.filter(x=>x!==u.dataset.unign);save();renderChecks()}};
$('#chkbody').addEventListener('toggle',e=>{const k=e.target.dataset&&e.target.dataset.k;if(k)VC.o[k]=e.target.open},true);
$('#chkrun').onclick=async()=>{const b=$('#chkrun');b.disabled=true;VC.ek='';try{await runChecks()}finally{b.disabled=false}toast('Checks updated')};
$('#chklink').onclick=()=>nOpen(ESS_URL);

/* SAMM-FEATURES: clicks for the two new warnings */
$('#chkbody').addEventListener('click',async e=>{
 const w=e.target.closest('[data-wign]'),u=e.target.closest('[data-wunign]'),mk=e.target.closest('[data-mkini]');
 if(w){const a=wIgn();if(!a.includes(w.dataset.wign))a.push(w.dataset.wign);save();renderChecks();return}
 if(u){const a=wIgn(),i=a.indexOf(u.dataset.wunign);if(i>=0)a.splice(i,1);save();renderChecks();return}
 if(mk){mk.disabled=true;try{await commit(S.main,'modloader.ini created')}finally{runChecks()}}});
