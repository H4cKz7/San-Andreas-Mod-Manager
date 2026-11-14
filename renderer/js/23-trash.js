/* SA Mod Manager - 23-trash.js: Trash: move to / restore from / delete permanently */
/* Classic script: loaded in order by index.html, shares globals with the other files. */
/* ===== v1.2.3: Trash, Version & Essentials checker, Launch Game ===== */
const gameDir=()=>game&&game._path?game._path:((baseInstall&&baseInstall.h&&baseInstall.h._path)||(root&&root._path&&/modloader$/i.test(root._path)?pathN.dirname(root._path):''));
/* locations: a mod name is a folder in modloader; '::cleo' / '::scripts' are folders in the game directory (no real mod can have a colon in its name) */
const locAbs=(mod,rel)=>{const rp=rel?rel.split('/'):[];if(mod&&mod.startsWith('::'))return pathN.join(gameDir(),mod.slice(2),...rp);return pathN.join(root._path,...(mod?[mod]:[]),...rp)};
const locOf=p=>{const sub=(b,pre)=>{if(!b)return null;const r=pathN.relative(b,p);if(!r||r.startsWith('..')||pathN.isAbsolute(r))return null;const s=r.split(pathN.sep);if(pre&&s.length===1&&/\.asi$/i.test(s[0]))return{mod:'::',rel:s[0]};return{mod:(pre?'::':'')+s[0],rel:s.slice(1).join('/')}};return(root&&root._path&&sub(root._path,false))||sub(gameDir(),true)};
const trMod=m=>m.startsWith('::')?m.slice(2):m;
function listFiles(abs,pre=''){let out=[],ents;try{ents=fsN.readdirSync(abs,{withFileTypes:true})}catch(e){return out}
 for(const e of ents){if(e.isDirectory())out=out.concat(listFiles(pathN.join(abs,e.name),pre+e.name+'/'));else out.push(pre+e.name)}return out}
function refreshMod(name){const abs=pathN.join(root._path,name),i=S.mods.findIndex(m=>m.name===name);
 if(!fsN.existsSync(abs)){if(i>=0)S.mods.splice(i,1);return}
 const files=listFiles(abs).sort();
 if(i>=0)S.mods[i].files=files;else{S.mods.push({name,files});S.mods.sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true}))}}
/* ---- Trash: items are moved (not copied) into the app's data folder and can be restored or deleted for good ---- */
const TR={_k:null,_v:[],
 dir(){return pathN.join(window.__native.userData,'trash',S.curInst||'default')},
 list(){const k=this.dir();if(this._k!==k){this._k=k;try{this._v=JSON.parse(fsN.readFileSync(pathN.join(k,'index.json'),'utf8'))}catch(e){this._v=[]}}return this._v},
 save(a){const k=this.dir();this._k=k;this._v=a;fsN.mkdirSync(k,{recursive:true});fsN.writeFileSync(pathN.join(k,'index.json'),JSON.stringify(a))},
 async move(from,to){await fsN.promises.mkdir(pathN.dirname(to),{recursive:true});
  try{await fsN.promises.rename(from,to)}catch(e){if(e.code!=='EXDEV')throw e;await fsN.promises.cp(from,to,{recursive:true});await fsN.promises.rm(from,{recursive:true,force:true})}}};
const trName=it=>it.rel?it.rel.split('/').pop():trMod(it.mod);
async function trashPut(modName,rel,isDir,n){
 const abs=locAbs(modName,rel),id=Date.now().toString(36)+Math.random().toString(36).slice(2,6);
 await TR.move(abs,pathN.join(TR.dir(),id,'payload'));
 const it={id,mod:modName,rel,dir:isDir,n,at:Date.now()};TR.save([it,...TR.list()]);return it}
async function trashMod(m){
 if(!root)return toast('Scan your modloader folder first');
 if(!await ask({title:`Move “${m.name}” to the Trash?`,text:`The mod folder (${m.files.length} file${m.files.length===1?'':'s'}) is moved out of modloader. You can restore it from the Trash.`,ok:'Move to Trash',danger:true}))return;
 try{const it=await trashPut(m.name,'',true,m.files.length);S.mods=S.mods.filter(x=>x!==m);blobs.delete(m.name);render();runChecks();toast('Moved to the Trash',()=>trashRestore(it.id))}
 catch(e){notice('Couldn’t move it to the Trash',e.message)}}
async function trashPath(m,rel,isDir){
 if(!root)return toast('Scan your modloader folder first');
 const n=isDir?m.files.filter(f=>f.startsWith(rel+'/')).length:1,nm=rel.split('/').pop();
 if(!await ask({title:`Move “${nm}” to the Trash?`,text:(isDir?`The folder and its ${n} file${n===1?'':'s'}`:'The file')+` will be moved out of “${m.name}”. You can restore it from the Trash.`,ok:'Move to Trash',danger:true}))return;
 try{const it=await trashPut(m.name,rel,isDir,n);m.files=m.files.filter(f=>isDir?!f.startsWith(rel+'/'):f!==rel);render();runChecks();toast('Moved to the Trash',()=>trashRestore(it.id))}
 catch(e){notice('Couldn’t move it to the Trash',e.message)}}
async function trashRestore(id){const it=TR.list().find(x=>x.id===id);if(!it||(!root&&!it.mod.startsWith('::')))return;
 const from=pathN.join(TR.dir(),id,'payload');
 if(!fsN.existsSync(from)){TR.save(TR.list().filter(x=>x.id!==id));render();return toast('That item is no longer in the Trash')}
 let dest=locAbs(it.mod,it.rel||''),renamed='',replaced=false;
 if(fsN.existsSync(dest)){
  const ch=await ask({title:`“${pathN.basename(dest)}” already exists`,text:'Replace it with the one from the Trash? The current one is moved to the Trash instead of being deleted. Or keep both.',ok:'Replace',alt:'Keep both'});
  if(!ch)return;
  if(ch==='alt'){const dir=pathN.dirname(dest),ext=it.dir?'':pathN.extname(dest),base=pathN.basename(dest,ext);let k=1,c;
   do{c=pathN.join(dir,`${base} (restored${k>1?' '+k:''})${ext}`);k++}while(fsN.existsSync(c));dest=c;renamed=pathN.basename(c)}
  else{try{const isD=fsN.statSync(dest).isDirectory();await trashPut(it.mod,it.rel||'',isD,isD?listFiles(dest).length:1);replaced=true}catch(e){return notice('Couldn’t replace it',e.message)}}}
 try{await TR.move(from,dest);await fsN.promises.rm(pathN.join(TR.dir(),id),{recursive:true,force:true})}catch(e){return notice('Couldn’t restore it',e.message)}
 TR.save(TR.list().filter(x=>x.id!==id));
 if(!it.mod.startsWith('::'))refreshMod(it.rel?it.mod:pathN.basename(dest));else if(typeof rvAfter==='function')rvAfter([]);render();runChecks();
 toast(renamed?`Restored as “${renamed}”`:replaced?'Restored. The file it replaced is now in the Trash':'Restored')}
async function trashDelete(ids){const gone=TR.list().filter(x=>ids.includes(x.id)&&(!x.rel||x.dir)&&!x.mod.startsWith('::')).map(x=>x.rel?x.mod+'/'+x.rel:x.mod); /* SAMM-NESTED-INFO */
 for(const id of ids)await fsN.promises.rm(pathN.join(TR.dir(),id),{recursive:true,force:true});TR.save(TR.list().filter(x=>!ids.includes(x.id)));
 if(typeof miForget==='function')miForget(gone);render()}
function renderTrash(){const l=TR.list();$('#trdempty').disabled=!l.length;$('#trdrestore').disabled=!l.length;{const bc=$('#trbc');bc.textContent=l.length;bc.hidden=!l.length}
 const h=l.length?l.map(it=>`<div class="trr"><div class="trn"><div class="nm" title="${esc((trMod(it.mod)||'game root')+(it.rel?'/'+it.rel:''))}">${esc(trName(it))}</div><small>${it.rel?'from '+esc(trMod(it.mod)||'game root')+' · ':it.mod.startsWith('::')?'game root · ':'mod · '}${it.dir?it.n+' file'+(it.n===1?'':'s')+' · ':''}${esc(new Date(it.at).toLocaleDateString())}</small></div><button class="btn sm" data-r="${it.id}">Restore</button><button class="btn sm del" data-d="${it.id}">Delete</button></div>`).join(''):'<span class="stats">The Trash is empty</span>';
 for(const b of[$('#trdlist')])if(b._h!==h){b.innerHTML=h;b._h=h}}
const trClick=async e=>{const r=e.target.closest('[data-r]'),d=e.target.closest('[data-d]');
 if(r)return trashRestore(r.dataset.r);
 if(d){const it=TR.list().find(x=>x.id===d.dataset.d);if(!it)return;
  if(await ask({title:`Delete “${trName(it)}” permanently?`,text:'This can’t be undone.',ok:'Delete',danger:true}))try{await trashDelete([it.id]);toast('Deleted permanently')}catch(err){notice('Couldn’t delete it',err.message)}}};
const trEmpty=async()=>{const l=TR.list();if(!l.length)return;
 if(await ask({title:`Empty the Trash (${l.length} item${l.length===1?'':'s'})?`,text:'Everything in it is deleted permanently.',ok:'Empty Trash',danger:true}))try{await trashDelete(l.map(x=>x.id));toast('Trash emptied')}catch(err){notice('Couldn’t empty the Trash',err.message)}};
$('#trdlist').onclick=trClick;$('#trdempty').onclick=trEmpty;
$('#trb').onclick=()=>{renderTrash();$('#trd').showModal()};$('#trdx').onclick=()=>$('#trd').close();
/* Restore all: newest first, so a trashed mod folder returns before files that were trashed from it earlier */
async function trashRestoreAll(){const ids=TR.list().map(x=>x.id);if(!ids.length)return;
 $('#trdrestore').disabled=true;
 try{for(const id of ids)await trashRestore(id)}finally{renderTrash()}
 const n=ids.filter(id=>!TR.list().some(x=>x.id===id)).length;
 toast(n===ids.length?`Restored ${n} item${n===1?'':'s'}`:n?`Restored ${n} of ${ids.length} items`:'Nothing was restored')}
$('#trdrestore').onclick=trashRestoreAll;
