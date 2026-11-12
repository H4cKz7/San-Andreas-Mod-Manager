/* SA Mod Manager - 45-log-copy.js: fixes the Log viewer Copy button (require('electron').clipboard is undefined here) */
/* Classic script: loaded in order by index.html, shares globals with the other files. Replaces the #lcopy click handler set in 03-logs.js. */
async function logCopyText(t){
 try{if(typeof nCopy==='function'&&await nCopy(t))return true}catch(e){}
 try{const c=require('electron').clipboard;if(c&&c.writeText){c.writeText(t);return true}}catch(e){}
 try{if(navigator.clipboard&&navigator.clipboard.writeText){await navigator.clipboard.writeText(t);return true}}catch(e){}
 try{const a=document.createElement('textarea');a.value=t;a.setAttribute('readonly','');a.style.cssText='position:fixed;top:0;left:0;opacity:0;pointer-events:none';
  (document.querySelector('dialog[open]')||document.body).append(a);a.select();const ok=document.execCommand('copy');a.remove();return ok}catch(e){}
 return false}
$('#lcopy').onclick=async()=>{if(!LV.abs)return;
 if(LV.size>LOG_BIG&&!await ask({title:'This log is very large',text:pathN.basename(LV.abs)+' is '+fmtSize(LV.size)+'. Copying it may take a while and can freeze the app. Copy it anyway?',ok:'Copy anyway'}))return;
 try{const t=LV.trunc?await fsN.promises.readFile(LV.abs,'utf8'):LV.raw;
  if(await logCopyText(t))toast('Log copied');else toast('Couldn’t copy the log: the clipboard is not available')}
 catch(e){toast('Couldn’t copy: '+e.message)}};
