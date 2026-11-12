/* SA Mod Manager - 40-toolbar.js: the Tools menu in the header (Trash, Restore install, Root scripts, Shortcut, Logs, Export, gta_sa.set) */
/* Classic script: loaded in order by index.html, shares globals with the other files. */
/* The buttons inside the menu are the original buttons, so their handlers (23-trash, 33-folder-tools, ...) keep working unchanged. */
const tlOpen=o=>{const m=$('#toolsm'),b=$('#toolsb');
 if(o)m.classList.toggle('right',b.getBoundingClientRect().left>innerWidth/2);
 m.hidden=!o;b.setAttribute('aria-expanded',String(!!o))};
$('#toolsb').onclick=()=>tlOpen($('#toolsm').hidden);
document.addEventListener('click',e=>{if(!e.target.closest('#toolsd'))tlOpen(false)});
document.addEventListener('keydown',e=>{if(e.key==='Escape')tlOpen(false)});
addEventListener('resize',()=>tlOpen(false));
$('#toolsm').addEventListener('click',e=>{const it=e.target.closest('.tmi');if(!it||it.disabled)return;tlOpen(false);
 const x=it.dataset.x;if(x)exportRun(x,e.shiftKey&&x!=='html')});
