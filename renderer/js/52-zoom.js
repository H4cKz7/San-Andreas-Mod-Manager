/* SA Mod Manager - 52-zoom.js: browser-style zoom control (- 100% +) in the title bar, left of the Appearance button. Ctrl + / Ctrl - / Ctrl 0 work too. */
/* Classic script: loaded in order by index.html, shares globals with the other files. */
/* The allowed zoom range depends on the window size, so the title bar (and this control) can never be zoomed out of reach:
   the page must always stay at least NEED_W x NEED_H CSS pixels. If the window gets smaller, the zoom is lowered to fit. */
(function(){
 var wf=null;try{wf=require('electron').webFrame}catch(e){}
 var KEY='samm-zoom',MIN=.5,MAX=1.25,NEED_W=520,NEED_H=380,STEPS=[.5,.67,.75,.8,.9,1,1.1,1.25];
 var r2=function(n){return Math.round(n*100)/100};
 var MINUS='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M3.5 8h9"/></svg>';
 var PLUS='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M3.5 8h9M8 3.5v9"/></svg>';
 var box=document.createElement('div');box.className='zm';box.id='zoomctl';box.setAttribute('role','group');box.setAttribute('aria-label','Zoom');
 box.innerHTML='<button class="zb" id="zmout" aria-label="Zoom out" title="Zoom out (Ctrl -)">'+MINUS+'</button>'
  +'<button class="zv" id="zmval" aria-label="Reset zoom" title="Reset zoom to 100% (Ctrl 0)">100%</button>'
  +'<button class="zb" id="zmin" aria-label="Zoom in" title="Zoom in (Ctrl +)">'+PLUS+'</button>';
 var bOut=box.querySelector('#zmout'),bVal=box.querySelector('#zmval'),bIn=box.querySelector('#zmin');
 function cur(){var z=1;try{if(wf&&wf.getZoomFactor)z=wf.getZoomFactor();else z=parseFloat(document.documentElement.style.zoom)||1}catch(e){}return r2(z)||1}
 /* highest zoom at which the window still shows at least NEED_W x NEED_H CSS pixels */
 function limit(){
  var z=cur(),pw=(window.innerWidth||1366)*z,ph=(window.innerHeight||768)*z;
  var m=Math.min(MAX,pw/NEED_W,ph/NEED_H),best=MIN;
  STEPS.forEach(function(s){if(s<=m+.001)best=s});
  return best}
 function show(z){
  var lim=limit();
  bVal.textContent=Math.round(z*100)+'%';
  bOut.disabled=z<=MIN+.001;
  bIn.disabled=z>=lim-.001;
  bIn.title=(bIn.disabled&&lim<MAX&&z>=lim-.001)?'The window is too small to zoom in further':'Zoom in (Ctrl +)'}
 function set(z){
  z=r2(Math.min(limit(),Math.max(MIN,z)));
  try{if(wf&&wf.setZoomFactor)wf.setZoomFactor(z);else document.documentElement.style.zoom=z}catch(e){}
  show(z);try{localStorage.setItem(KEY,String(z))}catch(e){}}
 function zoomIn(){var z=cur();if(z>=limit()-.001)return show(z);var n=STEPS.find(function(s){return s>z+.001});set(n||MAX)}
 function zoomOut(){var z=cur(),p=STEPS.filter(function(s){return s<z-.001});set(p.length?p[p.length-1]:MIN)}
 function reset(){set(1)}
 bIn.onclick=zoomIn;bOut.onclick=zoomOut;bVal.onclick=reset;
 document.addEventListener('keydown',function(e){
  if(!(e.ctrlKey||e.metaKey)||e.altKey)return;
  if(e.key==='='||e.key==='+'||e.code==='NumpadAdd'){e.preventDefault();zoomIn()}
  else if(e.key==='-'||e.key==='_'||e.code==='NumpadSubtract'){e.preventDefault();zoomOut()}
  else if(e.key==='0'||e.code==='Numpad0'){e.preventDefault();reset()}});
 /* window resized (or zoom changed by something else): if the zoom no longer fits the window, lower it; keep the label honest */
 var rz=0;
 window.addEventListener('resize',function(){clearTimeout(rz);rz=setTimeout(function(){
  var z=cur(),lim=limit();
  if(z>lim+.001)set(lim);else show(z)},60)});
 /* place it inside the title bar's button group, directly left of the Appearance button */
 var wc=document.querySelector('.titlebar .wc'),pal=document.getElementById('wpal');
 if(pal&&pal.parentNode)pal.parentNode.insertBefore(box,pal);
 else if(wc)wc.insertBefore(box,wc.firstChild);
 else (document.querySelector('.titlebar')||document.body).appendChild(box);
 /* restore the saved zoom (always re-applied and clamped, so an old extreme value can never come back) */
 var saved=NaN;try{saved=parseFloat(localStorage.getItem(KEY))}catch(e){}
 set(saved>0?saved:cur());
})();
