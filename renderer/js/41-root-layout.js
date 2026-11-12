/* SA Mod Manager - 41-root-layout.js: tidies the header of the Root cleo / scripts panel (icon buttons on the title row, Expand / Collapse next to the search) */
/* Classic script: loaded in order by index.html, shares globals with the other files. Only moves existing elements, so every handler in 33-folder-tools.js keeps working. */
(()=>{const d=$('#rootd'),T=$('#roottitle'),I=$('#rootinfo'),rs=$('#rootrescan'),cl=$('#rootx'),ex=$('#rootexp'),co=$('#rootcol'),q=$('#rootq'),L=$('#rootlist');
 if(!d||!T||!rs||!cl||!ex||!co||!q||!L){console.warn('41-root-layout: Root panel elements not found, layout left as is');return}
 if(d.dataset.rl)return;d.dataset.rl='1';
 const ic=p=>'<svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">'+p+'</svg>';
 const mk=(b,p,label)=>{b.innerHTML=ic(p);b.classList.add('rib');b.setAttribute('aria-label',label);b.title=label};
 mk(rs,'<path d="M13.5 8a5.5 5.5 0 1 1-1.7-3.95"/><path d="M13.6 2.4v3.2h-3.2"/>','Rescan');
 mk(cl,'<path d="M4 4l8 8M12 4l-8 8"/>','Close');
 mk(ex,'<path d="M4 6.2l4-3 4 3M4 9.8l4 3 4-3"/>','Expand all');
 mk(co,'<path d="M4 3.2l4 3 4-3M4 12.8l4-3 4 3"/>','Collapse all');
 /* row 1: title + file count on the left, Rescan and Close on the right */
 const head=document.createElement('div'),tit=document.createElement('div'),acts=document.createElement('div');
 head.className='rhead';tit.className='rtit';acts.className='racts';
 T.before(head);tit.append(T);if(I)tit.append(I);acts.append(rs,cl);head.append(tit,acts);
 const lh=head.parentElement;
 /* search row: search field + Expand / Collapse as one joined control */
 let bar=q.parentElement;
 if(!bar||bar===d||bar.contains(L)){bar=document.createElement('div');q.replaceWith(bar);bar.append(q)}
 bar.classList.add('rtool');
 const seg=document.createElement('div');seg.className='rseg';seg.append(ex,co);bar.append(seg);
 /* drop the old button row, now that all four buttons have left it */
 if(lh)[...lh.children].forEach(c=>{if(c!==head&&!c.children.length&&!c.textContent.trim())c.remove()})})();
