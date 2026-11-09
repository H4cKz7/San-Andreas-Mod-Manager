/* SA Mod Manager - 07-header.js: title bar window buttons and the profile actions menu */
/* Classic script: loaded in order by index.html, shares globals with the other files. */
/* header: profile actions menu + title bar colours */
const pmOpen=o=>{$('#pmm').hidden=!o;$('#pmb').setAttribute('aria-expanded',o)};
$('#pmb').onclick=()=>pmOpen($('#pmm').hidden);
document.addEventListener('click',e=>{if(!e.target.closest('#pmd'))pmOpen(false)});
$('#pmm').addEventListener('click',()=>pmOpen(false));
const WI={min:'<path d="M3.5 8.5h9"/>',max:'<rect x="3.3" y="3.3" width="9.4" height="9.4" rx="1.7"/>',res:'<rect x="3" y="5.4" width="7.6" height="7.6" rx="1.5"/><path d="M5.8 5.4V4.7a1.5 1.5 0 0 1 1.5-1.5h4a1.5 1.5 0 0 1 1.5 1.5v4a1.5 1.5 0 0 1-1.5 1.5h-.7"/>',x:'<path d="M3.7 3.7l8.6 8.6M12.3 3.7l-8.6 8.6"/>'};
const wi=d=>`<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const wState=m=>{$('#wmax').innerHTML=wi(m?WI.res:WI.max);const t=m?'Restore down':'Maximize';$('#wmax').title=t;$('#wmax').setAttribute('aria-label',t)};
$('#wmin').innerHTML=wi(WI.min);$('#wclose').innerHTML=wi(WI.x);wState(false);
window.__native.onWinState(wState);window.__native.isMax().then(wState);
$('#wmin').onclick=()=>window.__native.win('min');$('#wmax').onclick=()=>window.__native.win('max');$('#wclose').onclick=()=>window.__native.win('close');
