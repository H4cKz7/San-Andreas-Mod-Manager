/* SA Mod Manager - 00-hoisted.js: functions needed while the other files are still loading */
/* Classic script: loaded in order by index.html, shares globals with the other files. */

/* from 17-dropdowns.js, needed by 08-theme.js */
function cddLabel(el){const o=el._o.find(x=>x.v===el._v);el.querySelector('.t').textContent=o?o.t:''}

/* from 22-scan.js, needed by 01-state.js */
function bcDef(){return{EnableMenu:true,EnablePlugins:true,EnableLog:true,ImmediateFlushLog:false,MaxLogSize:5242880,RefreshKey:115,AutoRefresh:true}}

/* from 17-dropdowns.js, needed by 08-theme.js */
function cddOptions(el,opts,val){cddInit(el);el._o=opts;el._v=val!=null&&opts.some(o=>o.v===String(val))?String(val):(opts[0]?opts[0].v:'');cddLabel(el)}

/* from 17-dropdowns.js, needed by 08-theme.js */
function cddInit(el){if(el._i)return;el._i=1;el._o=[];el._v='';
 el.innerHTML=`<button type="button" class="ddb" aria-haspopup="listbox" aria-expanded="false"><span class="t"></span>${CHEV}</button><div class="ddm" role="listbox" hidden></div>`;
 Object.defineProperty(el,'value',{get(){return this._v},set(v){this._v=String(v);cddLabel(this)},configurable:true})}
