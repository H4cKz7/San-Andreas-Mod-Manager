const{app,BrowserWindow,Menu,dialog,ipcMain,shell}=require('electron');
const path=require('path'),fs=require('fs');
app.setAppUserModelId('com.samm.modmanager');
ipcMain.on('user-data',e=>{e.returnValue=app.getPath('userData')});
ipcMain.on('win',(e,c)=>{const w=BrowserWindow.fromWebContents(e.sender);if(!w)return;if(c==='min')w.minimize();else if(c==='max')w.isMaximized()?w.unmaximize():w.maximize();else if(c==='close')w.close()});
ipcMain.handle('win-ismax',e=>{const w=BrowserWindow.fromWebContents(e.sender);return !!w&&w.isMaximized()});

ipcMain.handle('pick-folder',async()=>{
  const r=await dialog.showOpenDialog({title:'Select your GTA San Andreas folder',properties:['openDirectory']});
  return r.canceled?null:r.filePaths[0];
});
const savePath=async(e,name)=>{
  const ext=path.extname(name).slice(1)||'*';
  const r=await dialog.showSaveDialog(BrowserWindow.fromWebContents(e.sender),{
    defaultPath:path.join(app.getPath('desktop'),name),
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

app.whenReady().then(()=>{
  Menu.setApplicationMenu(null);
  const win=new BrowserWindow({width:1320,height:860,minWidth:760,minHeight:520,title:'SA Mod Manager',
    icon:path.join(__dirname,'build','icon.png'),backgroundColor:'#181c19',frame:false,show:false,
    webPreferences:{nodeIntegration:true,contextIsolation:false,spellcheck:false}});
  win.once('ready-to-show',()=>win.show());
  win.on('maximize',()=>win.webContents.send('win-state',true));
  win.on('unmaximize',()=>win.webContents.send('win-state',false));
  win.loadFile(path.join(__dirname,'index.html'));
  win.webContents.setWindowOpenHandler(({url})=>{shell.openExternal(url);return{action:'deny'}});
  win.webContents.on('will-navigate',e=>e.preventDefault());
});
app.on('window-all-closed',()=>app.quit());
