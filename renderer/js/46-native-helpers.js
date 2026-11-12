/* SA Mod Manager - 46-native-helpers.js: clipboard, web links and "open file / folder" through the main process, with the old ways as fallback */
/* Classic script: loaded in order by index.html, shares globals with the other files. Everything here is called at runtime only. */
/* The page can't rely on require('electron').clipboard / .shell, so main.js does the work (see ipcMain handlers 'clip-write', 'open-external', 'open-path'). */
async function nCopy(t){t=String(t==null?'':t);
 try{if(window.__native&&window.__native.copy&&await window.__native.copy(t))return true}catch(e){}
 try{const c=require('electron').clipboard;if(c&&c.writeText){c.writeText(t);return true}}catch(e){}
 try{if(navigator.clipboard&&navigator.clipboard.writeText){await navigator.clipboard.writeText(t);return true}}catch(e){}
 try{const a=document.createElement('textarea');a.value=t;a.setAttribute('readonly','');a.style.cssText='position:fixed;top:0;left:0;opacity:0;pointer-events:none';
  (document.querySelector('dialog[open]')||document.body).append(a);a.select();const ok=document.execCommand('copy');a.remove();return ok}catch(e){}
 return false}
async function nOpen(u){
 try{if(window.__native&&window.__native.openExternal&&await window.__native.openExternal(u))return true}catch(e){}
 try{require('electron').shell.openExternal(u);return true}catch(e){}
 try{window.open(u);return true}catch(e){}
 return false}
/* returns '' on success or an error text, like shell.openPath */
async function nOpenPath(p){
 try{if(window.__native&&window.__native.openPath)return await window.__native.openPath(p)}catch(e){}
 try{return await require('electron').shell.openPath(p)}catch(e){return e.message}}
function nShow(p){
 try{if(window.__native&&window.__native.showItem)return window.__native.showItem(p)}catch(e){}
 try{require('electron').shell.showItemInFolder(p)}catch(e){}}
