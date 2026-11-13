const{app,BrowserWindow,Menu,dialog,ipcMain,shell,clipboard,screen}=require('electron');
const path=require('path'),fs=require('fs');
const{spawn,execFile}=require('child_process');
const os=require('os');
/* launch arguments go through cmd.exe: refuse shell metacharacters outside "quotes" */
const badArgs=s=>{let q=false;for(const ch of s){if(ch==='"')q=!q;else if(!q&&/[&|<>^]/.test(ch))return true}return false};
app.setAppUserModelId('com.samm.modmanager');
/* SAMM-SINGLE-INSTANCE: only one copy may run (two copies write the same config / localStorage / window-state files).
   A second launch quits straight away and the first window is brought to the front with a short message. */
const gotLock=app.requestSingleInstanceLock();
let mainWin=null;
if(!gotLock)app.quit();
else app.on('second-instance',()=>{
  const w=mainWin;if(!w||w.isDestroyed())return;
  if(w.isMinimized())w.restore();if(!w.isVisible())w.show();w.focus();
  w.webContents.executeJavaScript("typeof toast==='function'&&toast('SA Mod Manager is already running')").catch(()=>{})});
ipcMain.on('user-data',e=>{e.returnValue=app.getPath('userData')});
/* gta_sa.set lives in Documents\GTA San Andreas User Files; Electron asks Windows, so a moved / OneDrive Documents folder works too */
ipcMain.on('docs-path',e=>{let p='';try{p=app.getPath('documents')}catch(err){}e.returnValue=p});
ipcMain.on('win',(e,c)=>{const w=BrowserWindow.fromWebContents(e.sender);if(!w)return;if(c==='min')w.minimize();else if(c==='max')w.isMaximized()?w.unmaximize():w.maximize();else if(c==='close')w.close()});
ipcMain.handle('win-ismax',e=>{const w=BrowserWindow.fromWebContents(e.sender);return !!w&&w.isMaximized()});

ipcMain.on('show-item',(e,p)=>{if(typeof p==='string'&&fs.existsSync(p))shell.showItemInFolder(p)});
/* SAMM-PATCH6: clipboard, web links and "open with the default program" run here, the page cannot rely on require('electron').clipboard / .shell */
ipcMain.handle('clip-write',(e,t)=>{if(typeof t!=='string')return false;clipboard.writeText(t);return true});
ipcMain.handle('open-external',(e,u)=>{if(typeof u!=='string'||!/^https?:\/\//i.test(u))return false;shell.openExternal(u);return true});
ipcMain.handle('open-path',(e,p)=>typeof p==='string'&&p?shell.openPath(p):'No path given');
ipcMain.handle('launch-game',(e,exe,args)=>{try{if(typeof exe!=='string'||!fs.existsSync(exe))return'gta_sa.exe was not found';const cwd=path.dirname(exe);const extra=typeof args==='string'&&args.trim()?' '+args.trim().replace(/[\r\n]+/g,' '):'';if(badArgs(extra))return'The launch arguments contain characters that are not allowed.';let c;
  if(process.platform==='win32')c=spawn('cmd.exe',['/d','/s','/c','start "" /D "'+cwd+'" "'+exe+'"'+extra],{cwd,detached:true,stdio:'ignore',windowsHide:true,windowsVerbatimArguments:true});
  else c=spawn(exe,[],{cwd,detached:true,stdio:'ignore'});
  c.on('error',()=>{});c.unref();return true}catch(err){return String(err.message||err)}});
/* SAMM-FEATURES: is the game still running? (Bisect asks before every launch) */
ipcMain.handle('game-running',(e,name)=>new Promise(res=>{
  if(process.platform!=='win32'||typeof name!=='string'||!/^[\w.\- ]+\.exe$/i.test(name))return res(false);
  execFile('tasklist',['/FI','IMAGENAME eq '+name,'/NH','/FO','CSV'],{windowsHide:true},(err,out)=>res(!err&&String(out).toLowerCase().includes('"'+name.toLowerCase()+'"')))}));
/* SAMM-MODINFO: newest release (or, without releases, newest tag) of a GitHub repository, for the update check on mods */
ipcMain.handle('mod-latest',async(e,owner,repo)=>{
  if(typeof owner!=='string'||typeof repo!=='string'||!/^[\w.-]+$/.test(owner)||!/^[\w.-]+$/.test(repo))return{error:'That is not a valid GitHub repository.'};
  const{net}=require('electron'),base='https://api.github.com/repos/'+owner+'/'+repo,H={'User-Agent':'SA-Mod-Manager','Accept':'application/vnd.github+json'};
  const limit=r=>r.status===403||r.status===429?{error:'GitHub is limiting requests right now. Try again later.',limited:true}:null;
  const get=async u=>{const c=new AbortController(),t=setTimeout(()=>c.abort(),8000);try{return await net.fetch(u,{headers:H,signal:c.signal})}finally{clearTimeout(t)}};
  try{
    let r=await get(base+'/releases/latest');
    if(r.ok){const j=await r.json();if(j&&j.tag_name)return{ok:true,tag:String(j.tag_name).slice(0,60),url:/^https:\/\/github\.com\//.test(j.html_url||'')?j.html_url:'https://github.com/'+owner+'/'+repo+'/releases'}}
    if(limit(r))return limit(r);
    if(!r.ok&&r.status!==404)return{error:'GitHub answered '+r.status+'.'};
    r=await get(base+'/tags?per_page=1');
    if(r.ok){const j=await r.json();if(Array.isArray(j)&&j[0]&&j[0].name)return{ok:true,tag:String(j[0].name).slice(0,60),url:'https://github.com/'+owner+'/'+repo+'/tags'}}
    if(limit(r))return limit(r);
    return{error:r.ok||r.status===404?'No releases or tags were found for this repository.':'GitHub answered '+r.status+'.'}}
  catch(err){return{error:String(err&&err.name)==='AbortError'?'GitHub did not answer in time.':'Couldn’t reach GitHub. Check your internet connection.'}}});
ipcMain.on('theme',(e,t)=>{const w=BrowserWindow.fromWebContents(e.sender);if(w)w.setBackgroundColor(/^#[0-9a-f]{6}$/i.test(t)?t:t==='light'?'#eef0ec':'#101311')});

ipcMain.handle('pick-folder',async e=>{const w=BrowserWindow.fromWebContents(e.sender);
  const o={title:'Select your GTA San Andreas folder',properties:['openDirectory']};const r=w?await dialog.showOpenDialog(w,o):await dialog.showOpenDialog(o);
  return r.canceled?null:r.filePaths[0];
});

/* ---- archives: .zip / .7z (and other 7-Zip formats) through 7za, .rar through node-unrar-js; both handle passwords ---- */
const TMPS=new Set();
const rmTmp=d=>{if(TMPS.has(d)){TMPS.delete(d);try{fs.rmSync(d,{recursive:true,force:true})}catch(e){}}};
app.on('quit',()=>[...TMPS].forEach(rmTmp));
const magic=p=>{let fd;try{fd=fs.openSync(p,'r');const b=Buffer.alloc(8);fs.readSync(fd,b,0,8,0);
  if(b.subarray(0,4).toString('latin1')==='Rar!')return'rar';return'other'}catch(e){return null}finally{if(fd!==undefined)try{fs.closeSync(fd)}catch(e){}}};
const sevenPath=()=>require('7zip-bin').path7za.replace('app.asar'+path.sep,'app.asar.unpacked'+path.sep);
const run7z=args=>new Promise(res=>{let out='';let c;
  try{c=spawn(sevenPath(),args,{windowsHide:true,stdio:['ignore','pipe','pipe']})}catch(e){return res({code:-1,out:'7-Zip engine missing: '+e.message})}
  c.stdout.on('data',d=>out+=d);c.stderr.on('data',d=>out+=d);
  c.on('error',e=>res({code:-1,out:String(e.message)}));c.on('close',code=>res({code,out}))});
async function extract7z(file,dest,pw){const P=pw?['-p'+pw]:[];
  const l=await run7z(['l','-slt','-sccUTF-8',...P,file]),pwRe=/password|encrypted/i;
  if(l.code===-1)return{error:l.out};
  if(l.code!==0)return pwRe.test(l.out)?{needPassword:true,wrong:!!pw}:{error:'This is not a supported archive, or it is damaged.\n'+l.out.trim().split(/\r?\n/).slice(-3).join('\n')};
  if(!pw&&/^Encrypted = \+/m.test(l.out))return{needPassword:true};
  const x=await run7z(['x',file,'-o'+dest,'-y','-bd',...P]);
  if(x.code===0||x.code===1)return{ok:true};
  if(pwRe.test(x.out))return{needPassword:true,wrong:!!pw};
  return{error:x.out.trim().split(/\r?\n/).slice(-4).join('\n')}}
async function extractRar(file,dest,pw){
  const{createExtractorFromData}=await import('node-unrar-js');let enc=false;
  const bad=e=>/password/i.test(String((e&&e.reason)||'')+' '+String((e&&e.message)||''));
  try{
    const buf=fs.readFileSync(file),data=buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength);
    const ex=await createExtractorFromData({data,password:pw||undefined});
    const L=ex.getFileList(),heads=[...(L.fileHeaders||L[1])];enc=heads.some(h=>h.flags&&h.flags.encrypted);
    if(enc&&!pw)return{needPassword:true};
    /* files are written here, one at a time, with the archive's own folder structure and the exact original names */
    const X=ex.extract();
    for(const f of(X.files||X[1])){
      const h=f.fileHeader;if(!h||(h.flags&&h.flags.directory))continue;
      let d=f.extraction;if(d&&d.data)d=d.data;
      const parts=String(h.name).replace(/\\/g,'/').split('/').filter(x=>x&&x!=='.'&&x!=='..'&&!/^[a-z]:$/i.test(x));if(!parts.length)continue;
      const out=path.join(dest,...parts);fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,d||new Uint8Array(0))}
    return{ok:true}}
  catch(e){if(bad(e)||(enc&&pw))return{needPassword:true,wrong:!!pw};return{error:'Couldn’t read the RAR archive: '+String((e&&e.message)||e)}}}
ipcMain.handle('pick-archive',async()=>{
  const r=await dialog.showOpenDialog({title:'Choose a mod archive',properties:['openFile'],filters:[{name:'Archives',extensions:['zip','rar','7z','001']},{name:'All files',extensions:['*']}]});
  return r.canceled?null:r.filePaths[0]});
/* SAMM-MULTI-INSTALL: several archives at once */
ipcMain.handle('pick-archives',async()=>{
  const r=await dialog.showOpenDialog({title:'Choose mod archives',properties:['openFile','multiSelections'],filters:[{name:'Archives',extensions:['zip','rar','7z','001']},{name:'All files',extensions:['*']}]});
  return r.canceled?null:r.filePaths});
ipcMain.handle('archive-extract',async(e,file,pw)=>{
  if(typeof file!=='string'||!fs.existsSync(file))return{error:'The archive was not found.'};
  const dest=fs.mkdtempSync(path.join(os.tmpdir(),'samm-'));TMPS.add(dest);
  try{const r=magic(file)==='rar'?await extractRar(file,dest,pw):await extract7z(file,dest,pw);
    if(r.ok)return{ok:true,dir:dest};rmTmp(dest);return r}
  catch(err){rmTmp(dest);return{error:String((err&&err.message)||err)}}});
ipcMain.handle('archive-clean',(e,d)=>{rmTmp(d);return true});
const savePath=async(e,name)=>{
  const ext=path.extname(name).slice(1)||'*';
  const r=await dialog.showSaveDialog(BrowserWindow.fromWebContents(e.sender),{
    defaultPath:path.join(app.getPath('desktop'),path.basename(String(name))),
    filters:[{name:ext.toUpperCase()+' file',extensions:[ext]}]});
  return r.canceled||!r.filePath?null:r.filePath;
};
ipcMain.handle('save-file',async(e,name,data)=>{
  const p=await savePath(e,name);if(!p)return null;
  fs.writeFileSync(p,typeof data==='string'?data:Buffer.from(data));return p;
});
ipcMain.handle('save-shortcut',async(e,name,opts)=>{
  const p=await savePath(e,name);if(!p)return null;
  return shell.writeShortcutLink(p,'create',opts)?p:false;
});

function winStatePath(){return path.join(app.getPath('userData'),'window-state.json')}
function readWinState(){
  try{
    const s=JSON.parse(fs.readFileSync(winStatePath(),'utf8'));
    if(!s||typeof s.width!=='number'||typeof s.height!=='number')return null;
    const width=Math.max(760,Math.round(s.width)),height=Math.max(520,Math.round(s.height)),maximized=!!s.maximized;
    if(typeof s.x!=='number'||typeof s.y!=='number')return {width,height,maximized};
    const box={x:Math.round(s.x),y:Math.round(s.y),width,height};
    const vis=screen.getAllDisplays().some(d=>{const a=d.workArea;return box.x<a.x+a.width-80&&box.x+box.width>a.x+80&&box.y<a.y+a.height-80&&box.y+Math.min(box.height,80)>a.y});
    return vis?Object.assign(box,{maximized}):{width,height,maximized}}
  catch(e){return null}}
app.whenReady().then(()=>{
  if(!gotLock)return;
  Menu.setApplicationMenu(null);
  const saved=readWinState();
  const winOpts={width:saved?saved.width:1320,height:saved?saved.height:860,minWidth:760,minHeight:520,title:'SA Mod Manager',
    icon:path.join(__dirname,'build','icon.png'),backgroundColor:'#101311',frame:false,show:false,
    webPreferences:{nodeIntegration:true,contextIsolation:false,spellcheck:false}};
  if(saved&&typeof saved.x==='number'){winOpts.x=saved.x;winOpts.y=saved.y}
  const win=mainWin=new BrowserWindow(winOpts);require('./updater').init(win);
  if(saved&&saved.maximized)win.maximize();
  win.once('ready-to-show',()=>{if(saved&&saved.maximized&&!win.isMaximized())win.maximize();win.show()});
  const snap=()=>{if(win.isDestroyed())return;try{const n=win.getNormalBounds();fs.writeFileSync(winStatePath(),JSON.stringify({x:n.x,y:n.y,width:n.width,height:n.height,maximized:win.isMaximized()}))}catch(e){}};
  let snapT=null;const snapSoon=()=>{clearTimeout(snapT);snapT=setTimeout(snap,300)};
  win.on('maximize',()=>{snap();win.webContents.send('win-state',true)});
  win.on('unmaximize',()=>{snap();win.webContents.send('win-state',false)});
  win.on('resize',snapSoon);win.on('move',snapSoon);win.on('close',snap);
  win.loadFile(path.join(__dirname,'index.html'));
  win.webContents.setWindowOpenHandler(({url})=>{if(/^https?:\/\//i.test(url))shell.openExternal(url);return{action:'deny'}});
  win.webContents.on('will-navigate',e=>e.preventDefault());
});
app.on('window-all-closed',()=>app.quit());
