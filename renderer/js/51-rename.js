/* SA Mod Manager - 51-rename.js: rename mod folders (and folders inside them) from the mod list. Pencil button on hover, or F2. */
/* Classic script: loaded in order by index.html, shares globals with the other files. */
const RN_BAD=/[<>:"\/\\|?*\u0000-\u001f]/,RN_RES=/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\..*)?$/i;
/* '' when the name is fine, otherwise the reason it is not */
function rnCheck(nn,old,top,parent){
 if(!nn)return'Type a name first.';
 if(RN_BAD.test(nn))return'A folder name can’t contain any of these: < > : " / \\ | ? *';
 if(/[. ]$/.test(nn))return'A folder name can’t end with a dot or a space.';
 if(RN_RES.test(nn))return'“'+nn+'” is a reserved Windows name.';
 if(nn.length>100)return'That name is too long.';
 if(top&&(nn[0]==='.'||nn.toLowerCase()==='profiles'))return'“'+nn+'” is reserved by Mod Loader.';
 if(nn.toLowerCase()!==old.toLowerCase()&&fsN.existsSync(pathN.join(parent,nn)))return'A folder called “'+nn+'” already exists here.';
 return''}
/* a mod folder was renamed: its priority, ignore, include and exclusive entries follow it in every profile. Returns how many entries changed. */
function rnRefs(old,nn){let n=0;const lo=old.toLowerCase(),ln=nn.toLowerCase();
 Object.keys(S.profiles).forEach(pn=>{const p=fx(pn);
  Object.keys(p.pr).forEach(k=>{if(k.toLowerCase()===lo){const v=p.pr[k];delete p.pr[k];p.pr[nn]=v;n++}});
  ['im','inc','ex'].forEach(a=>{let ch=false;const out=[];
   p[a].forEach(e=>{if(e.toLowerCase()===lo){ch=true;if(!out.some(x=>x.toLowerCase()===ln))out.push(nn)}else out.push(e)});
   if(ch){p[a]=out;n++}})});
 return n}
async function renameItem(mod,rel){
 if(DNDBUSY)return;if(!root)return toast('Add your GTA installation first');
 if(!mod||mod.startsWith('::'))return toast('Only mod folders can be renamed here');
 const top=!rel,old=top?mod:rel.split('/').pop(),abs=locAbs(mod,rel),parent=pathN.dirname(abs);
 if(!fsN.existsSync(abs))return toast('That folder no longer exists');
 let nn=old,err='';
 for(;;){
  const v=await ask({title:top?'Rename mod folder':'Rename folder',
   text:err||(top?'The folder is renamed on disk. Its priority and ignore / exclusive entries in your profiles, and its mod info, move to the new name.':'The folder is renamed on disk and its mod info goes with it.'),
   input:true,value:nn,placeholder:'Folder name',ok:'Rename'});
  if(v==null)return;nn=String(v).trim();if(nn===old)return;
  err=rnCheck(nn,old,top,parent);if(!err)break}
 DNDBUSY=true;
 try{
  try{await fsN.promises.rename(abs,pathN.join(parent,nn))}
  catch(e){return notice('Couldn’t rename it',(/^(EBUSY|EPERM|EACCES)$/.test(e.code)?'Windows says the folder is in use. Close the game, Explorer windows or any program that has it open, then try again.\n\n':'')+e.message)}
  const nrel=top?'':(rel.includes('/')?rel.slice(0,rel.lastIndexOf('/')+1):'')+nn,newMod=top?nn:mod,m=S.mods.find(x=>x.name===mod),inRel=r=>!top&&r&&(r===rel||r.startsWith(rel+'/'));
  if(typeof fsHistRemap==='function')fsHistRemap(abs,pathN.join(parent,nn));/* SAMM-PATCH-UNDO-FILES */let ref=0;let fsPB=null,fsPA=null;const tl=TR.list();let trCh=false;
  if(top){
   fsPB=typeof fsProfRefs==='function'?fsProfRefs():null;ref=rnRefs(old,nn);fsPA=typeof fsProfRefs==='function'?fsProfRefs():null;
   if(typeof miMoved==='function')miMoved(old,nn,false);
   if(m){m.name=nn;S.mods.sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true}))}
   if(blobs.has(old)){blobs.set(nn,blobs.get(old));blobs.delete(old)}
   tl.forEach(it=>{if(it.mod===old){it.mod=nn;trCh=true}});
   if(CLIP)CLIP.items.forEach(i=>{if(i.mod===old)i.mod=nn})}
  else{
   if(typeof miMoved==='function')miMoved(mod+'/'+rel,mod+'/'+nrel,false);
   if(m&&m._x){const nx={};Object.keys(m._x).forEach(k=>{nx[k===rel||k.startsWith(rel+'/')?nrel+k.slice(rel.length):k]=m._x[k]});m._x=nx}
   tl.forEach(it=>{if(it.mod===mod&&inRel(it.rel)){it.rel=nrel+it.rel.slice(rel.length);trCh=true}});
   if(CLIP)CLIP.items.forEach(i=>{if(i.mod===mod&&inRel(i.rel))i.rel=nrel+i.rel.slice(rel.length)});
   refreshMod(mod)}
  if(trCh)TR.save(tl);
  const it={mod:newMod,rel:nrel,dir:true};
  SEL.clear();SEL.set(selKey(it.mod,it.rel),it);SELA=it;
  try{UNDO.last=snapState()}catch(e){} /* SAMM-PATCH-UNDO-RENAME-KEEP: the history is kept; only the current-state marker moves past the profile entries the rename changed */
  const fsHe=typeof fsHistPush==='function'?fsHistPush({kind:'rename',copy:false,label:'Renamed “'+old+'” to “'+nn+'”',jobs:[{src:abs,dst:pathN.join(parent,nn),isDir:true,rep:null,cp:null,u:false}],prof:fsPB&&fsPA?{before:fsPB,after:fsPA}:null}):null; /* SAMM-PATCH-UNDO-RENAME-2 */
  render();runChecks();landed([it]);
  toast('Renamed to “'+nn+'”'+(ref?'. Profile entries updated':''),fsHe?()=>fsHistToast(fsHe):undefined)}
 catch(e){notice('Something went wrong',e.message)}
 finally{DNDBUSY=false}}
/* pencil button (hover a row) */
$('#list').addEventListener('click',e=>{const b=e.target.closest('[data-rn]');if(!b)return;
 e.stopPropagation();e.preventDefault();const it=rowItem(b);if(it)renameItem(it.mod,it.rel)},true);
/* F2 renames the selected folder */
document.addEventListener('keydown',e=>{if(e.key!=='F2'||e.ctrlKey||e.altKey||e.shiftKey||e.metaKey)return;
 if(document.querySelector('dialog[open]'))return;const t=e.target;
 if(t&&(t.isContentEditable||/^(TEXTAREA|SELECT|INPUT)$/.test(t.tagName)))return;
 const a=SELA&&SEL.has(selKey(SELA.mod,SELA.rel))?SELA:[...SEL.values()].pop();
 if(!a||!a.dir||a.mod.startsWith('::'))return;e.preventDefault();renameItem(a.mod,a.rel)});
