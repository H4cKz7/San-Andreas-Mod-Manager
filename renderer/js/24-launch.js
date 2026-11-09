/* SA Mod Manager - 24-launch.js: Launch Game button and launch options */
/* Classic script: loaded in order by index.html, shares globals with the other files. */
/* ---- Launch Game ---- */
const exePath=()=>{const gd=gameDir();if(!gd)return'';const n=S.exes.find(x=>/^gta_sa\.exe$/i.test(x))||'gta_sa.exe',p=pathN.join(gd,n);return fsN.existsSync(p)?p:''};
const canLaunch=()=>!!(root||game)&&!!exePath();
/* ---- Launch Game: plain launch, no mods, or only some mods (same arguments as the shortcut) ---- */
async function doLaunch(args){const p=exePath();if(!p)return toast('gta_sa.exe was not found in the game folder');
 if(!args){const pend=files().filter(([q,t])=>written[q]!==t).length;
  if(pend&&!await ask({title:'You have unsaved changes',text:'The game reads the saved files, so those changes will not apply. Launch anyway?',ok:'Launch'}))return}
 const r=await window.__native.launch(p,args||'');
 if(r===true)toast('Launching '+pathN.basename(p)+(args==='-nomods'?' without mods':args?' with selected mods':'')+'…');
 else notice('Couldn’t launch the game',String(r))}
$('#launch').onclick=()=>doLaunch('');
const lq=v=>/[\s"]/.test(v)?'"'+v.replace(/"/g,'\\"')+'"':v;
const LM={sel:new Map()};
const lmOpenMenu=o=>{$('#launchm').hidden=!o;$('#launchmore').setAttribute('aria-expanded',String(o))};
$('#launchmore').onclick=()=>lmOpenMenu($('#launchm').hidden);
document.addEventListener('click',e=>{if(!e.target.closest('#launchd'))lmOpenMenu(false)});
document.addEventListener('keydown',e=>{if(e.key==='Escape')lmOpenMenu(false)});
function lmStat(){const n=LM.sel.size;$('#lmcnt').textContent=n?n+' mod'+(n===1?'':'s')+' selected':'Tick at least one mod.';$('#lmgo').disabled=!n}
function lmDraw(){const names=new Set(S.mods.map(m=>m.name));[...LM.sel.keys()].forEach(k=>{if(!names.has(k))LM.sel.delete(k)});
 const q=$('#lmq').value.trim().toLowerCase();
 const ms=S.mods.slice().sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true,sensitivity:'base'})).filter(m=>!q||m.name.toLowerCase().includes(q));
 $('#lmlist').innerHTML=ms.map(m=>{const on=LM.sel.has(m.name),pr=on?LM.sel.get(m.name):'';
  return '<label class="cutrow"><input type="checkbox" data-n="'+esc(m.name)+'"'+(on?' checked':'')+'><span class="nm">'+esc(m.name)+'</span><input type="number" min="0" placeholder="prio" data-p="'+esc(m.name)+'" value="'+esc(pr)+'"></label>'}).join('')||'<div class="stats" style="padding:8px 10px">No mods</div>';
 lmStat()}
$('#lmq').oninput=lmDraw;
$('#lmlist').addEventListener('change',e=>{const t=e.target,n=t.dataset.n;if(n==null)return;
 if(t.checked)LM.sel.set(n,t.closest('.cutrow').querySelector('input[type=number]').value.trim());else LM.sel.delete(n);lmStat()});
$('#lmlist').addEventListener('input',e=>{const t=e.target,n=t.dataset.p;if(n==null)return;const v=t.value.trim();
 if(v!==''||LM.sel.has(n)){LM.sel.set(n,v);t.closest('.cutrow').querySelector('input[type=checkbox]').checked=true;lmStat()}});
$('#launchm').onclick=e=>{const it=e.target.closest('[data-l]');if(!it)return;lmOpenMenu(false);
 if(it.dataset.l==='none')doLaunch('-nomods');
 else{$('#lmq').value='';lmDraw();$('#lmd').showModal()}};
$('#lmx').onclick=()=>$('#lmd').close();
$('#lmgo').onclick=()=>{const a=[],names=new Set(S.mods.map(m=>m.name));
 LM.sel.forEach((pr,n)=>{if(names.has(n))a.push('-mod',lq(n+(pr!==''?'='+pr:'')))});
 if(!a.length)return;$('#lmd').close();doLaunch(a.join(' '))};
