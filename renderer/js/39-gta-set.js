/* SA Mod Manager - 39-gta-set.js: delete gta_sa.set (the game's settings file) so the game makes a fresh one */
/* Classic script: loaded in order by index.html, shares globals with the other files. */
/* Normal install: Documents\GTA San Andreas User Files\gta_sa.set. With portablegta.asi: <game folder>\userfiles\gta_sa.set. */
/* portablegta.asi anywhere in the game folder (root, scripts, modloader, any subfolder) makes the game keep gta_sa.set in <game folder>\userfiles, so that folder comes FIRST. */
/* Documents\GTA San Andreas User Files is the second place. Without portablegta.asi only the Documents location is used (single Delete button, as before). */
const PORT_RE=/^portablegta\.asi$/i,PORT_SKIP=new Set(['models','audio','movies','anim','text']);
async function setWalk(dir,depth,st,top){
 if(depth>12||st.n>60000)return false;
 let ents;try{ents=await fsN.promises.readdir(dir,{withFileTypes:true})}catch(e){return false}
 st.n+=ents.length;
 if(ents.some(e=>!e.isDirectory()&&PORT_RE.test(e.name)))return true;
 for(const e of ents)if(e.isDirectory()&&!(top&&PORT_SKIP.has(e.name.toLowerCase()))&&await setWalk(pathN.join(dir,e.name),depth+1,st,false))return true;
 return false}
async function setPortable(gd){
 if((S.mods||[]).some(m=>(m.files||[]).some(f=>PORT_RE.test(String(f).split('/').pop()))))return true;
 let ml='';try{ml=(root&&root._path)||''}catch(e){}
 if(ml&&await setWalk(ml,0,{n:0},false))return true;
 return !!gd&&await setWalk(gd,0,{n:0},true)}
async function setLocs(){
 let gd='';try{gd=gameDir()||''}catch(e){}
 const docs=window.__native.docs||pathN.join(require('os').homedir(),'Documents');
 const mk=(key,dir)=>{const file=pathN.join(dir,'gta_sa.set');return{key,dir,file,exists:fsN.existsSync(file)}};
 const portable=await setPortable(gd),list=[];
 if(portable&&gd)list.push(mk('userfiles',pathN.join(gd,'userfiles')));
 list.push(mk('docs',pathN.join(docs,'GTA San Andreas User Files')));
 return{portable,list}}
async function setRemove(L){
 let keep=null;try{keep=fsN.readFileSync(L.file)}catch(e){}
 try{
  try{await fsN.promises.rm(L.file,{force:true})}
  catch(e){if(e.code!=='EPERM'&&e.code!=='EACCES')throw e;fsN.chmodSync(L.file,0o666);await fsN.promises.rm(L.file,{force:true})}}
 catch(e){return notice('Couldn’t delete the settings file',e.message)}
 toast('Deleted gta_sa.set. The game makes a new one on next launch',keep?async()=>{
  try{if(fsN.existsSync(L.file))return toast('The game already made a new one');fsN.mkdirSync(L.dir,{recursive:true});fsN.writeFileSync(L.file,keep);toast('Settings file restored')}
  catch(e){notice('Couldn’t restore it',e.message)}}:undefined)}
/* two-choice prompt: the userfiles button is always first; a button is disabled when there is no gta_sa.set in that place */
function setPick(list){return new Promise(res=>{
 const old=$('#setd');if(old)old.remove();
 const d=document.createElement('dialog');d.id='setd';let pick=null;
 d.innerHTML='<h2>Delete GTA San Andreas Settings File?</h2>'
  +'<div class="stats">portablegta.asi was found in this installation, so the game keeps gta_sa.set in the userfiles folder of the game folder. Deleting it resets all your currently set settings, and a new one regenerates on next launch. This is helpful for fixing some crashes/errors.</div>'
  +'<div style="display:flex;flex-direction:column;gap:8px;margin-top:14px">'
  +list.map((x,i)=>'<button class="btn del" data-i="'+i+'"'+(x.exists?'':' disabled')+' style="display:flex;flex-direction:column;align-items:flex-start;gap:2px;width:100%;height:auto;min-height:44px;padding:8px 12px;text-align:left;white-space:normal'+(x.exists?'':';opacity:.5')+'"><b>'
   +(x.key==='userfiles'?'Delete from the userfiles folder (used by portablegta.asi)':'Delete from Documents (normal location)')
   +'</b><small style="font-weight:400;opacity:.8;overflow-wrap:anywhere">'+esc(x.file)+(x.exists?'':'  \u2022  not found')+'</small></button>').join('')
  +'</div><div style="display:flex;justify-content:flex-end;margin-top:16px"><button class="btn" data-i="-1">Cancel</button></div>';
 d.onclick=e=>{const b=e.target.closest('button[data-i]');if(!b||b.disabled)return;const i=+b.dataset.i;pick=i>=0?list[i]:null;d.close()};
 d.addEventListener('close',()=>{d.remove();res(pick)});
 document.body.append(d);d.showModal()})}
async function setDelete(){
 try{if(await window.__native.gameRunning(S.exe||'gta_sa.exe'))return notice('Close the game first','GTA San Andreas is running and writes gta_sa.set again when it closes. Close the game, then delete the file.')}catch(e){}
 const R=await setLocs();
 if(!R.list.some(x=>x.exists))return notice('No settings file found','There is no gta_sa.set at:\n'+R.list.map(x=>x.file).join('\n')+(R.portable?'\n\nportablegta.asi is installed, so the game keeps it in the userfiles folder of the game folder.':'')+'\n\nThe game creates it by itself.');
 if(R.list.length>1){const L=await setPick(R.list);if(L)await setRemove(L);return}
 const L=R.list[0];
 if(!await ask({title:'Delete GTA San Andreas Settings File?',text:'Deleting this will reset all your currently set settings. A new one will regenerate on next launch. This is helpful for fixing some crashes/errors.\n\n'+L.file,ok:'Delete',danger:true}))return;
 await setRemove(L)}
$('#setdel').onclick=setDelete;
