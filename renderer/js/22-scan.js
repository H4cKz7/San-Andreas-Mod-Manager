/* SA Mod Manager - 22-scan.js: folder scan, modloader.ini / profile reading and writing, Save, restore on start */
/* Classic script: loaded in order by index.html, shares globals with the other files. */
/* folder scan */
let root=null,srcText='No folder scanned yet',src={},game=null,logGet=null,extraLog=null,written={};
const newP=()=>({pr:{},im:[],ex:[],ig:[],inc:[],par:[],cx:[],um:'',ia:null,ea:null});
const idb=window.__idb;
const canWrite=async()=>!!root;
async function writeFile(path,data,base=root){
 if(/\.(ini|jsonc?)$/i.test(path)&&base&&base._path){try{const abs=pathN.join(base._path,...path.split('/'));if(fsN.existsSync(abs))BK.save(abs,fsN.readFileSync(abs,'utf8'))}catch(e){}}
 const ps=path.split('/'),f=ps.pop();let d=base;for(const s of ps)d=await d.getDirectoryHandle(s,{create:true});const w=await(await d.getFileHandle(f,{create:true})).createWritable();await w.write(data);await w.close()}
const PSEC=/^Profiles\.([^.]+)\.(Config|Priority|IgnoreMods|IgnoreFiles|IncludeMods|ExclusiveMods)$/;
const ppath=n=>{const x=src[n];return x?x.path:n==='Default'?S.main:`.profiles/${n}.ini`};
function applyLine(k,p,l){l=l.replace(/\s+;.*$/,'');const q=l.match(/^([^=]+?)\s*=\s*(.*)$/);
 if(k==='Config'){const key=q?q[1].toLowerCase():'',val=q?q[2].trim():'';
  if(key==='ignoreallfiles'||key==='ignoreallmods')p.ia=/^(1|true|yes|on)$/i.test(val);
  else if(key==='excludeallmods')p.ea=/^(1|true|yes|on)$/i.test(val);
  else if(key==='parents'){p.par=val.split(',').map(x=>x.trim()).filter(Boolean);if(p.par.some(x=>x.toLowerCase()==='$none'))p.par=[]}
  else if(key==='useifmodule')p.um=val;
  else p.cx.push(l)}
 else if(k==='Priority'){if(q){const v=parseInt(q[2],0);if(!isNaN(v))setPr(p,q[1].trim(),Math.max(0,v))}}
 else{const a={IgnoreMods:p.im,IgnoreFiles:p.ig,IncludeMods:p.inc,ExclusiveMods:p.ex}[k],e=l.replace(/\s*=.*$/,'');if(e&&!a.includes(e))a.push(e)}}
function parseIniFile(t){const out={top:[],fc:{seen:false,profile:null,pl:null,lines:[]},profs:{}};let cur=null;
 t.split(/\r?\n/).forEach(raw=>{const l=raw.trim(),h=l.match(/^\[(.+)\]$/);
  if(h){const m=h[1].match(PSEC);
   if(m)cur={k:m[2],p:out.profs[m[1]]||(out.profs[m[1]]=newP())};
   else if(h[1]==='Folder.Config'){out.fc.seen=true;cur='fc'}
   else{cur={sec:h[1],lines:[]};out.top.push(cur)}return}
  if(!l||!cur)return;
  if(cur==='fc'){if(l[0]===';'||l[0]==='#')return;const q=l.replace(/\s+;.*$/,'').match(/^([^=]+?)\s*=\s*(.*)$/),key=q?q[1].toLowerCase():'';
   if(key==='profile')out.fc.profile=q[2].trim();
   else if(key==='prioritylimit'){const v=parseInt(q[2],0);out.fc.pl=isNaN(v)?null:Math.max(0,v)}
   else out.fc.lines.push(l)}
  else if(cur.sec!==undefined)cur.lines.push(raw.trimEnd());
  else if(l[0]!==';'&&l[0]!=='#')applyLine(cur.k,cur.p,l)});
 return out}
async function commit(path,msg){const f=files().find(x=>x[0]===path);if(!f)return;
 if(root&&await canWrite()){try{await writeFile(path,f[1]);written[path]=f[1];toast(msg);return true}catch(e){toast('Saving failed: '+e.message);return false}}
 else{toast(root?'Not written yet. Use Save changes':'Mod Loader isn’t installed yet, so nothing was written');return false}}
async function ingest(ents,dirs,label){
 const mods=new Map(dirs.filter(d=>d[0]!=='.'&&d.toLowerCase()!=='profiles').map(d=>[d,[]]));
 const pfiles=[],logs=[],plugs=[];src={};logGet=null;let mainGet=null,bcGet=null,ppGet=null,bcDef0=null,ppDef0=null;
 for(const[p,get]of ents){const s=p.split('/'),top=s[0].toLowerCase();
  if(/^modloader\.log$/i.test(p)){logs.push([p,get]);continue}
  if(/^\.data\/config\.ini$/i.test(p)){bcGet=get;continue}
  if(/^\.data\/config\.ini\.0$/i.test(p)){bcDef0=get;continue}
  if(/^\.data\/plugins\/plugins\.ini\.0$/i.test(p)){ppDef0=get;continue}
  if(/^\.data\/plugins\/plugins\.ini$/i.test(p)){ppGet=get;continue}
  if(/^\.data\/plugins\/.+\.dll$/i.test(p)){plugs.push(p.slice(14));continue}
  if(top==='.profiles'||top==='profiles'){if(s.length>1&&/\.ini$/i.test(p))pfiles.push([p,get]);continue}
  if(/^modloader\.ini$/i.test(p)){mainGet=get;continue}
  if(s.length>1&&s[0][0]!=='.'){if(!mods.has(s[0]))mods.set(s[0],[]);mods.get(s[0]).push(s.slice(1).join('/'))}}
 logGet=logs.length?logs[0][1]:null;await detectPath(label);
 const profs={};let top=[],fc={seen:false,profile:null,pl:null,lines:[]};S.main='modloader.ini';
 if(mainGet){const r=parseIniFile(await(await mainGet()).text());top=r.top;fc=r.fc;for(const[n,p]of Object.entries(r.profs)){profs[n]=p;src[n]={path:S.main}}}
 for(const[p,get]of pfiles.sort((a,b)=>a[0]<b[0]?-1:1)){const r=parseIniFile(await(await get()).text());
  for(const[n,pr]of Object.entries(r.profs)){if(profs[n])continue;profs[n]=pr;src[n]={path:p}}}
 S.topSecs=top;S.pl=fc.pl;S.fcl=fc.lines;S.defInFile=!!profs.Default;
 if(!profs.Default){profs.Default=newP();src.Default={path:S.main}}
 let cur='Default';if(fc.profile){const k=Object.keys(profs).find(x=>x.toLowerCase()===fc.profile.toLowerCase());if(k)cur=k}
 S.profiles=profs;S.cur=cur;S.active=cur;
 S.bc=bcDef();S.bcRaw='';S.bcx=[];S.bcTop=[];S.bcSeen=false;S.bcDirty=false;S.pp={};S.ppTop=[];S.ppSeen=false;S.ppDirty=false;S.plugins=plugs.sort();
 const readBc=async get=>{const tx=await(await get()).text();S.bcRaw=tx;const r=parseIniFile(tx),c=r.top.find(o=>o.sec.toLowerCase()==='config');
  (c?c.lines:[]).forEach(l=>{const q=l.replace(/\s+;.*$/,'').match(/^\s*([^=;#]+?)\s*=\s*(.*?)\s*$/);if(!q)return;const k=Object.keys(S.bc).find(x=>x.toLowerCase()===q[1].toLowerCase());
   if(!k)return S.bcx.push(l.trim());const v=q[2];S.bc[k]=typeof S.bc[k]==='boolean'?/^(1|true|yes|on)$/i.test(v):(parseInt(v,0)||0)});
  S.bcTop=r.top.filter(o=>o!==c)};
 S.bcFrom='none';
 if(bcGet){S.bcSeen=true;S.bcFrom='file';await readBc(bcGet)}else if(bcDef0){S.bcFrom='default';await readBc(bcDef0)}
 const readPp=async get=>{const r=parseIniFile(await(await get()).text()),c=r.top.find(o=>o.sec==='Priority');
  (c?c.lines:[]).forEach(l=>{const q=l.replace(/\s+;.*$/,'').match(/^\s*([^=;#]+?)\s*=\s*(.*?)\s*$/);if(q&&!isNaN(parseInt(q[2],0)))S.pp[q[1]]=Math.max(0,parseInt(q[2],0))});
  S.ppTop=r.top.filter(o=>o!==c)};
 if(ppGet){S.ppSeen=true;await readPp(ppGet)}else if(ppDef0)await readPp(ppDef0);
 written={};files().forEach(([p,t])=>written[p]=t);
 S.mods=[...mods].map(([name,files])=>({name,files:files.sort()})).sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true}));
 srcText=`Scanned “${label}”: ${S.mods.length} mods, ${Object.keys(profs).length} profiles`+exeNote();
 try{$('#welc').close()}catch(e){}undoReset();pulse();render();toast(`Found ${S.mods.length} mods`)}
const gpath=()=>S.gpathUser||S.gpathAuto||'';
const curInst=()=>S.installs.find(i=>i.id===S.curInst)||null;
async function detectPath(label){let a='';
 if(game&&game._path)a=game._path;
 else if(logGet){try{const t=await(await logGet()).text(),m=t.match(/Using Mod Loader folder "(.*?)"/);
  if(m)a=m[1].replace(/[\\/]+$/,'').replace(/[\\/]modloader$/i,'').replace(/[\\/](scripts|plugins)$/i,'')}catch(e){}}
 S.gpathAuto=a;const ci=curInst();
 if(ci){S.gpathUser=ci.gpathUser||'';if(a)ci.path=a}
 else{const nm=label||(game||root||{}).name||'';if(S.gname!==nm){S.gname=nm;S.gpathUser=''}}}
const exeNote=()=>S.exes.length?` · found ${S.exes[0]}${gpath()?' in '+gpath():''}`:' · gta_sa.exe not found (pick the GTA folder to enable shortcuts)';
async function findExes(){S.exes=[];if(!game){const gd=gameDir();if(gd)try{fsN.readdirSync(gd).forEach(n=>{if(/\.exe$/i.test(n))S.exes.push(n)})}catch(e){}}
 if(game){try{for await(const[n,e]of game.entries())if(e.kind==='file'&&/\.exe$/i.test(n))S.exes.push(n)}catch(e){}}
 const rank=x=>/^gta[_-]sa\.exe$/i.test(x)?0:1;S.exes.sort((a,b)=>rank(a)-rank(b)||a.localeCompare(b));
 if(!S.exes.includes(S.exe))S.exe=S.exes[0]||''}
async function scanRoot(){await findExes();const ents=[],dirs=[];
 const walk=async(d,pre)=>{for await(const[n,e]of d.entries()){if(e.kind==='file')ents.push([pre+n,()=>e.getFile()]);else{if(!pre)dirs.push(n);await walk(e,pre+n+'/')}}};
 await walk(root,'');await ingest(ents,dirs,root.name);scheduleAutoBackup();runChecks()}
async function findML(h){
 const dirs=[h];
 for(const n of['scripts','plugins']){try{dirs.push(await h.getDirectoryHandle(n))}catch(e){}}
 for(const d of dirs){try{for await(const[n,e]of d.entries())if(e.kind==='directory'&&n.toLowerCase()==='modloader')return e}catch(e){}}
 return null}
async function instFor(main){let found=null;
 for(const i of S.installs){let o=null;try{o=await idb('get',i.id)}catch(e){}
  const oh=o&&(o.game||o.root);
  if(oh){try{if(await oh.isSameEntry(main)){found=i;break}}catch(e){if(oh._path&&main._path&&oh._path===main._path){found=i;break}}}}
 if(!found){found={id:'i'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),name:main.name,gpathUser:''};S.installs.push(found)}
 found.name=main.name;return found}

/* ---- v1.2.7: prepare a clean game when Mod Loader is missing ---- */
const ML_URL='https://github.com/thelink2012/modloader/releases/latest',ESS_URL2='https://www.mixmods.com.br/2019/06/sa-essentials-pack/';
$('#mldmll').onclick=()=>require('electron').shell.openExternal(ML_URL);
$('#mldesl').onclick=()=>require('electron').shell.openExternal(ESS_URL2);
function mlMissing(h){return new Promise(res=>{const d=$('#mld');
 $('#mldt').textContent='There is no modloader folder in “'+h.name+'”. Install Mod Loader or the Essentials Pack with the mod installer. A .zip, .rar or .7z archive works, and so does an extracted folder.';
 let done=false;const fin=v=>{if(done)return;done=true;d.close();res(v)};
 $('#mldml').onclick=()=>fin('ml');$('#mldes').onclick=()=>fin('ess');$('#mldx').onclick=()=>fin(null);
 d.oncancel=e=>{e.preventDefault();fin(null)};d.showModal()})}
function openBaseInstaller(h,kind){baseInstall={h,kind};$('#inst').click()}
function applyBasePlan(plan,kind){
 const rel=f=>String(f.r0||f.r||'').replace(/\\/g,'/');
 const base=f=>rel(f).split('/').pop();
 const has=re=>plan.files.some(f=>re.test(base(f)));
 if(kind==='ml'&&!has(/^modloader\.asi$/i))return 'That package does not contain modloader.asi. Choose the Mod Loader download (.zip, .rar, .7z or an extracted folder).';
 if(kind==='ess'&&!has(/^gta[_-]?sa\.exe$/i)&&!has(/^cleo\.asi$/i))return 'That package does not look like the Essentials Pack (no gta_sa.exe or cleo.asi found inside).';
 const keep=[];
 plan.files.forEach(f=>{
  const r=rel(f);
  if(kind==='ml'&&(/^\(?essentials[ _-]?readme\)?\//i.test(r)||(!r.includes('/')&&isDoc(r))||/^gta[_-]?sa\.exe$/i.test(base(f))))return;
  f.c='ml_ess';f.d=r;keep.push(f)});
 if(!keep.length)return 'No installable files were found in that package.';
 plan.files=keep;plan.base=kind;plan.ess=kind==='ess';plan.name=kind==='ess'?'Essentials Pack':'Mod Loader';
 plan.auto=Object.assign({},plan.auto,{root:true});return ''}
function mlBtnSync(){const b=$('#chkml');if(b)b.hidden=!(game&&!root)}
/* the game folder is known but has no modloader folder yet: the manager stays usable and keeps looking */
async function scanGameOnly(label){
 await findExes();
 S.mods=[];S.profiles={Default:newP()};S.cur='Default';S.active='Default';S.pl=null;S.fcl=[];S.topSecs=[];S.defInFile=false;S.main='modloader.ini';
 src={Default:{path:S.main}};written={};logGet=null;
 S.bc=bcDef();S.bcRaw='';S.bcx=[];S.bcTop=[];S.bcSeen=false;S.bcDirty=false;S.bcFrom='none';
 S.pp={};S.ppTop=[];S.ppSeen=false;S.ppDirty=false;S.plugins=[];
 await detectPath(label);
 srcText='Game folder “'+label+'” found. Mod Loader is not installed yet'+exeNote();
 try{$('#welc').close()}catch(e){}
 _fc=null;written={};files().forEach(([p,t])=>written[p]=t); /* fresh install: nothing to save yet */
 undoReset();pulse();render();runChecks()}
/* open what is stored for an installation; looks for the modloader folder again if it was missing before */
async function openStored(){
 if(!root&&game){const ml=await findML(game);if(ml)root=ml}
 if(root)await scanRoot();
 else if(game)await scanGameOnly(game.name);
 else throw new Error('missing')}
async function setRoot(h,opts){opts=opts||{};
 let r=h,g=null;
 if(h.name.toLowerCase()!=='modloader'){
  g=h;r=await findML(h);
  if(!r){
   let hasExe=false;
   try{for await(const[n,e]of h.entries())if(e.kind==='file'&&/^gta[_-]?sa\.exe$/i.test(n)){hasExe=true;break}}catch(err){}
   if(!hasExe){if(opts.silent)return;return notice('Invalid GTA San Andreas folder','The selected folder does not contain gta_sa.exe.')}
   const inst=await instFor(h);S.curInst=inst.id;root=null;game=g;extraLog=null;
   try{await idb('put',inst.id,{root:null,game:g})}catch(err){}
   await scanGameOnly(h.name);
   if(!opts.silent){const c=await mlMissing(h);if(c)openBaseInstaller(h,c)}
   return}}
 const inst=await instFor(h);S.curInst=inst.id;root=r;game=g;extraLog=null;
 try{await idb('put',inst.id,{root:r,game:g})}catch(e){}
 await scanRoot()}
async function switchInst(id){if(id===S.curInst&&(root||game))return;let o=null;try{o=await idb('get',id)}catch(e){}
 const nm=(S.installs.find(i=>i.id===id)||{}).name||'that folder';
 if(!o)return notice('Folder not found','Couldn’t find “'+nm+'” anymore. Scan it again to link it back.');
 S.curInst=id;root=o.root||null;game=o.game||null;extraLog=null;
 try{await openStored()}
 catch(e){notice('Folder not found','Couldn’t open “'+nm+'”. Scan it again to link it back.')}}
async function forgetInst(id){S.installs=S.installs.filter(i=>i.id!==id);try{await idb('del',id)}catch(e){}
 if(S.curInst===id){S.curInst='';const nx=S.installs[0];
  if(nx)await switchInst(nx.id);else{root=null;game=null;S.mods=[];S.exes=[];logGet=null;srcText='No folder scanned yet';render();welcome()}}
 else render()}
async function pick(){try{await setRoot(await showDirectoryPicker())}catch(e){if(e.name!=='AbortError')notice('Couldn’t open that folder',e.message)}}
$('#scan').onclick=pick;
$('#rescan').onclick=async()=>{try{await openStored()}catch(e){notice('Couldn’t read the folder',e.message)}};
function profIni(n){const p=fx(n),h=x=>`[Profiles.${n}.${x}]`,lim=S.pl!=null?S.pl:100;
 const cf=[...p.cx];if(p.ia!=null)cf.push('IgnoreAllMods = '+p.ia);if(p.ea!=null)cf.push('ExcludeAllMods = '+p.ea);
 cf.push('Parents = '+(p.par.length?p.par.join(', '):'$None'));if(p.um)cf.push('UseIfModule = '+p.um);
 const pr=Object.entries(p.pr).map(([k,v])=>k+' = '+Math.min(v,lim)),sec=(x,a)=>`${h(x)}\n${a.join('\n')}${a.length?'\n':''}\n`;
 return sec('Config',cf)+sec('Priority',pr)+sec('IgnoreFiles',p.ig)+sec('IgnoreMods',p.im)+sec('IncludeMods',p.inc)+sec('ExclusiveMods',p.ex)}
function patchIni(raw,sec,vals,dflt){const nl=raw.includes('\r\n')?'\r\n':'\n',L=raw.split(/\r?\n/);let cur='',seen={},last=-1,hdr=-1;
 for(let i=0;i<L.length;i++){const h=L[i].trim().match(/^\[(.+)\]$/);
  if(h){cur=h[1];if(cur.toLowerCase()===sec.toLowerCase())hdr=i;continue}
  if(cur.toLowerCase()!==sec.toLowerCase())continue;if(L[i].trim())last=i;
  const m=L[i].match(/^(\s*)([^=;#\s][^=]*?)(\s*=\s*)([^;]*?)(\s*)(;.*)?$/);if(!m)continue;
  const k=Object.keys(vals).find(x=>x.toLowerCase()===m[2].toLowerCase());if(!k)continue;seen[k]=1;
  const nv=String(vals[k]),span=m[4].length+m[5].length;L[i]=m[1]+m[2]+m[3]+(m[6]?nv.padEnd(Math.max(span,nv.length+1)):nv)+(m[6]||'')}
 const add=Object.keys(vals).filter(k=>!seen[k]&&String(vals[k])!==String(dflt[k])).map(k=>`${k} = ${vals[k]}`);
 if(add.length){if(hdr>=0)L.splice((last>hdr?last:hdr)+1,0,...add);else L.push(`[${sec}]`,...add)}
 return L.join(nl)}
const bcText=()=>{const b=S.bc,o=v=>v?'true':'false';
 if(S.bcRaw)return patchIni(S.bcRaw,'Config',{EnableMenu:o(b.EnableMenu),EnablePlugins:o(b.EnablePlugins),EnableLog:o(b.EnableLog),ImmediateFlushLog:o(b.ImmediateFlushLog),MaxLogSize:b.MaxLogSize,RefreshKey:b.RefreshKey,AutoRefresh:o(b.AutoRefresh)},bcDef());
 return `[Config]\n${[`EnableMenu = ${o(b.EnableMenu)}`,`EnablePlugins = ${o(b.EnablePlugins)}`,`EnableLog = ${o(b.EnableLog)}`,`ImmediateFlushLog = ${o(b.ImmediateFlushLog)}`,`MaxLogSize = ${b.MaxLogSize}`,`RefreshKey = ${b.RefreshKey}`,`AutoRefresh = ${o(b.AutoRefresh)}`,...S.bcx].join('\n')}\n\n`+S.bcTop.map(o=>`[${o.sec}]\n${o.lines.join('\n')}\n\n`).join('')};
const ppText=()=>{const e=Object.entries(S.pp);return `[Priority]\n${e.map(([k,v])=>k+' = '+v).join('\n')}${e.length?'\n':''}\n`+S.ppTop.map(o=>`[${o.sec}]\n${o.lines.join('\n')}\n\n`).join('')};
function filesRaw(){const by={};Object.keys(S.profiles).forEach(n=>(by[ppath(n)]=by[ppath(n)]||[]).push(n));
 const out=[],dp=fx('Default'),blank=!Object.keys(dp.pr).length&&![dp.im,dp.ex,dp.ig,dp.inc,dp.par,dp.cx].some(a=>a.length)&&!dp.um&&dp.ia==null&&dp.ea==null;
 let t=`[Folder.Config]\n${['Profile = '+S.cur,...(S.pl!=null?['PriorityLimit = '+S.pl]:[]),...S.fcl].join('\n')}\n\n`;
 S.topSecs.forEach(o=>t+=`[${o.sec}]\n${o.lines.join('\n')}${o.lines.length?'\n':''}\n`);
 (by[S.main]||[]).filter(n=>n!=='Default'||S.defInFile||!blank).sort().forEach(n=>t+=profIni(n));
 out.push([S.main,t]);
 Object.keys(by).filter(p=>p!==S.main).sort().forEach(p=>out.push([p,by[p].sort().map(profIni).join('')]));
 if(S.bcSeen||S.bcDirty)out.push(['.data/config.ini',bcText()]);
 if(S.ppSeen||S.ppDirty)out.push(['.data/plugins/plugins.ini',ppText()]);
 return out}
var _fc=null;function files(){if(_fc)return _fc;_fc=filesRaw();queueMicrotask(()=>{_fc=null});return _fc}
const pendTxt=()=>{const n=files().filter(([p,t])=>written[p]!==t).length;return n?` · ${n} unsaved change${n===1?'':'s'}`:' · all changes saved'};
/* "Make current" is a normal step in the header Undo / Redo history; undoing or redoing it rewrites modloader.ini too */
async function syncCur(){SAVEHOLD=true;let ok;try{ok=await commit(S.main,'')}finally{SAVEHOLD=false}render();if(ok!==false)toast(`Current profile is ${S.cur}${pendTxt()}`)}
$('#setcur').onclick=()=>{SAVEHOLD=true;S.cur=S.active;render();syncCur()};
$('#save').onclick=async()=>{const b=$('#save');if(b.disabled)return;b.disabled=true;
 try{
  let c=0;for(const[path,t]of files())if(written[path]!==t){await writeFile(path,t);written[path]=t;c++}
  Object.keys(S.profiles).forEach(n=>{if(!src[n])src[n]={path:ppath(n)}});
  toast(c?`Saved ${c} file${c>1?'s':''}`:'Nothing to save')}
 catch(e){toast('Saving failed: '+e.message)}
 finally{render()}};
async function probeLog(){if(!root||!await canWrite())return;let g=null;try{const fh=await root.getFileHandle('modloader.log');g=()=>fh.getFile()}catch(e){}
 if(!!g!==!!logGet){logGet=g;render()}else if(g)logGet=g}
window.addEventListener('focus',probeLog);
const welcome=m=>{if(m)$('#welcp').textContent=m;try{if(!$('#welc').open)$('#welc').showModal()}catch(e){}pick()};
$('#welcgo').onclick=()=>pick();
async function restore(){
 let cands=S.installs.slice();
 if(!cands.length){try{const o=await idb('get','root');if(o){const g=o.game||null,r=o.root||null,main=g||r,inst={id:'legacy',name:main.name,gpathUser:''};
  S.installs.push(inst);await idb('put','legacy',{root:r,game:g});S.curInst='legacy';cands=[inst]}}catch(e){}}
 if(!cands.length)return welcome();
 cands.sort((a,b)=>(b.id===S.curInst)-(a.id===S.curInst));
 for(const i of cands){let o=null;try{o=await idb('get',i.id)}catch(e){}if(!o)continue;
  S.curInst=i.id;root=o.root||null;game=o.game||null;
  try{await openStored();return}catch(e){continue}}
 welcome('Couldn’t find the saved GTA folder anymore. Select your GTA San Andreas folder again.')}
