/* SA Mod Manager - 17-dropdowns.js: custom drop-down component (cdd), parent profile suggestions */
/* Classic script: loaded in order by index.html, shares globals with the other files. */
/* custom drop-downs (no native <select> anywhere) */
const CHEV='<svg viewBox="0 0 12 12" width="12" height="12"><path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CHK2='<svg class="ck" viewBox="0 0 12 12" width="12" height="12"><path d="M2.5 6.5 5 9l4.5-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
function placeMenu(m,anchor){const r=anchor.getBoundingClientRect();m.style.position='fixed';m.style.minWidth=r.width+'px';m.style.maxWidth='min(380px,calc(100vw - 24px))';m.style.left=r.left+'px';m.hidden=false;
 const h=Math.min(320,m.scrollHeight),below=innerHeight-r.bottom;
 if(below<h+16&&r.top>below){m.style.top='auto';m.style.bottom=(innerHeight-r.top+6)+'px'}else{m.style.bottom='auto';m.style.top=(r.bottom+6)+'px'}
 const o=m.getBoundingClientRect().right-(innerWidth-8);if(o>0)m.style.left=Math.max(8,r.left-o)+'px'}
function enhanceCdd(root){root.querySelectorAll('.cdd[data-opts]:not([data-i])').forEach(el=>{el.dataset.i=1;cddOptions(el,el.dataset.opts.split(',').map(v=>({v,t:v})),el.dataset.val)})}
function cddOpen(el){const m=el.querySelector('.ddm'),b=el.querySelector('.ddb');
 m.innerHTML=el._o.map(o=>`<div class="ddi ${o.v===el._v?'sel':''}" role="option" data-v="${esc(o.v)}">${CHK2}<span class="nmx">${esc(o.t)}</span></div>`).join('')||'<div class="ddi" style="color:var(--mut);cursor:default">Nothing to choose</div>';
 placeMenu(m,b);el.classList.add('open');b.setAttribute('aria-expanded','true');const s=m.querySelector('.sel');if(s)s.scrollIntoView({block:'nearest'})}
function cddClose(el){const m=el.querySelector('.ddm');if(m)m.hidden=true;el.classList.remove('open');const b=el.querySelector('.ddb');if(b)b.setAttribute('aria-expanded','false')}
document.addEventListener('click',e=>{const dd=e.target.closest&&e.target.closest('.cdd');
 document.querySelectorAll('.cdd.open').forEach(x=>{if(x!==dd)cddClose(x)});if(!dd)return;
 const it=e.target.closest('.ddi[data-v]');
 if(it){const v=it.dataset.v;cddClose(dd);if(v!==dd._v){dd._v=v;cddLabel(dd);dd.dispatchEvent(new Event('change',{bubbles:true}))}return}
 if(e.target.closest('.ddb'))dd.classList.contains('open')?cddClose(dd):cddOpen(dd)});
document.addEventListener('keydown',e=>{const b=e.target.closest&&e.target.closest('.cdd>.ddb');if(!b)return;const el=b.parentElement,open=el.classList.contains('open');
 if(e.key==='Escape'){if(open)e.preventDefault();cddClose(el);return}
 if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if(!open){cddOpen(el);return}
  const it=[...el.querySelectorAll('.ddi[data-v]')];let i=it.findIndex(x=>x.classList.contains('hl'));if(i<0)i=it.findIndex(x=>x.classList.contains('sel'));
  i=(i+(e.key==='ArrowDown'?1:-1)+it.length)%it.length;it.forEach(x=>x.classList.remove('hl'));it[i].classList.add('hl');it[i].scrollIntoView({block:'nearest'})}
 else if(e.key==='Enter'&&open){const h=el.querySelector('.ddi.hl');if(h){e.preventDefault();h.click()}}});
addEventListener('scroll',e=>{if(e.target&&e.target.closest&&e.target.closest('.ddm'))return;document.querySelectorAll('.cdd.open').forEach(cddClose);parClose()},true);
addEventListener('resize',()=>{document.querySelectorAll('.cdd.open').forEach(cddClose);parClose()});
cddOptions($('#sortsel'),[{v:'name',t:'Name (A–Z)'},{v:'namez',t:'Name (Z–A)'},{v:'prio',t:'Priority (high first)'},{v:'priol',t:'Priority (low first)'},{v:'status',t:'Active first'},{v:'files',t:'Most files'}],S.sort);
/* parents: a proper suggestion list instead of the browser's datalist */
function parOpen(){const q=$('#par').value.trim().toLowerCase(),have=P().par.map(x=>x.toLowerCase()),m=$('#parm');
 const names=Object.keys(S.profiles).filter(n=>n!==S.active&&!have.includes(n.toLowerCase())&&(!q||n.toLowerCase().includes(q)));
 m.innerHTML=names.map(n=>`<div class="ddi" role="option" data-p="${esc(n)}"><span class="nmx">${esc(n)}</span></div>`).join('')||'<div class="ddi" style="color:var(--mut);cursor:default">No other profiles to add</div>';
 placeMenu(m,$('#par'));$('#par').setAttribute('aria-expanded','true')}
function parClose(){const m=$('#parm');if(m)m.hidden=true;const p=$('#par');if(p)p.setAttribute('aria-expanded','false')}
$('#par').addEventListener('focus',parOpen);$('#par').addEventListener('input',parOpen);
$('#parm').addEventListener('mousedown',e=>e.preventDefault());
$('#parm').addEventListener('click',e=>{const it=e.target.closest('[data-p]');if(it){parClose();addPar(it.dataset.p)}});
document.addEventListener('click',e=>{if(!e.target.closest('#parbox'))parClose()});
$('#par').addEventListener('keydown',e=>{const m=$('#parm');
 if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if(m.hidden)parOpen();const it=[...m.querySelectorAll('.ddi[data-p]')];if(!it.length)return;let i=it.findIndex(x=>x.classList.contains('hl'));
  i=(i+(e.key==='ArrowDown'?1:-1)+it.length)%it.length;it.forEach(x=>x.classList.remove('hl'));it[i].classList.add('hl');it[i].scrollIntoView({block:'nearest'})}
 else if(e.key==='Enter'){const h=m.querySelector('.ddi.hl');if(h&&!m.hidden){e.preventDefault();e.stopImmediatePropagation();parClose();addPar(h.dataset.p)}}
 else if(e.key==='Escape')parClose()},true);
