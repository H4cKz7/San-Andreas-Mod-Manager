/* SA Mod Manager - 29-tooltips.js: styled tooltips replacing the native title popups */
/* Classic script: loaded in order by index.html, shares globals with the other files. */
/* Any element with a title="" gets the popover: the title is parked in data-tipt while hovered (so the browser's own
   tooltip never shows) and put back afterwards. It uses the Popover API, so it also sits above modal dialogs. */
const tipEl=document.body.appendChild(Object.assign(document.createElement('div'),{id:'tipbox'}));
tipEl.setAttribute('popover','manual');tipEl.setAttribute('role','tooltip');
let tipT=0,tipFor=null;
const tipOpen=()=>tipEl.matches(':popover-open');
function tipOff(){clearTimeout(tipT);
 if(tipFor){if(tipFor.dataset.tipt!=null){if(!tipFor.hasAttribute('title'))tipFor.setAttribute('title',tipFor.dataset.tipt);delete tipFor.dataset.tipt}tipFor=null}
 tipEl.classList.remove('on');if(tipOpen())tipEl.hidePopover()}
function tipShow(el){if(tipFor!==el||!el.isConnected)return;const txt=el.dataset.tipt;if(!txt){tipOff();return}
 tipEl.textContent=txt;if(!tipOpen())tipEl.showPopover();
 const r=el.getBoundingClientRect(),w=tipEl.offsetWidth,h=tipEl.offsetHeight,menu=el.closest('#iddm')?$('#iddm').getBoundingClientRect():null;
 let x,y;
 if(menu){x=menu.right+8;y=r.top+r.height/2-h/2;if(x+w>innerWidth-8)x=menu.left-w-8;if(x<8){x=r.left;y=menu.bottom+8}}
 else{x=r.left+r.width/2-w/2;y=r.bottom+8;if(y+h>innerHeight-8)y=r.top-h-8}
 x=Math.max(8,Math.min(x,innerWidth-w-8));y=Math.max(8,Math.min(y,innerHeight-h-8));
 tipEl.style.left=x+'px';tipEl.style.top=y+'px';tipEl.classList.add('on')}
document.addEventListener('mouseover',e=>{const el=e.target.closest?e.target.closest('[title],[data-tipt]'):null;
 if(el===tipFor)return;const was=tipOpen();tipOff();if(!el)return;
 if(el.hasAttribute('title')){const v=el.getAttribute('title');if(!v.trim())return;el.dataset.tipt=v;el.removeAttribute('title')}
 tipFor=el;if(was)tipShow(el);else tipT=setTimeout(()=>tipShow(el),450)});
document.addEventListener('mousedown',tipOff,true);
document.addEventListener('keydown',tipOff,true);
document.documentElement.addEventListener('mouseleave',tipOff);
addEventListener('blur',tipOff);addEventListener('resize',tipOff);addEventListener('scroll',tipOff,true);
