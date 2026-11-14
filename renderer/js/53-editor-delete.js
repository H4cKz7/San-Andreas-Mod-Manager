/* SA Mod Manager - 53-editor-delete.js: config editor Delete button: moves the open config file to the Trash */
/* Classic script: loaded in order by index.html, shares globals with the other files. Uses locOf / trashPut / trashRestore / refreshMod / renderTrash from 23-trash.js at call time. */
async function edDelete(){const c=ED.cur;if(!c)return;
 let loc=locOf(c.abs);const nm=pathN.basename(c.abs);
 if(loc&&loc.mod.length>2&&loc.mod.startsWith('::')&&!loc.rel)loc={mod:'::',rel:loc.mod.slice(2)};/* a file straight in the game folder is stored as game root + file name, like .asi files */
 if(!loc||!loc.mod)return notice('Can’t delete it','This file is not inside the game folder.');
 if(!loc.mod.startsWith('::')&&!loc.rel)return notice('Can’t delete it','“'+nm+'” belongs to the mod loader itself, so it is not deleted from here.');
 if(!fsN.existsSync(c.abs))return toast('That file no longer exists');
 if(!await ask({title:'Move “'+nm+'” to the Trash?',text:'The file is moved out of the game folder. You can restore it from the Trash.'+(c.dirty?' Your unsaved changes in the editor are discarded.':'')+' Its config backups are kept.',ok:'Move to Trash',danger:true}))return;
 let it;try{it=await trashPut(loc.mod,loc.rel,false,1)}catch(e){return notice('Couldn’t move it to the Trash',e.message)}
 ED.files=ED.files.filter(f=>f.abs!==c.abs);ED.cur=null;
 edRight();edList();const inf=$('#edinfo');if(inf)inf.textContent=ED.files.length+' config file'+(ED.files.length===1?'':'s');
 if(!loc.mod.startsWith('::'))refreshMod(loc.mod);else if(typeof rvScan==='function')Promise.resolve(rvScan(true)).catch(()=>{});
 render();renderTrash();runChecks();
 toast('Moved to the Trash',async()=>{await trashRestore(it.id);edScan()})}
