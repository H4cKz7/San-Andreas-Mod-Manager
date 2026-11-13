/* SA Mod Manager - 48-mod-info-menu.js: "Mod info >" flyout of the Tools menu (Export / Import / Clear all mod info) */
/* Classic script: loaded in order by index.html, shares globals with the other files. */
/* Export / Import keep their ids (#miexp, #miimp) and handlers from 47-mod-info.js; they were only moved into the flyout (#mimenu) in index.html. */
(()=>{const dd=$('#toolsd'),tm=$('#toolsm'),tr=$('#mimenub'),fly=$('#mimenu'),clr=$('#miclr');
 if(!dd||!tm||!tr||!fly||!clr)return;
 let t=0;
 const cnt=()=>{try{return Object.keys(MI.all()).length}catch(e){return 0}};
 const sync=()=>{const n=cnt(),s=clr.querySelector('small');clr.disabled=!n;if(s)s.textContent=n?n+(n===1?' entry':' entries'):'Nothing saved'};
 const close=()=>{clearTimeout(t);fly.hidden=true;tr.setAttribute('aria-expanded','false')};
 const later=(f,ms)=>{clearTimeout(t);t=setTimeout(f,ms)};
 const open=()=>{clearTimeout(t);if(!fly.hidden)return;sync();fly.style.visibility='hidden';fly.hidden=false;
  const op=(fly.offsetParent||dd).getBoundingClientRect(),m=tm.getBoundingClientRect(),r=tr.getBoundingClientRect(),w=fly.offsetWidth,h=fly.offsetHeight;
  let x=m.right+4;if(x+w>innerWidth-8)x=m.left-w-4;
  const y=Math.max(8,Math.min(r.top-6,innerHeight-h-8));
  fly.style.left=(x-op.left)+'px';fly.style.top=(y-op.top)+'px';
  const z=parseInt(getComputedStyle(tm).zIndex,10);fly.style.zIndex=isNaN(z)?60:z+1;
  fly.style.visibility='';tr.setAttribute('aria-expanded','true')};
 const items=()=>[...fly.querySelectorAll('.tmi:not(:disabled)')];
 tr.addEventListener('click',e=>{e.stopPropagation();if(fly.hidden)open();else close()});/* stopPropagation: 40-toolbar.js would close the whole menu on any .tmi click */
 tr.addEventListener('mouseenter',()=>later(open,120));
 tr.addEventListener('mouseleave',()=>{if(!fly.hidden)later(close,260);else clearTimeout(t)});
 fly.addEventListener('mouseenter',()=>clearTimeout(t));
 fly.addEventListener('mouseleave',()=>later(close,260));
 tm.addEventListener('mouseover',e=>{const it=e.target.closest('.tmi');if(it&&it!==tr&&!fly.hidden)later(close,120)});/* hovering another Tools item folds the flyout away */
 tr.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();open();const i=items()[0];if(i)i.focus()}});
 fly.addEventListener('keydown',e=>{const a=items(),i=a.indexOf(document.activeElement);
  if(e.key==='ArrowLeft'){e.preventDefault();close();tr.focus()}
  else if(e.key==='ArrowDown'&&a.length){e.preventDefault();a[(i+1)%a.length].focus()}
  else if(e.key==='ArrowUp'&&a.length){e.preventDefault();a[(i<=0?a.length:i)-1].focus()}});
 fly.addEventListener('click',e=>{const it=e.target.closest('.tmi');if(!it||it.disabled)return;close();tlOpen(false)});
 new MutationObserver(()=>{if(tm.hidden)close()}).observe(tm,{attributes:true,attributeFilter:['hidden']});/* the Tools menu closed (click outside, Esc, resize) */
 clr.addEventListener('click',()=>miClearAll())})();
/* removes every saved info entry (and the group flags) of the current installation, after asking */
async function miClearAll(){const n=Object.keys(MI.all()).length;
 if(!n){toast('There is no mod info to clear');return}
 const ok=await ask({title:'Clear all mod info?',text:'This removes the source page, version, notes and tags saved on '+n+(n===1?' mod folder':' mod folders')+' in this game installation. Your mods and files are not touched. This cannot be undone, so export the mod info first if you want a copy.',ok:'Clear all',danger:true});
 if(!ok)return;
 MI._g=Object.create(null);MI.set(Object.create(null));render();
 toast('Cleared the info of '+n+(n===1?' mod folder':' mod folders'))}
