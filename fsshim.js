// Gives the page real disk access through Node, using the same API shape as the browser's File System Access API.
const fs=require('fs'),path=require('path'),{ipcRenderer}=require('electron');
const fileH=p=>({kind:'file',name:path.basename(p),
 async getFile(){const b=await fs.promises.readFile(p);return new File([b],path.basename(p))},
 async createWritable(){const c=[];return{
  async write(d){c.push(d instanceof Blob?Buffer.from(await d.arrayBuffer()):Buffer.from(d))},
  async close(){await fs.promises.writeFile(p,Buffer.concat(c))}}}});
const dirH=p=>({kind:'directory',name:path.basename(p),_path:p,
 async*entries(){for(const e of await fs.promises.readdir(p,{withFileTypes:true})){const q=path.join(p,e.name);yield[e.name,e.isDirectory()?dirH(q):fileH(q)]}},
 async getDirectoryHandle(n,o){const q=path.join(p,n);if(o&&o.create)await fs.promises.mkdir(q,{recursive:true});else if(!(await fs.promises.stat(q)).isDirectory())throw new Error('Not a folder');return dirH(q)},
 async getFileHandle(n,o){const q=path.join(p,n);if(o&&o.create){try{await fs.promises.access(q)}catch(e){await fs.promises.writeFile(q,'')}}else await fs.promises.access(q);return fileH(q)},
 async removeEntry(n){await fs.promises.rm(path.join(p,n),{recursive:true})},
 async queryPermission(){return'granted'},async requestPermission(){return'granted'},async isSameEntry(o){return !!o&&o._path===p}});
window.showDirectoryPicker=async()=>{const p=await ipcRenderer.invoke('pick-folder');if(!p){const e=new Error('cancelled');e.name='AbortError';throw e}return dirH(p)};
window.__idb=async(m,key,v)=>{const k='samm-h-'+key;
 if(m==='put'){localStorage.setItem(k,JSON.stringify({root:v.root._path,game:v.game?v.game._path:null}));return}
 if(m==='del'){localStorage.removeItem(k);return}
 let raw=localStorage.getItem(k);
 if(!raw&&key==='root'){const r=localStorage.getItem('samm-root'),g=localStorage.getItem('samm-game');if(r)raw=JSON.stringify({root:r,game:g})}
 if(!raw)return;const o=JSON.parse(raw);if(!o.root||!fs.existsSync(o.root))return;
 return{root:dirH(o.root),game:o.game&&fs.existsSync(o.game)?dirH(o.game):null}};
// Native saving (real file dialogs + real Windows shortcuts) instead of browser downloads
window.__native={
 userData:ipcRenderer.sendSync('user-data'),
 win:c=>ipcRenderer.send('win',c),
 setTheme:t=>ipcRenderer.send('theme',t),
 showItem:p=>ipcRenderer.send('show-item',p),
 launch:p=>ipcRenderer.invoke('launch-game',p),
 isMax:()=>ipcRenderer.invoke('win-ismax'),
 onWinState:cb=>ipcRenderer.on('win-state',(e,m)=>cb(m)),
 saveFile:(name,data)=>ipcRenderer.invoke('save-file',name,data),
 saveShortcut:(name,opts)=>ipcRenderer.invoke('save-shortcut',name,opts)};
