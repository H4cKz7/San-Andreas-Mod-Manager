/* SA Mod Manager - 04-settings.js: Modloader settings and Plugins sidebar cards */
/* Classic script: loaded in order by index.html, shares globals with the other files. */
/* settings + plugins */
const FK=[...Array(12)].map((_,i)=>[112+i,'F'+(i+1)]);
function renderSettings(){const b=S.bc;
 $('#bcsrc').innerHTML=S.bcFrom==='file'?'Read from <code>.data/config.ini</code>.':S.bcFrom==='default'?'<code>.data/config.ini</code> doesn’t exist yet, so these values come from <code>config.ini.0</code>. Changing one creates the file.':'No config found, showing Modloader’s defaults. Changing a setting creates <code>.data/config.ini</code>.'
 document.querySelectorAll('[data-bc]').forEach(c=>c.checked=!!b[c.dataset.bc]);
 if(document.activeElement!==$('#bcmls'))$('#bcmls').value=+(b.MaxLogSize/1048576).toFixed(2);
 cddOptions($('#bckey'),[...(FK.some(k=>k[0]===b.RefreshKey)?[]:[{v:String(b.RefreshKey),t:'Key code '+b.RefreshKey}]),...FK.map(([v,n])=>({v:String(v),t:n}))],String(b.RefreshKey))}
function renderPlugins(){$('#plcnt').textContent=S.plugins.length;const g=n=>{const k=Object.keys(S.pp).find(x=>x.toLowerCase()===n.toLowerCase());return k==null?'':S.pp[k]};
 $('#plugs').innerHTML=S.plugins.length?S.plugins.map(n=>`<div class="add"><span class="stats" style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;align-self:center" title="${esc(n)}">${esc(n)}</span><input type="number" min="0" max="100" placeholder="50" data-pl="${esc(n)}" value="${g(n)}" style="width:72px;background:var(--panel2);border:1px solid var(--line);border-radius:8px;padding:6px 8px;outline:none"></div>`).join(''):'<span class="stats">No plugins found</span>'}
document.querySelectorAll('[data-bc]').forEach(c=>c.onchange=()=>{S.bc[c.dataset.bc]=c.checked;S.bcDirty=true;render()});
$('#bcmls').onchange=e=>{const v=parseFloat(e.target.value);if(!isNaN(v)&&v>=0){S.bc.MaxLogSize=Math.round(v*1048576);S.bcDirty=true}render()};
$('#bckey').onchange=e=>{S.bc.RefreshKey=+e.target.value;S.bcDirty=true;render()};
$('#plugs').onchange=e=>{const n=e.target.dataset.pl;if(n==null)return;const v=e.target.value.trim();
 Object.keys(S.pp).forEach(k=>{if(k.toLowerCase()===n.toLowerCase())delete S.pp[k]});
 if(v!=='')S.pp[n]=Math.max(0,parseInt(v,10)||0);S.ppDirty=true;render()};
/* double-click a priority to type it */
$('#list').addEventListener('dblclick',e=>{const o=e.target.closest('.pr output');if(!o)return;
 const mod=S.mods[o.closest('.mod').dataset.i],lim=S.pl??100,inp=document.createElement('input');
 inp.type='number';inp.className='pedit';inp.min=0;inp.max=lim;inp.value=prio(mod.name);o.replaceWith(inp);inp.focus();inp.select();
 let done=false;const away=ev=>{if(ev.target!==inp)fin(true)};
 const fin=ok=>{if(done)return;done=true;document.removeEventListener('pointerdown',away,true);
  if(ok){const v=Math.max(0,Math.min(lim,parseInt(inp.value,10)));if(!isNaN(v))setPr(P(),mod.name,v)}
  const row=inp.closest('.mod');if(row)row._h=null; /* force the row to be redrawn so the plain number comes back */
  render()};
 document.addEventListener('pointerdown',away,true);
 inp.onkeydown=ev=>{if(ev.key==='Enter')fin(true);else if(ev.key==='Escape')fin(false)};inp.onblur=()=>fin(true)});
