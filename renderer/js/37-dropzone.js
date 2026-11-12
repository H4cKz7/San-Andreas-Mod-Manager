/* SA Mod Manager - 37-dropzone.js: drop an archive or folder anywhere on the window to open the installer */
/* Classic script: loaded in order by index.html, shares globals with the other files. */
/* SAMM-FEATURES. Only real files dragged in from the OS are handled (they carry the "Files" type), so dragging mods around
   inside the list (26-dnd.js) is not affected. The installer's own drop zone (#drop) keeps handling drops on itself. */
var DZ={n:0,el:null};
const dzFiles=e=>!!(e.dataTransfer&&[...(e.dataTransfer.types||[])].includes('Files'));
const dzBlocked=()=>!!DRAG||!!document.querySelector('dialog[open]:not(#dlg):not(#rootd)');
function dzShow(on){
 if(!DZ.el){const d=document.createElement('div');d.id='dropov';d.setAttribute('popover','manual');
  d.innerHTML='<div><b>Drop to install</b><span>An archive (.zip, .rar, .7z) or a mod folder</span></div>';document.body.appendChild(d);DZ.el=d}
 try{if(on&&!DZ.el.matches(':popover-open'))DZ.el.showPopover();else if(!on&&DZ.el.matches(':popover-open'))DZ.el.hidePopover()}catch(x){}}
addEventListener('dragenter',e=>{if(!dzFiles(e)||dzBlocked())return;DZ.n++;dzShow(true)});
addEventListener('dragleave',e=>{if(!dzFiles(e))return;DZ.n=Math.max(0,DZ.n-1);
 if(!DZ.n||e.clientX<=0||e.clientY<=0||e.clientX>=innerWidth||e.clientY>=innerHeight){DZ.n=0;dzShow(false)}});
addEventListener('dragover',e=>{if(!dzFiles(e))return;e.preventDefault();e.dataTransfer.dropEffect=dzBlocked()?'none':'copy'});
addEventListener('drop',e=>{if(!dzFiles(e))return;e.preventDefault();DZ.n=0;dzShow(false);
 if(e.target.closest&&e.target.closest('#drop'))return;
 if(dzBlocked())return;
 dzOpen([...e.dataTransfer.files])});
addEventListener('dragend',()=>{DZ.n=0;dzShow(false)});
async function dzFolder(p){const nm=pathN.basename(p);let items;
 try{items=listFiles(p).map(r=>String(r).replace(/\\/g,'/')).filter(r=>!JUNK.test(r)).map(r=>({rel:nm+'/'+r,abs:pathN.join(p,...r.split('/'))}))}
 catch(e){return notice('Couldn’t read the folder',e.message)}
 if(!items.length)return notice('Empty folder','There is nothing inside “'+nm+'”.');
 clearTmps();await loadPackage(items,'')}
async function dzOpen(fl){
 if(!root&&!game)return toast('Scan your GTA folder first');
 if(!root)return toast('Mod Loader isn’t installed yet. Use “Set up Mod Loader…” in the Version & Essentials card');
 const all=fl.map(f=>({f,p:pathOf(f)})).filter(x=>x.p);
 if(!all.length)return toast('Couldn’t read the dropped item');
 const isD=p=>{try{return fsN.statSync(p).isDirectory()}catch(e){return false}};
 const dirs=all.filter(x=>isD(x.p)),arcs=all.filter(x=>!dirs.includes(x)&&ARCH_RE.test(x.f.name)),loose=all.filter(x=>!dirs.includes(x)&&!arcs.includes(x));
 const one=arcs[0]||dirs[0];
 if(!dlg.open)$('#inst').click();
 if(one){if(all.length>1)toast('One package at a time. Opened “'+pathN.basename(one.p)+'”');
  return arcs.includes(one)?openArchive(one.p):dzFolder(one.p)}
 clearTmps();await loadPackage(loose.map(x=>({rel:x.f.name,abs:x.p,file:x.f})),'')}
