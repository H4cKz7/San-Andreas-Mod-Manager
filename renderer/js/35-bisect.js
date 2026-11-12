/* SA Mod Manager - 35-bisect.js: Bisect helper, finds the mod that crashes the game by launching with half of the mods */
/* Classic script: loaded in order by index.html, shares globals with the other files. */
/* SAMM-FEATURES. Uses the same -nomods / -mod launch arguments as "Launch with only some mods", so no file is ever changed.
   The game is launched, the user answers "did it crash?", and the list of suspects is halved until one mod is left. */
var BS={run:false,n:0,ess:true,off:new Set(),j:null,keep:[]};
/* SAMM-KEEP: mod folders that stay on during every test. Remembered between runs (names of mods that are not turned on right now are remembered too). */
try{const a=JSON.parse(localStorage.getItem('samm-bisect-keep')||'[]');if(Array.isArray(a))BS.keep=a.filter(x=>typeof x==='string')}catch(e){}
const bsSaveKeep=()=>{try{localStorage.setItem('samm-bisect-keep',JSON.stringify(BS.keep))}catch(e){}};
const bsCands=()=>{E=eff();return S.mods.filter(m=>swOn(m.name)&&!exOther(m.name)).map(m=>m.name)};
const bsArgs=names=>names.length?names.map(n=>{const pe=E.pr[n.toLowerCase()];return '-mod '+lq(n+(pe?'='+prio(n):''))}).join(' '):'-nomods';
/* Essentials pack plugins (ids from ESSENTIALS in 25-checker.js). A mod whose files include one of these is kept on when the checkbox is ticked. */
const bsEssFiles=()=>{const ids=['rundll','silentpatch','repairgta','windowed','fv','wsfix'];return ESSENTIALS.filter(x=>ids.includes(x.id)).map(x=>x.file.toLowerCase())};
const bsIsEss=(n,fl)=>{const m=S.mods.find(x=>x.name===n);return !!m&&(m.files||[]).some(f=>fl.includes(String(f).split('/').pop().toLowerCase()))};
/* Essentials plugins Bisect can move out of their mod folder into <modloader>/bisect/<dir>/ . The "bisect" folder is passed to every test launch, so they stay loaded. */
const BS_PL=[
 {id:'fv',dir:'FramerateVigilante',asi:'FramerateVigilante.SA.asi',ini:'FramerateVigilante.ini'},
 {id:'repairgta',dir:'RepairGTA',asi:'RepairGTA.SA.asi'},
 {id:'rundll',dir:'rundll32exefix',asi:'rundll32exefix.asi'},
 {id:'silentpatch',dir:'SilentPatchSA',asi:'SilentPatchSA.asi',ini:'SilentPatchSA.ini'},
 {id:'wsfix',dir:'GTASA.WidescreenFix',asi:'GTASA.WidescreenFix.asi',ini:'GTASA.WidescreenFix.ini'},
 {id:'windowed',dir:'III.VC.SA.WindowedMode',asi:'III.VC.SA.WindowedMode.asi',ini:'III.VC.SA.WindowedMode.ini'}];
const bsTempDir=()=>root&&root._path?pathN.join(root._path,'bisect'):'';
/* finds each plugin (and its .ini next to it) in the turned-on mods: {id,pl,mod,asiRel,iniRel,t:file name,s:small text} */
function bsFind(names){const out=[];if(!root||!root._path)return out;
 for(const pl of BS_PL){let hit=null;
  for(const n of names){const m=S.mods.find(x=>x.name===n);if(!m)continue;const fs2=m.files||[];
   const a=fs2.find(f=>String(f).split('/').pop().toLowerCase()===pl.asi.toLowerCase());
   if(a){const pre=String(a).slice(0,String(a).length-pl.asi.length),i=pl.ini&&fs2.find(f=>String(f).toLowerCase()===(pre+pl.ini).toLowerCase());
    hit={id:pl.id,pl,mod:n,asiRel:String(a),iniRel:i?String(i):'',t:pl.asi,s:(i?'+ ini · ':'')+n};break}}
  if(hit)out.push(hit)}
 return out}
const bsMv=(a,b)=>{try{fsN.renameSync(a,b)}catch(e){if(e.code!=='EXDEV')throw e;fsN.copyFileSync(a,b);fsN.unlinkSync(a)}};
const bsSaveJ=j=>{try{localStorage.setItem('samm-bisect-moves',JSON.stringify(j))}catch(e){}};
/* puts every moved file back, brings home the files the plugins created in their temp folders (RepairGTA.log and so on, an existing file is replaced)
   and deletes the temp "bisect" folder. Returns how many files could not be put back (the journal and the folder are kept then). */
const bsPut=(a,b)=>{try{fsN.renameSync(a,b)}catch(e){fsN.copyFileSync(a,b);fsN.unlinkSync(a)}};
function bsBack(src,dst){let bad=0;
 try{if(fsN.statSync(src).isDirectory()){fsN.mkdirSync(dst,{recursive:true});for(const e of fsN.readdirSync(src))bad+=bsBack(pathN.join(src,e),pathN.join(dst,e));try{fsN.rmdirSync(src)}catch(e){}}
  else{fsN.mkdirSync(pathN.dirname(dst),{recursive:true});bsPut(src,dst)}}
 catch(e){bad++}
 return bad}
function bsRestore(j){j=j||BS.j;if(!j)return 0;let bad=0;
 const dirs=new Map();/* temp folder -> the folder its plugin came from */
 for(const m of j.moves)dirs.set(pathN.dirname(m.to),pathN.dirname(m.from));
 for(const m of j.moves.slice().reverse()){try{if(fsN.existsSync(m.to)){if(fsN.existsSync(m.from)){bad++;continue}fsN.mkdirSync(pathN.dirname(m.from),{recursive:true});bsMv(m.to,m.from)}}catch(e){bad++}}
 /* anything else left in a plugin's temp folder was created by the plugin while the game ran: it goes back to where the plugin came from */
 for(const [tmp,orig] of dirs){try{if(!fsN.existsSync(tmp))continue;for(const f of fsN.readdirSync(tmp))bad+=bsBack(pathN.join(tmp,f),pathN.join(orig,f))}catch(e){bad++}}
 if(!bad){
  /* only our own folder is ever deleted: it must be called "bisect" and every journal entry must point inside it */
  const safe=pathN.isAbsolute(j.base)&&pathN.basename(j.base).toLowerCase()==='bisect'&&j.moves.every(m=>String(m.to).startsWith(j.base));
  if(safe){try{fsN.rmSync(j.base,{recursive:true,force:true})}catch(e){}}
  try{localStorage.removeItem('samm-bisect-moves')}catch(e){}if(BS.j===j)BS.j=null}
 return bad}
function bsMoveOut(sel){const base=bsTempDir();if(!base)return 'The modloader folder path is not known.';
 if(fsN.existsSync(base))return 'There is already a “bisect” folder in your modloader folder. Rename or remove it, then start Bisect again.';
 const j={base,moves:[]};BS.j=j;bsSaveJ(j);
 try{for(const x of sel){const dst=pathN.join(base,x.pl.dir);fsN.mkdirSync(dst,{recursive:true});
   for(const rel of [x.asiRel,x.iniRel]){if(!rel)continue;const from=pathN.join(root._path,x.mod,...rel.split('/')),to=pathN.join(dst,pathN.basename(from));
    if(fsN.existsSync(to))throw new Error('“'+pathN.basename(to)+'” already exists in the temporary folder');
    bsMv(from,to);j.moves.push({from,to});bsSaveJ(j)}}}
 catch(e){bsRestore(j);return 'The Essentials plugins could not be moved: '+String(e&&e.message||e)}
 return ''}
const BS_OUT='Nothing in the modloader folder explains the crash. Look at the GTA root folder (.asi and .dll files, gta_sa.exe), the cleo folder and the scripts folder. They load without Mod Loader, so profiles cannot turn them off. Try removing the newest plugins or scripts from those folders.';
async function bsLaunch(args){
 const p=exePath();if(!p){toast('gta_sa.exe was not found in the game folder');return false}
 if(args.length>7000){notice('Too many mods for one launch','The launch command would be too long for Windows. Turn some mods off in this profile and start again.');return false}
 const nat=window.__native;
 if(nat.gameRunning){for(let i=0;i<6&&await nat.gameRunning(pathN.basename(p));i++){
  if(!await ask({title:'Close the game first',text:'The game is still running (a crash window may be open). Close it, then continue.',ok:'I closed it'}))return false}}
 const r=await nat.launch(p,args);if(r===true)return true;
 notice('Couldn’t launch the game',String(r));return false}
async function bsAsk(what,extra){
 const r=await ask({title:'Bisect: test '+(++BS.n),text:what+(extra?'\n'+extra:'')+'\n\nLet the game start (or crash), then close it and answer. Did it crash or freeze?',ok:'It crashed',alt:'It didn’t crash'});
 return r==='alt'?'ok':r?'crash':null}
const bsTest=async(args,what,extra)=>await bsLaunch(args)?bsAsk(what,extra):null;
async function bsEnd(title,text,rootBtn){
 const rs=await ask({title,text,ok:rootBtn?'Open Root scripts':'Done',alt:rootBtn?'Close':undefined,info:true});
 if(rootBtn&&rs&&rs!=='alt'){const b=$('#rootb');if(b&&!b.disabled)b.click()}}
async function bisectStart(){
 if(BS.run)return;
 if(!root)return notice('Mod Loader folder needed','Bisect tests the mods in the modloader folder. Scan a GTA folder that has one first.');
 if(!exePath())return toast('gta_sa.exe was not found in the game folder');
 if(files().filter(([q,t])=>written[q]!==t).length)return notice('Save your changes first','Bisect launches the game with your saved setup. Save or undo the pending changes, then start again.');
 const all=bsCands();
 if(!all.length)return bsEnd('No mods are turned on','There is nothing to test in the modloader folder with this profile. '+BS_OUT,true);
 /* SAMM-KEEP: found = Essentials plugins inside the turned-on mods, kl = the mod folders the person can keep on */
 const found=bsFind(all),kl=all.map(n=>{const m=S.mods.find(x=>x.name===n),c=m&&m.files?m.files.length:0;return{id:n,t:n,s:c?c+' file'+(c===1?'':'s'):''}});
 if(!await ask({title:'Find the crashing mod',text:'Bisect launches the game several times, each time with only half of the suspect mods, and asks you whether it crashed. It narrows the list down until one mod is left.\n\nNothing in your profile is changed. The Essentials plugin files ticked below are moved to a temporary “bisect” folder inside modloader while Bisect runs, and put back afterwards. Only the '+all.length+' mod'+(all.length===1?'':'s')+' that are turned on are tested. Folders you keep on below are not tested, they stay loaded in every launch. It works best when the crash happens every time.',ok:'Start',
   keep:{label:'Keep these mod folders on during all tests',list:kl,value:BS.keep},
   check:{label:'Keep Essentials plugins on during the tests',list:found.map(x=>({id:x.id,m:x.mod,t:x.t,s:x.s,on:!BS.off.has(x.id)})),value:BS.ess}}))return;
 /* read everything out of ask() now: a later ask() call resets ask.items and ask.kept */
 BS.ess=ask.checked;BS.keep=ask.kept.concat(BS.keep.filter(n=>!all.includes(n)));bsSaveKeep();
 const kept=ask.kept.slice(),sel=BS.ess?found.filter(x=>ask.items.includes(x.id)):[],keep=(sel.length?['bisect']:[]).concat(kept),c=all.filter(n=>!kept.includes(n));
 if(BS.ess)BS.off=new Set(found.filter(x=>!ask.items.includes(x.id)&&!kept.includes(x.mod)).map(x=>x.id));
 if(!c.length)return bsEnd('Nothing left to test','Every mod that is turned on is in a kept folder, so there is nothing to narrow down. Untick at least one folder under “Keep these mod folders on during all tests”.');
 const kn=kept.map(n=>'“'+n+'”').join(', '),one=kept.length===1,
  ex=[].concat(sel.length?['the Essentials plugins (moved to the “bisect” folder)']:[],kept.length?[(one?'the kept folder ':'the kept folders ')+kn]:[]).join(' and ');
 /* every turned-on mod outside the kept folders stays a suspect; the ticked Essentials plugins are moved out of their folders instead (see bsMoveOut) */
 BS.run=true;BS.n=0;
 const stop=()=>toast('Bisect stopped');
 try{
  let r=await bsTest('','Launching with your normal setup, to check that the crash happens.');
  if(!r)return stop();
  if(r==='ok')return bsEnd('Couldn’t make it crash','The game did not crash with your normal setup, so there is nothing to narrow down. If it only crashes sometimes, start Bisect again right after it has crashed.');
  if(sel.length){const em=bsMoveOut(sel);if(em)return bsEnd('Couldn’t move the Essentials plugins',em)}
  r=await bsTest(bsArgs(keep),'Launching with every mod in the modloader folder turned off'+(ex?' (except '+ex+')':'')+'.');
  if(!r)return stop();
  if(r==='crash')return kept.length
   ?bsEnd('Not caused by the tested mods','The game also crashes with all the other mods turned off and only '+kn+' left on. Run Bisect again without keeping '+(one?'that folder':'those folders')+' to see whether '+(one?'it is':'one of them is')+' the cause. If it still crashes then, look outside the modloader folder: the GTA root folder (.asi and .dll files, gta_sa.exe), the cleo folder and the scripts folder.',true)
   :bsEnd('Not caused by a mod','The game also crashes with all mods turned off. '+BS_OUT,true);
  let sus=c.slice(),sure=sus.length===1;
  while(sus.length>1){
   const h=Math.ceil(sus.length/2),A=sus.slice(0,h),B=sus.slice(h);
   r=await bsTest(bsArgs(keep.concat(A)),'Testing '+A.length+' of the '+sus.length+' remaining suspects.');
   if(!r)return stop();
   if(r==='crash'){sus=A;if(A.length===1)sure=true}else sus=B}
  const x=sus[0];
  if(!sure){
   r=await bsTest(bsArgs(keep.concat([x])),'Testing “'+x+'” on its own.');
   if(!r)return stop();
   sure=r==='crash'}
  const rest=keep.concat(c.filter(n=>n!==x));
  if(sure){
   const rs=await ask({title:'Found it: “'+x+'”',text:'The game crashes with “'+x+'” on its own, and not with all mods turned off.'+(kept.length?' (The kept folders were on in both tests.)':'')+'\n\nTry updating or reinstalling it, check its readme for requirements, or turn it off in this profile (IgnoreMods).',ok:'Done',alt:'Launch without it',info:true});
   if(rs==='alt')await bsLaunch(bsArgs(rest));
   return}
  r=await bsTest(bsArgs(rest),'“'+x+'” does not crash on its own. Testing every mod except “'+x+'”.');
  if(!r)return stop();
  if(r==='ok')return bsEnd('“'+x+'” is involved, but not alone','The game crashes with all mods, and not without “'+x+'”, but “'+x+'” alone is fine. It probably needs another mod to be installed, or it clashes with one. Check its readme for requirements.');
  return bsEnd('No single mod found','The game still crashes without “'+x+'”, so more than one mod may be involved, or the problem is somewhere else. '+BS_OUT,true)}
 finally{BS.run=false;if(BS.j){const bad=bsRestore(BS.j);if(bad)notice('Some files could not be put back','Bisect could not move '+bad+' file'+(bad===1?'':'s')+' back to the original folder. They are in the “bisect” folder inside modloader. Close the game, then move them back by hand.');else if(sel.length)toast('Essentials plugins put back in their folders')}}}
$('#launchm').addEventListener('click',e=>{if(!e.target.closest('[data-bs]'))return;lmOpenMenu(false);bisectStart()});
/* safety net: put the files back if the app is closed during a test, or was killed in the middle of one last time */
addEventListener('beforeunload',()=>{if(BS.j)bsRestore(BS.j)});
setTimeout(()=>{try{const j=JSON.parse(localStorage.getItem('samm-bisect-moves')||'null');if(!j||!j.moves||BS.run)return;
 const bad=bsRestore(j);toast(bad?'Bisect was interrupted and '+bad+' file(s) are still in modloader/bisect':'Bisect was interrupted last time. Essentials plugin files were put back in their folders')}catch(e){}},3000);
