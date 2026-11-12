/* SA Mod Manager - updater.js: checks GitHub Releases and downloads updates (main process). */
/* It never asks anything itself: the questions are shown by the page (renderer/js/30-updater.js). */
/* Installed (NSIS) build: electron-updater downloads the installer from the release.             */
/* Portable build: cannot self-update, so it reads the same latest.yml (a plain download, no API rate limit),    */
/* reports the new version and opens the release page.                                                          */
const{app,ipcMain,net,shell}=require('electron');
const OWNER='H4cKz7',REPO='San-Andreas-Mod-Manager';
const RELEASES='https://github.com/'+OWNER+'/'+REPO+'/releases/latest';
const YML='https://github.com/'+OWNER+'/'+REPO+'/releases/latest/download/latest.yml';
const portable=!!process.env.PORTABLE_EXECUTABLE_FILE;
let win=null,au=null,busy=false;
const st={phase:'idle',version:'',pct:0,notes:'',url:RELEASES};
const pub=()=>({phase:st.phase,version:st.version,pct:st.pct,notes:st.notes,portable,current:app.getVersion()});
const push=()=>{if(win&&!win.isDestroyed())win.webContents.send('upd-state',pub())};
const to=(phase,extra)=>{st.phase=phase;if(extra)Object.assign(st,extra);push()};

const nums=v=>String(v||'').replace(/^v/i,'').split(/[-+]/)[0].split('.').map(n=>parseInt(n,10)||0);
const newer=(a,b)=>{const x=nums(a),y=nums(b);for(let i=0;i<3;i++){const d=(x[i]||0)-(y[i]||0);if(d)return d>0}return false};
const plain=n=>{if(Array.isArray(n))n=n.map(x=>(x&&x.note)||'').join('\n\n');
  return String(n||'').replace(/<[^>]+>/g,'').replace(/\r/g,'').replace(/[#*\x60]/g,'').replace(/\n{3,}/g,'\n\n').trim().slice(0,700)};
const errText=e=>{const m=String((e&&e.message)||e||'Unknown error').split('\n')[0];
  if(/\b404\b|Cannot find/i.test(m))return'No release was found on GitHub yet.';
  if(/\b(403|429)\b/.test(m))return'GitHub is limiting requests right now. Try again later.';
  return /ENOTFOUND|ECONNREFUSED|ECONNRESET|ETIMEDOUT|ERR_INTERNET|ERR_NETWORK|ERR_NAME|ERR_CONNECTION/i.test(m)?'Couldn’t reach GitHub. Check your internet connection.':m.slice(0,200)};

function engine(){if(au)return au;
  au=require('electron-updater').autoUpdater;
  au.autoDownload=false;            /* the page asks first */
  au.autoInstallOnAppQuit=true;     /* only matters once the user chose to download: it then installs when the app is closed */
  au.allowPrerelease=false;
  au.on('download-progress',p=>{st.pct=Math.round(p.percent||0);push()});
  return au}

async function lookup(){
  if(portable){
    const r=await net.fetch(YML,{headers:{'User-Agent':'SA-Mod-Manager'}});
    if(!r.ok)throw new Error('GitHub answered '+r.status);
    const m=/^version:\s*['"]?([^\s'"]+)/m.exec(await r.text());
    if(!m)throw new Error('latest.yml has no version');
    return{version:m[1],notes:'',url:RELEASES}}
  const res=await engine().checkForUpdates();
  const i=res&&res.updateInfo;if(!i)throw new Error('No update information was returned');
  return{version:i.version,notes:plain(i.releaseNotes),url:RELEASES}}

/* looks for a newer release; never shows anything */
async function check(){
  if(!app.isPackaged)return{status:'dev'};
  if(busy||st.phase==='downloading'||st.phase==='checking')return{status:'busy'};
  if(st.phase==='available'||st.phase==='ready')return Object.assign({status:st.phase},pub());
  busy=true;
  try{
    to('checking');
    const r=await lookup();
    if(!newer(r.version,app.getVersion())){to('idle');return{status:'current',version:app.getVersion()}}
    to('available',{version:r.version,notes:r.notes,url:r.url});
    return Object.assign({status:'available'},pub())}
  catch(e){to('idle');return{status:'error',message:errText(e)}}
  finally{busy=false}}

async function download(){
  if(portable||!app.isPackaged)return{status:'error',message:'This build can’t install updates by itself.'};
  if(busy||st.phase!=='available')return{status:'error',message:'There is no update waiting to be downloaded.'};
  busy=true;
  try{
    to('downloading',{pct:0});
    await engine().downloadUpdate();
    to('ready',{pct:100});
    return Object.assign({status:'ready'},pub())}
  catch(e){to('available');return{status:'error',message:errText(e)}}
  finally{busy=false}}

function init(w){
  win=w;
  ipcMain.handle('upd-check',()=>check());
  ipcMain.handle('upd-state',()=>pub());
  ipcMain.handle('upd-download',()=>download());
  ipcMain.handle('upd-install',()=>{if(st.phase!=='ready')return false;setImmediate(()=>engine().quitAndInstall(false,true));return true});
  ipcMain.handle('upd-open',()=>{if(/^https:\/\/github\.com\//.test(st.url))shell.openExternal(st.url);return true});
  /* one silent check shortly after start; the page only shows a dot on the button if something is found */
  w.webContents.once('did-finish-load',()=>setTimeout(()=>{check().catch(()=>{})},4000))}
module.exports={init};
