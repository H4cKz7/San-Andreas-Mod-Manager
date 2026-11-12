/* SA Mod Manager - 43-editor-buttons.js: config editor Rescan / Close and Expand all / Collapse all use the same icon buttons as the game folder panel */
/* Classic script: loaded in order by index.html, shares globals with the other files. RIB is also used by edTbHtml() in 16-editor-find.js (called later, at runtime). */
const RIB=(()=>{const s=p=>'<svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">'+p+'</svg>';
 return{rescan:s('<path d="M13.5 8a5.5 5.5 0 1 1-1.7-3.95"/><path d="M13.6 2.4v3.2h-3.2"/>'),close:s('<path d="M4 4l8 8M12 4l-8 8"/>'),
  exp:s('<path d="M4 6.2l4-3 4 3M4 9.8l4 3 4-3"/>'),col:s('<path d="M4 3.2l4 3 4-3M4 12.8l4-3 4 3"/>')}})();
(()=>{const rs=$('#edrescan'),cl=$('#edclose'),tr=$('#edtreebar'),ex=$('#edtexp'),co=$('#edtcol'),q=$('#edq');
 const mk=(b,k,label)=>{if(!b)return;b.innerHTML=RIB[k];b.classList.add('rib');b.setAttribute('aria-label',label);b.title=label};
 mk(rs,'rescan','Rescan');mk(cl,'close','Close');mk(ex,'exp','Expand all');mk(co,'col','Collapse all');
 /* top bar: Rescan + Close as one group on the right */
 if(rs&&cl&&!rs.parentElement.classList.contains('racts')){const a=document.createElement('div');a.className='racts';rs.before(a);a.append(rs,cl)}
 /* file list: Expand all / Collapse all as a joined pair (the folder tree on the left) */
 if(ex&&co&&tr&&q&&!ex.parentElement.classList.contains('rseg')){const s=document.createElement('div');s.className='rseg';s.append(ex,co);
 /* SAMM-PATCH: Expand / Collapse sit next to the search field (same layout as the Game folder panel) */
 const bar=document.createElement('div');bar.className='rtool';q.before(bar);bar.append(q,s);
 /* #edtreebar stays as an empty element outside the layout: other code shows / hides it with the Files / Backups tabs, so the buttons follow its visibility */
 const sync=()=>{s.style.display=getComputedStyle(tr).display==='none'?'none':''};sync();
 new MutationObserver(sync).observe(tr,{attributes:true,attributeFilter:['hidden','style','class']})}})();
