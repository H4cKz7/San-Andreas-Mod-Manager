/* SA Mod Manager - 30-updater.js: Update button in the title bar (GitHub releases) */
/* Classic script: loaded in order by index.html, shares globals with the other files. */
/* Checking and downloading run in updater.js (main process); the questions use the app's own ask() dialog. */
WI.upd='<path d="M8 2.4v7.3M4.9 6.9L8 10l3.1-3.1M3 13.2h10"/>';
const UPD={s:{phase:'idle',version:'',pct:0,notes:'',portable:false,current:''},busy:false,told:false,
 ui(s){if(s)this.s=s;const{phase,version,pct}=this.s,b=$('#wupd');
  const t={available:'Update available: v'+version,downloading:'Downloading update… '+pct+'%',ready:'Update v'+version+' is ready to install',checking:'Checking for updates…'}[phase]||'Check for updates';
  b.title=t;b.setAttribute('aria-label',t);
  b.classList.toggle('has',phase==='available'||phase==='ready');
  b.classList.toggle('busy',phase==='checking'||phase==='downloading');
  if(phase==='available'&&!this.told&&!this.busy){this.told=true;toast('Update v'+version+' is available. Click the update button to install it')}},
 note(n){let t=String(n&&typeof n==='object'?(n.note||n.notes||n.body||''):n||'').replace(/\r\n?/g,'\n');if(t.indexOf('\n')<0)t=t.replace(/\\r\\n|\\n/g,'\n');return t.trim().slice(0,1500)},
 report(r){if(!r)return;
  const m={current:'You’re up to date (v'+(r.version||'')+')',dev:'Updates only work in the installed app, not when running from source',
   busy:'An update check or download is already running',error:'Update failed: '+(r.message||'unknown error')}[r.status];
  if(m)toast(m)},
 async offer(s){const n=this.note(s.notes),head='SA Mod Manager v'+s.version+' is available (you have v'+s.current+').',
   foot=s.portable?'You are using the portable version, so the new build has to be downloaded and swapped in by hand.':'It will be downloaded now. You will be asked again before it is installed.';
  let html='';try{if(typeof RN!=='undefined')html=RN.dialog(head,s.md||s.notes,foot)}catch(e){html='';console.error('Release notes could not be rendered:',e)}
  const ok=await ask(Object.assign({title:'Update available',ok:s.portable?'Open download page':'Download'},html?{html}:{text:head+(n?'\n\n'+n:'')+'\n\n'+foot}));
  if(!ok)return;
  if(s.portable){window.__native.updOpen();return}
  const r=await window.__native.updDownload();
  if(r.status!=='ready')return this.report(r);
  await this.install(r)},
 async install(s){
  const ok=await ask({title:'Ready to install',ok:'Restart and install',
   text:'SA Mod Manager v'+s.version+' has been downloaded. The app will close, install the update and start again. Unsaved profile changes will be lost.\n\nCancel if you need to save first, then click the update button again. Otherwise it is installed automatically when you close the app.'});
  if(ok)window.__native.updInstall()},
 async click(){const s=this.s;
  if(s.phase==='downloading')return toast('Downloading update… '+s.pct+'%');
  if(this.busy)return;this.busy=true;
  try{
   if(s.phase==='ready')await this.install(s);
   else{const r=await window.__native.updCheck(true);
    if(r.status==='available')await this.offer(r);
    else if(r.status==='ready')await this.install(r);
    else this.report(r)}}
  catch(e){toast('Update check failed: '+e.message)}
  this.busy=false}};
$('#wupd').innerHTML=wi(WI.upd);
$('#wupd').onclick=()=>UPD.click();
if(window.__native.onUpdate){window.__native.onUpdate(s=>UPD.ui(s));window.__native.updState().then(s=>UPD.ui(s)).catch(()=>{})}
