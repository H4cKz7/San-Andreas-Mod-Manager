/* SA Mod Manager - 35-bisect.js: Bisect helper, finds the mod that crashes the game by launching with half of the mods */
/* Classic script: loaded in order by index.html, shares globals with the other files. */
/* SAMM-FEATURES. Uses the same -nomods / -mod launch arguments as "Launch with only some mods", so no file is ever changed.
   The game is launched, the user answers "did it crash?", and the list of suspects is halved until one mod is left. */
var BS={run:false,n:0};
const bsCands=()=>{E=eff();return S.mods.filter(m=>swOn(m.name)&&!exOther(m.name)).map(m=>m.name)};
const bsArgs=names=>names.length?names.map(n=>{const pe=E.pr[n.toLowerCase()];return '-mod '+lq(n+(pe?'='+prio(n):''))}).join(' '):'-nomods';
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
 const c=bsCands();
 if(!c.length)return bsEnd('No mods are turned on','There is nothing to test in the modloader folder with this profile. '+BS_OUT,true);
 if(!await ask({title:'Find the crashing mod',text:'Bisect launches the game several times, each time with only half of the suspect mods, and asks you whether it crashed. It narrows the list down until one mod is left.\n\nNothing in your profile or files is changed. Only the '+c.length+' mod'+(c.length===1?'':'s')+' that are turned on are tested. It works best when the crash happens every time.',ok:'Start'}))return;
 BS.run=true;BS.n=0;
 const stop=()=>toast('Bisect stopped');
 try{
  let r=await bsTest('','Launching with your normal setup, to check that the crash happens.');
  if(!r)return stop();
  if(r==='ok')return bsEnd('Couldn’t make it crash','The game did not crash with your normal setup, so there is nothing to narrow down. If it only crashes sometimes, start Bisect again right after it has crashed.');
  r=await bsTest('-nomods','Launching with every mod in the modloader folder turned off.');
  if(!r)return stop();
  if(r==='crash')return bsEnd('Not caused by a mod','The game also crashes with all mods turned off. '+BS_OUT,true);
  let sus=c.slice(),sure=sus.length===1;
  while(sus.length>1){
   const h=Math.ceil(sus.length/2),A=sus.slice(0,h),B=sus.slice(h);
   r=await bsTest(bsArgs(A),'Testing '+A.length+' of the '+sus.length+' remaining suspects.');
   if(!r)return stop();
   if(r==='crash'){sus=A;if(A.length===1)sure=true}else sus=B}
  const x=sus[0];
  if(!sure){
   r=await bsTest(bsArgs([x]),'Testing “'+x+'” on its own.');
   if(!r)return stop();
   sure=r==='crash'}
  const rest=c.filter(n=>n!==x);
  if(sure){
   const rs=await ask({title:'Found it: “'+x+'”',text:'The game crashes with “'+x+'” on its own, and not with all mods turned off.\n\nTry updating or reinstalling it, check its readme for requirements, or turn it off in this profile (IgnoreMods).',ok:'Done',alt:'Launch without it',info:true});
   if(rs==='alt')await bsLaunch(bsArgs(rest));
   return}
  r=await bsTest(bsArgs(rest),'“'+x+'” does not crash on its own. Testing every mod except “'+x+'”.');
  if(!r)return stop();
  if(r==='ok')return bsEnd('“'+x+'” is involved, but not alone','The game crashes with all mods, and not without “'+x+'”, but “'+x+'” alone is fine. It probably needs another mod to be installed, or it clashes with one. Check its readme for requirements.');
  return bsEnd('No single mod found','The game still crashes without “'+x+'”, so more than one mod may be involved, or the problem is somewhere else. '+BS_OUT,true)}
 finally{BS.run=false}}
$('#launchm').addEventListener('click',e=>{if(!e.target.closest('[data-bs]'))return;lmOpenMenu(false);bisectStart()});
