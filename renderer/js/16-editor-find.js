/* SA Mod Manager - 16-editor-find.js: config editor find, collapse, colour picker */
/* Classic script: loaded in order by index.html, shares globals with the other files. */
/* ===== 1.2.1: find inside the open file, collapsible sections, boolean-to-field ===== */
function edReflow(){const b=$('#edbody'),st=b.scrollTop;keepOpen(edBody);b.scrollTop=st}
function edTbHtml(c){const raw=c.view==='raw';
 return `<div class="edtb"><button class="btn sm icon ${ED.fopen?'on':''}" id="edfbtn" title="Find (Ctrl+F)" aria-label="Find" aria-pressed="${!!ED.fopen}">${ICO.find}</button><div class="edfind" id="edfind" ${ED.fopen?'':'hidden'}><input type="search" id="edfq" placeholder="${raw?'Find in file':'Search settings'}" value="${esc(ED.fq)}" spellcheck="false" aria-label="Search this file"><span class="stats" id="edfcnt"></span><button class="btn sm icon" id="edfprev" title="Previous (Shift+Enter)" aria-label="Previous match">${ICO.up}</button><button class="btn sm icon" id="edfnext" title="Next (Enter)" aria-label="Next match">${ICO.down}</button><button class="btn sm icon" id="edfx" title="Close (Esc)" aria-label="Close search">×</button></div>${raw?'':'<button class="btn sm" id="edcolall">Collapse all</button><button class="btn sm" id="edexpall">Expand all</button>'}</div>`}
const edRq=()=>ED.fopen&&ED.fq.trim()?ED.fq.toLowerCase():'';
function edFindOpen(){if(!ED.cur)return;ED.fopen=true;const f=$('#edfind'),b=$('#edfbtn'),i=$('#edfq');if(f)f.hidden=false;if(b){b.classList.add('on');b.setAttribute('aria-pressed','true')}
 if(i){i.focus();i.select()}edFindApply('new')}
function edFindClose(back){ED.fopen=false;ED.fq='';ED._fi=-1;const f=$('#edfind'),b=$('#edfbtn'),i=$('#edfq');if(f)f.hidden=true;if(b){b.classList.remove('on');b.setAttribute('aria-pressed','false')}if(i)i.value='';
 edFindApply();if(back){const r=$('#edraw');if(r)r.focus()}}
/* form / tree: show only the settings that match (key, value or description) and mark them; raw: highlight every match */
function edFindApply(step){const c=ED.cur,body=$('#edbody');if(!c||!body)return;
 if(c.view==='raw'){body.classList.remove('finding');return edRawFind(edRq(),step||0)}
 const q=ED.fopen?ED.fq.trim().toLowerCase():'',cnt=$('#edfcnt'),has=x=>x.toLowerCase().includes(q);
 body.classList.toggle('finding',!!q);
 body.querySelectorAll('.fhide,.fhit,.fcur,.fexp').forEach(x=>x.classList.remove('fhide','fhit','fcur','fexp'));
 body.querySelectorAll('details.jn[data-fwas]').forEach(d=>{d.open=d.dataset.fwas==='1';if(!q)delete d.dataset.fwas});
 if(!q){if(cnt)cnt.textContent='';ED._fi=-1;return}
 body.querySelectorAll('details.jn').forEach(d=>{if(!('fwas' in d.dataset))d.dataset.fwas=d.open?'1':'0'});
 const rowText=r=>{let t='';r.querySelectorAll('.kn,.jk,.kd,.bv').forEach(x=>t+=' '+x.textContent);r.querySelectorAll('.chip').forEach(x=>t+=' '+x.firstChild.textContent);r.querySelectorAll('input.jv,input[data-val],input[data-raw]').forEach(x=>t+=' '+x.value);return t};
 body.querySelectorAll('.kv,.jl,.note').forEach(r=>{if(has(r.classList.contains('note')?r.textContent:rowText(r)))r.classList.add('fhit');else r.classList.add('fhide')});
 body.querySelectorAll('.edsec').forEach(sec=>{const sh=sec.querySelector(':scope>.sh');
  if(sh&&has(sh.firstElementChild.textContent)){sec.querySelectorAll('.fhide').forEach(x=>x.classList.remove('fhide'));sh.classList.add('fhit')}
  else if(!sec.querySelector('.fhit')){sec.classList.add('fhide');return}
  if(sec.classList.contains('collapsed'))sec.classList.add('fexp')});
 [...body.querySelectorAll('details.jn')].reverse().forEach(d=>{const sm=d.querySelector(':scope>summary'),own=d.dataset.path!=='[]'&&has((sm.querySelector('.jk')||{textContent:''}).textContent+' '+((sm.querySelector('.jdesc')||{}).textContent||''));
  if(own){d.querySelectorAll('.fhide').forEach(x=>x.classList.remove('fhide'));sm.classList.add('fhit')}
  else if(!d.querySelector(':scope>.jc .jl:not(.fhide), :scope>.jc details.jn:not(.fhide)')){d.classList.add('fhide');return}
  d.open=true});
 const n=body.querySelectorAll('.fhit').length;ED._fh=[...body.querySelectorAll('.fhit')];ED._fi=-1;
 if(cnt)cnt.textContent=n?`${n} match${n===1?'':'es'}`:'No matches'}
function edFindStep(d){const c=ED.cur;if(!c)return;if(c.view==='raw')return edRawFind(edRq(),d);
 const h=ED._fh||[];if(!h.length)return;h.forEach(x=>x.classList.remove('fcur'));
 ED._fi=((ED._fi<0?(d>0?-1:0):ED._fi)+d+h.length)%h.length;const t=h[ED._fi];t.classList.add('fcur');t.scrollIntoView({block:'center'});
 const cnt=$('#edfcnt');if(cnt)cnt.textContent=`${ED._fi+1} of ${h.length}`}
/* raw: highlights sit in a hidden mirror behind the textarea; step = 0 refresh, 'new' jump to the first match from the caret, ±1 next / previous */
function edRawFind(q,step){const ta=$('#edraw'),mir=$('#edmir'),cnt=$('#edfcnt');if(!ta||!mir)return;
 if(!q){mir.innerHTML='';ED._ri=-1;if(cnt)cnt.textContent='';return}
 const src=ta.value,low=src.toLowerCase(),ms=[];
 for(let i=low.indexOf(q);i>=0&&ms.length<5000;i=low.indexOf(q,i+q.length))ms.push(i);
 let i=ED._ri==null?-1:ED._ri;
 if(step==='new'){i=ms.findIndex(m=>m>=ta.selectionStart);if(i<0)i=ms.length?0:-1}
 else if(step===1||step===-1){i=!ms.length?-1:i<0?(step>0?0:ms.length-1):(i+step+ms.length)%ms.length}
 else if(i>=ms.length)i=ms.length-1;
 ED._ri=i;
 let h='',p=0;ms.forEach((m,k)=>{h+=esc(src.slice(p,m))+`<mark${k===i?' class="cur"':''}>`+esc(src.slice(m,m+q.length))+'</mark>';p=m+q.length});
 mir.innerHTML=h+esc(src.slice(p))+' ';
 if(step&&i>=0){const m=ms[i],before=src.slice(0,m),line=before.split('\n').length-1,col=m-(before.lastIndexOf('\n')+1),lh=parseFloat(getComputedStyle(ta).lineHeight)||19.4;
  ta.setSelectionRange(m,m+q.length);ta.scrollTop=Math.max(0,line*lh-ta.clientHeight/2);
  const x=col*7.5;if(x<ta.scrollLeft||x>ta.scrollLeft+ta.clientWidth-80)ta.scrollLeft=Math.max(0,x-ta.clientWidth/3)}
 mir.scrollTop=ta.scrollTop;mir.scrollLeft=ta.scrollLeft;
 if(cnt)cnt.textContent=!ms.length?'No matches':i>=0?`${i+1} of ${ms.length}${ms.length>=5000?'+':''}`:`${ms.length} match${ms.length===1?'':'es'}`}
// remember which tree sections are open, per file, so re-draws (undo, redo, revert, add / remove) put them back
$('#edright').addEventListener('toggle',e=>{const d=e.target,c=ED.cur;if(!c||c.kind!=='json'||!d.classList||!d.classList.contains('jn')||document.querySelector('#edbody.finding'))return;c.jo=c.jo||{};c.jo[d.dataset.path]=d.open},true);
// colour picker: write the chosen colour into the red / green / blue numbers (alpha is left alone)
$('#edright').addEventListener('input',e=>{const t=e.target,c=ED.cur;if(!c||!t.classList||!t.classList.contains('cpick'))return;
 const d=t.closest('details.jn');if(!d)return;const p=JSON.parse(d.dataset.path),h=t.value,rgb={red:parseInt(h.slice(1,3),16),green:parseInt(h.slice(3,5),16),blue:parseInt(h.slice(5,7),16)};
 for(const k of ['red','green','blue'])if(!jEdit(c,'set',[...p,k],{raw:String(rgb[k])}))return;
 d.querySelectorAll(':scope>.jc>.jl').forEach(l=>{const k=JSON.parse(l.dataset.path).pop(),i=l.querySelector('input.jv');if(i&&k in rgb)i.value=rgb[k]});
 swUpdate(t);edStateSoon()});
// ===== themed colour picker with alpha: opens from a colour swatch in the JSON tree =====
const CP={el:null,c:null,p:null,anchor:null,h:0,s:0,v:0,a:255,hasA:false,open:false};
function cpRgb(h,s,v){const f=n=>{const k=(n+h*6)%6;return v-v*s*Math.max(0,Math.min(k,4-k,1))};return[f(5),f(3),f(1)].map(x=>Math.round(x*255))}
function cpHsv(r,g,b){r/=255;g/=255;b/=255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;let h=0;
 if(d){h=mx===r?((g-b)/d+6)%6:mx===g?(b-r)/d+2:(r-g)/d+4;h/=6}return[h,mx?d/mx:0,mx]}
const cpHex=rgb=>'#'+rgb.map(x=>('0'+x.toString(16)).slice(-2)).join('');
function cpBuild(){const d=document.createElement('div');d.className='cpop';d.id='cpop';d.hidden=true;
 d.innerHTML='<div class="cp-t"></div><div class="cp-sv"><div class="cp-knob"></div></div><div class="cp-sl cp-hue"><div class="cp-knob"></div></div><div class="cp-sl cp-al"><div class="cp-knob"></div></div><div class="cp-row"><div class="cp-pv"></div><input type="text" class="cp-hex" spellcheck="false" maxlength="9" aria-label="Hex colour"></div><div class="cp-row">'+['red','green','blue','alpha'].map(k=>'<label class="cp-f"><input type="text" class="cp-n" data-k="'+k+'" inputmode="numeric" maxlength="3" spellcheck="false" aria-label="'+k+'"><span>'+k[0].toUpperCase()+'</span></label>').join('')+'</div>';
 $('#edd').appendChild(d);CP.el=d;
 const drag=(el,fn)=>el.addEventListener('pointerdown',e=>{e.preventDefault();el.setPointerCapture(e.pointerId);
  const go=ev=>{const b=el.getBoundingClientRect(),w=Math.max(1,el.clientWidth-16),h=Math.max(1,el.clientHeight-16);fn(Math.max(0,Math.min(1,(ev.clientX-b.left-el.clientLeft-8)/w)),Math.max(0,Math.min(1,(ev.clientY-b.top-el.clientTop-8)/h)))};
  go(e);const up=()=>{el.removeEventListener('pointermove',go);el.removeEventListener('pointerup',up);el.removeEventListener('pointercancel',up)};
  el.addEventListener('pointermove',go);el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up)});
 drag(d.querySelector('.cp-sv'),(x,y)=>{CP.s=x;CP.v=1-y;cpApply()});
 drag(d.querySelector('.cp-hue'),x=>{CP.h=Math.min(x,0.9999);cpApply()});
 drag(d.querySelector('.cp-al'),x=>{CP.a=Math.round(x*255);cpApply()});
 const fromRgb=(r,g,b)=>{const hv=cpHsv(r,g,b);if(hv[1]>0&&hv[2]>0)CP.h=hv[0];CP.s=hv[1];CP.v=hv[2]};
 d.addEventListener('input',e=>{const t=e.target;
  if(t.classList.contains('cp-n')){const k=t.dataset.k,n=parseInt(t.value,10);if(isNaN(n))return;const val=Math.max(0,Math.min(255,n));
   if(k==='alpha')CP.a=val;else{const rgb=cpRgb(CP.h,CP.s,CP.v);rgb[['red','green','blue'].indexOf(k)]=val;fromRgb(rgb[0],rgb[1],rgb[2])}
   cpApply(t)}
  else if(t.classList.contains('cp-hex')){const m=t.value.trim().replace(/^#/,'');if(!/^([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(m))return;
   const f=m.length===3?m.replace(/./g,'$&$&'):m;fromRgb(parseInt(f.slice(0,2),16),parseInt(f.slice(2,4),16),parseInt(f.slice(4,6),16));
   if(f.length===8&&CP.hasA)CP.a=parseInt(f.slice(6,8),16);cpApply(t)}});
 d.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();const a=CP.anchor;cpClose();if(a)a.focus()}});
 return d}
// write the colour into the file (only the numbers that changed), then refresh the fields and swatch
function cpApply(skip){if(CP.cb){CP.cb(cpHex(cpRgb(CP.h,CP.s,CP.v)));cpSync(skip);return}const c=CP.c;if(!c||ED.cur!==c){cpClose();return}
 const rgb=cpRgb(CP.h,CP.s,CP.v),vals={red:rgb[0],green:rgb[1],blue:rgb[2]};if(CP.hasA)vals.alpha=CP.a;
 for(const k of Object.keys(vals)){let cur;try{cur=jget(c.obj,[...CP.p,k])}catch(e){}if(cur!==vals[k]&&!jEdit(c,'set',[...CP.p,k],{raw:String(vals[k])}))return}
 const d=CP.anchor&&CP.anchor.closest('details.jn');
 if(d)d.querySelectorAll(':scope>.jc>.jl').forEach(l=>{const k=JSON.parse(l.dataset.path).pop(),i=l.querySelector('input.jv');if(i&&k in vals)i.value=vals[k]});
 if(CP.anchor)swUpdate(CP.anchor);edStateSoon();cpSync(skip)}
function cpSync(skip){const d=CP.el;if(!d)return;const rgb=cpRgb(CP.h,CP.s,CP.v),r=rgb[0],g=rgb[1],b=rgb[2],a=CP.hasA?CP.a:255,
  chk='conic-gradient(var(--line) 25%,transparent 0 50%,var(--line) 0 75%,transparent 0) 0 0/8px 8px',col=r+','+g+','+b;
 const sv=d.querySelector('.cp-sv');sv.style.background='linear-gradient(to top,#000,rgba(0,0,0,0)),linear-gradient(to right,#fff,hsl('+Math.round(CP.h*360)+',100%,50%))';
 const kp=x=>'calc(8px + (100% - 16px) * '+x+')',hk=d.querySelector('.cp-hue').firstChild;
 sv.firstChild.style.left=kp(CP.s);sv.firstChild.style.top=kp(1-CP.v);sv.firstChild.style.setProperty('--kc','rgb('+col+')');
 hk.style.left=kp(CP.h);hk.style.setProperty('--kc','hsl('+Math.round(CP.h*360)+',100%,50%)');
 const al=d.querySelector('.cp-al');al.hidden=!CP.hasA;al.style.background='linear-gradient(to right,rgba('+col+',0),rgb('+col+')),'+chk;al.firstChild.style.left=kp(a/255);al.firstChild.style.setProperty('--kc','rgba('+col+','+a/255+')');
 d.querySelector('.cp-pv').style.background='linear-gradient(rgba('+col+','+a/255+'),rgba('+col+','+a/255+')),'+chk;
 const hx=d.querySelector('.cp-hex');if(hx!==skip)hx.value=cpHex(rgb)+(CP.hasA&&a!==255?('0'+a.toString(16)).slice(-2):'');
 d.querySelectorAll('.cp-n').forEach(i=>{const k=i.dataset.k;i.closest('.cp-f').hidden=k==='alpha'&&!CP.hasA;if(i!==skip)i.value=k==='alpha'?a:rgb[['red','green','blue'].indexOf(k)]})}
function cpOpen(btn){const c=ED.cur,d=btn.closest('details.jn');if(!c||!d)return;let p,v;try{p=JSON.parse(d.dataset.path);v=jget(c.obj,p)}catch(e){return}
 if(!v||typeof v!=='object')return;if(CP.open&&CP.anchor===btn){cpClose();return}
 const el=CP.el||cpBuild();if(el.parentNode!==$('#edd'))$('#edd').appendChild(el);CP.cb=null;CP.c=c;CP.p=p;CP.anchor=btn;CP.hasA=typeof v.alpha==='number';CP.a=CP.hasA?Math.max(0,Math.min(255,Math.round(v.alpha))):255;
 const hv=cpHsv(+v.red||0,+v.green||0,+v.blue||0);CP.h=hv[0];CP.s=hv[1];CP.v=hv[2];
 const nm=d.querySelector(':scope>summary .jk');el.querySelector('.cp-t').textContent=nm?nm.textContent:'Colour';
 cpSync();placeMenu(el,btn);CP.open=true}
function cpClose(){if(CP.el)CP.el.hidden=true;CP.open=false;CP.anchor=null;CP.c=null;CP.cb=null}
$('#edright').addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('.cpick');if(b){e.preventDefault();cpOpen(b)}});
document.addEventListener('mousedown',e=>{if(CP.open&&!e.target.closest('#cpop')&&!e.target.closest('.cpick'))cpClose()},true);
addEventListener('scroll',e=>{if(CP.open&&!(e.target.closest&&e.target.closest('#cpop')))cpClose()},true);
addEventListener('resize',cpClose);
$('#edright').addEventListener('scroll',e=>{if(e.target.id==='edraw'){const m=$('#edmir');if(m){m.scrollTop=e.target.scrollTop;m.scrollLeft=e.target.scrollLeft}}},true);
