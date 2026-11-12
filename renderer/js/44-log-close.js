/* SA Mod Manager - 44-log-close.js: Log viewer Close button becomes the same x icon button as the Config editor / Game folder / Wiki */
/* Classic script: loaded in order by index.html, shares globals with the other files. Uses RIB from 43-editor-buttons.js. Only the look changes, the click handler in 03-logs.js stays. */
(()=>{const b=$('#lx');if(!b||typeof RIB==='undefined'||b.dataset.rib)return;b.dataset.rib='1';
 b.innerHTML=RIB.close;b.classList.add('rib');b.setAttribute('aria-label','Close');b.title='Close'})();
