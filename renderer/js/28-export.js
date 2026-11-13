/* SA Mod Manager - 28-export.js: export the mod list as a short .txt (sharing) or a browsable .html (debugging) */
/* Classic script: loaded in order by index.html, shares globals with the other files. */
/* Export split button (#expd): main button (#expbtn) = short .txt WITHOUT subfolders, Shift+click = copy it to the clipboard. */
/* Chevron menu (#expm): "Export with subfolders" = short .txt with the folder tree, "Export HTML report" = full .html (every file of every mod, search, conflicts). */
const EXPORT_DOCS=/\.(txt|md|pdf|docx?|rtf|url|html?)$/i; /* readmes etc. are ignored when looking for file conflicts */

/* ---- shared data -------------------------------------------------------------------- */
function exportData(){
 E=eff();
 const byName=(a,b)=>a.m.name.localeCompare(b.m.name,undefined,{numeric:true,sensitivity:'base'});
 const p2=n=>String(n).padStart(2,'0'),d=new Date();
 const rows=S.mods.map(m=>{const s=status(m);return{m,st:s[0],on:s[1]==='st',pr:prio(m.name),ex:!!hit(E.ex,m.name),ty:typesOf(m).join(', ')}});
 const act=rows.filter(r=>r.on).sort((a,b)=>b.pr-a.pr||byName(a,b)),off=rows.filter(r=>!r.on).sort(byName);
 /* conflicts: same relative file provided by 2+ active mods (ignored files and docs skipped); first mod listed wins */
 const cm={};
 act.forEach(x=>x.m.files.forEach(f=>{
  if(EXPORT_DOCS.test(f)||fileIgnored(x.m,f))return;
  const k=String(f).replace(/\\/g,'/').toLowerCase();
  (cm[k]=cm[k]||{file:f,mods:[]}).mods.push(x)}));
 const conflicts=Object.keys(cm).filter(k=>cm[k].mods.length>1).sort().map(k=>cm[k]);
 return{
  stamp:d.getFullYear()+'-'+p2(d.getMonth()+1)+'-'+p2(d.getDate())+' '+p2(d.getHours())+':'+p2(d.getMinutes()),
  day:d.getFullYear()+'-'+p2(d.getMonth()+1)+'-'+p2(d.getDate()),
  rows,act,off,conflicts,
  nFiles:S.mods.reduce((n,m)=>n+m.files.length,0),
  p:P(),par:parentsOf(S.active),
  mode:E.ia?'Ignoring ALL mods':E.ea?'Include-only (IncludeMods)':'Normal',
  env:VC&&VC.res||null}}

function exportName(d,ext){
 return 'SA-ModList-'+S.active.replace(/[\\/:*?"<>|]/g,'').trim()+'-'+d.day+'.'+ext}

/* subfolders of a mod as an indented tree of folder names (no files) */
function exportDirs(m){
 const t=Object.create(null),out=[],cmp=(x,y)=>x.localeCompare(y,undefined,{numeric:true,sensitivity:'base'});
 m.files.forEach(f=>{const a=String(f).replace(/\\/g,'/').split('/');a.pop();let n=t;a.forEach(q=>{if(q)n=n[q]=n[q]||Object.create(null)})});
 (function walk(n,pre){const ks=Object.keys(n).sort(cmp);ks.forEach((k,i)=>{const last=i===ks.length-1;out.push(pre+(last?'\u2517\u2501':'\u2523\u2501')+k);walk(n[k],pre+(last?'  ':'\u2503 '))})})(t,'');
 return out}

/* mod files as nested, expandable folders for the HTML report: each folder is a <details> holding its subfolders and files */
function exportTreeHtml(m,h,ig){
 const cmp=(x,y)=>x.localeCompare(y,undefined,{numeric:true,sensitivity:'base'});
 const mk=()=>({d:Object.create(null),f:[],n:0}),root=mk();
 m.files.forEach(f=>{
  const a=String(f).replace(/\\/g,'/').split('/').filter(Boolean),leaf=a.pop();
  if(leaf==null)return;
  let n=root;n.n++;
  a.forEach(q=>{n=n.d[q]=n.d[q]||mk();n.n++});
  n.f.push({name:leaf,full:f})});
 const file=x=>'<li'+(ig(x.full)?' class="ig"':'')+' data-p="'+h(x.full)+'" title="'+h(x.full)+'">'+h(x.name)+(ig(x.full)?' <i>ignored</i>':'')+'</li>';
 const walk=n=>Object.keys(n.d).sort(cmp).map(k=>
  '<li class="dl"><details class="dir"><summary><span class="n">'+h(k)+'</span><span class="ct" title="files">'+n.d[k].n+'</span></summary>'
  +'<ul class="sf">'+walk(n.d[k])+'</ul></details></li>').join('')
  +n.f.sort((a,b)=>cmp(a.name,b.name)).map(file).join('');
 return '<ul class="fl">'+walk(root)+'</ul>'}

/* ---- short .txt (for sharing) ------------------------------------------------------- */
function exportReport(tree){
 tree=tree!==false; /* false = leave out the subfolder tree under each mod */
 const d=exportData(),W=72,bar='='.repeat(W),thin='-'.repeat(W),L=[],r=d.env;
 const pad=(s,n)=>{s=String(s);return s.length>=n?s:s+' '.repeat(n-s.length)};
 const lpad=(s,n)=>{s=String(s);return s.length>=n?s:' '.repeat(n-s.length)+s};
 const head=t=>L.push('',bar,' '+t.toUpperCase(),bar);
 const kv=(k,v)=>L.push(pad(k,16)+': '+v);
 const wrap=(list,ind)=>{let line=ind;list.forEach((n,i)=>{const t=n+(i<list.length-1?', ':'');
  if(line.length+t.length>W&&line.trim()){L.push(line.trimEnd());line=ind}line+=t});if(line.trim())L.push(line.trimEnd())};
 L.push(bar,' SA Mod Manager - Mod List',bar);
 kv('Generated',d.stamp);
 if(S.gname)kv('Game',S.gname);
 kv('Profile',S.active+(S.active===S.cur?'  (current)':'  ($current = '+S.cur+')'));
 kv('Mode',d.mode);
 if(d.par.length)kv('Inherits',d.par.join(', '));
 if(S.pl!=null)kv('Priority limit',S.pl);
 kv('Mods',d.rows.length+'  ('+d.act.length+' active, '+d.off.length+' inactive, '+d.nFiles+' files)');
 if(d.p.im.length){kv('Ignored mods',d.p.im.length);}
 if(d.p.ig.length){kv('Ignored files',d.p.ig.length+' pattern(s)');}
 if(d.conflicts.length)kv('File conflicts',d.conflicts.length+'  (full list in the HTML report)');
 if(r){
  const sym={ok:'[ OK ]',warn:'[ !! ]',bad:'[FAIL]'};
  head('Game environment');
  [['gta_sa.exe',r.exe],['ASI loader',r.asi],['Mod Loader',r.ml],['Limit adjuster',r.lim]].forEach(([k,x])=>{
   L.push(pad(k,16)+'  '+sym[x.state]+' '+x.title);
   if(x.state!=='ok'&&x.detail)L.push(pad('',24)+x.detail)});
  const miss=r.ess.filter(x=>!x.where);
  L.push('Essentials      : '+(r.ess.length-miss.length)+' of '+r.ess.length+' found');
  miss.forEach(x=>L.push('   [ -- ] '+x.name+(S.essIgn.includes(x.id)?'  (missing, ignored by user)':'  MISSING')))}
 const nw=Math.min(44,Math.max(8,...d.act.map(x=>x.m.name.length)));
 head('Active mods ('+d.act.length+')  - higher priority wins');
 if(d.act.length){
  L.push(lpad('#',3)+'  '+pad('Mod',nw)+'  '+lpad('Prio',4)+'  '+lpad('Files',5));
  L.push(thin);
  d.act.forEach((x,i)=>{L.push(lpad(i+1,3)+'  '+pad(x.m.name,nw)+'  '+lpad(x.pr,4)+'  '+lpad(x.m.files.length,5)+(x.ex?'  [exclusive]':''));if(typeof miText==='function')miText(x.m.name).forEach(l=>L.push('       '+l));if(typeof miTextSub==='function')miTextSub(x.m.name).forEach(l=>L.push('       '+l)); /* SAMM-NESTED-INFO-2 */if(tree)exportDirs(x.m).forEach(l=>L.push('       '+l))})
 }else L.push('(none)');
 head('Inactive mods ('+d.off.length+')');
 if(d.off.length)wrap(d.off.map(x=>x.m.name),'  ');else L.push('(none)');
 if(d.conflicts.length){
  const MAX=15;
  head('File conflicts ('+d.conflicts.length+')  - first mod wins');
  d.conflicts.slice(0,MAX).forEach(c=>L.push(c.file+'  <-  '+c.mods.map(x=>x.m.name).join(' > ')));
  if(d.conflicts.length>MAX)L.push('... and '+(d.conflicts.length-MAX)+' more')}
 L.push('',bar);
 return L.join('\r\n')+'\r\n'}

/* ---- browsable .html (for debugging) ------------------------------------------------ */
function exportHtml(){
 const d=exportData(),r=d.env,L=[];
 const h=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
 const kv=(k,v)=>'<div class="kv"><span>'+h(k)+'</span><b>'+h(v)+'</b></div>';
 const modEl=x=>{
  const ig=f=>fileIgnored(x.m,f);
  return '<details class="mod'+(x.on?'':' off')+'"><summary><span class="n">'+h(x.m.name)+'</span>'
   +(x.ex?'<span class="tag">exclusive</span>':'')
   +(x.ty?'<span class="tg">'+h(x.ty)+'</span>':'')
   +(x.on?'':'<span class="tg">'+h(x.st)+'</span>')
   +(typeof miHtml==='function'?miHtml(x.m.name,h).sum:'')
   +'<span class="pr" title="priority">P'+h(x.pr)+'</span><span class="ct" title="files">'+x.m.files.length+'</span></summary>'
   +(typeof miHtml==='function'?miHtml(x.m.name,h).body:'')
   +(x.m.files.length?exportTreeHtml(x.m,h,ig):'<p class="none">No files</p>')
   +'</details>'};
 const bad=[];
 if(r){[['gta_sa.exe',r.exe],['ASI loader',r.asi],['Mod Loader',r.ml],['Limit adjuster',r.lim]].forEach(([k,x])=>{if(x.state!=='ok')bad.push(k+': '+x.title+(x.detail?' - '+x.detail:''))});
  r.ess.filter(x=>!x.where&&!S.essIgn.includes(x.id)).forEach(x=>bad.push('Missing essential: '+x.name))}
 L.push('<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">',
 '<title>SA Mod Manager - '+h(S.active)+' - '+d.day+'</title><style>',
 ':root{--bg:#f6f7f9;--card:#fff;--tx:#1d2330;--mut:#667085;--bd:#dde1e8;--ac:#2f6fed;--ok:#1a8f4d;--warn:#b7791f;--bad:#c53030;--code:#f0f2f6}',
 '@media(prefers-color-scheme:dark){:root{--bg:#15181e;--card:#1e222b;--tx:#e6e9ef;--mut:#8b93a3;--bd:#2f3542;--ac:#6b9bff;--ok:#4cc38a;--warn:#e0a84a;--bad:#f06a6a;--code:#252a35}}',
 '*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--tx);font:14px/1.45 system-ui,Segoe UI,sans-serif}',
 'main{max-width:960px;margin:0 auto;padding:20px 16px 60px}h1{font-size:20px;margin:0 0 2px}h2{font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:var(--mut);margin:26px 0 8px}',
 '.sub{color:var(--mut);margin:0 0 14px}.card{background:var(--card);border:1px solid var(--bd);border-radius:10px;padding:12px 14px}',
 '.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:2px 24px}.kv{display:flex;justify-content:space-between;gap:12px;padding:3px 0;border-bottom:1px dashed var(--bd)}.kv span{color:var(--mut)}.kv b{font-weight:600;text-align:right;word-break:break-word}',
 '.chk{display:flex;gap:10px;padding:4px 0}.st{font:600 11px/1 ui-monospace,Consolas,monospace;padding:3px 6px;border-radius:5px;height:max-content;min-width:44px;text-align:center;color:#fff}.st.ok{background:var(--ok)}.st.warn{background:var(--warn)}.st.bad{background:var(--bad)}',
 '.chk small{display:block;color:var(--mut)}.alert{border-color:var(--bad);color:var(--bad)}.alert ul{margin:6px 0 0;padding-left:18px}',
 '.bar{position:sticky;top:0;z-index:5;background:var(--bg);padding:10px 0;display:flex;gap:8px;flex-wrap:wrap}',
 '.bar input{flex:1;min-width:200px;padding:8px 10px;border:1px solid var(--bd);border-radius:8px;background:var(--card);color:var(--tx);font:inherit}.bar button{padding:8px 12px;border:1px solid var(--bd);border-radius:8px;background:var(--card);color:var(--tx);font:inherit;cursor:pointer}.bar button:hover{border-color:var(--ac)}',
 '.mod{background:var(--card);border:1px solid var(--bd);border-radius:8px;margin:4px 0}.mod.off{opacity:.8}.mod[hidden]{display:none}',
 'summary{display:flex;align-items:center;gap:8px;padding:7px 12px;cursor:pointer;list-style:none}summary::-webkit-details-marker{display:none}summary::before{content:"\\25B8";color:var(--mut);transition:transform .12s}details[open]>summary::before{transform:rotate(90deg)}',
 '.n{flex:1;font-weight:600;word-break:break-word}.pr,.ct,.tg,.tag{font-size:11px;color:var(--mut);background:var(--code);padding:2px 7px;border-radius:99px;white-space:nowrap}.tag{color:var(--warn)}.ct::after{content:" files"}',
 '.fl{margin:0;padding:6px 12px 10px 30px;list-style:none;font:12px/1.6 ui-monospace,Consolas,monospace;border-top:1px solid var(--bd);word-break:break-all}.fl li.ig{opacity:.55;text-decoration:line-through}.fl i{font:11px system-ui;color:var(--warn)}',
 '.none{margin:0;padding:6px 12px 10px 30px;color:var(--mut);border-top:1px solid var(--bd)}',
 '.cf{padding:6px 0;border-bottom:1px dashed var(--bd);font-size:13px}.cf code{background:var(--code);padding:1px 5px;border-radius:4px;word-break:break-all}.cf small{display:block;color:var(--mut)}.cf b{color:var(--ok)}',
 '.sf{margin:0;padding:0 0 0 18px;list-style:none}.dl{margin:0}.dir>summary{padding:2px 0}.dir>summary .n{font-weight:500}.fl li.hit{color:var(--ac);font-weight:600}',
 '.empty{color:var(--mut);padding:8px 0}',
 '.mi{padding:6px 12px 8px 30px;border-top:1px solid var(--bd);font-size:13px;word-break:break-word}.mi>div{padding:1px 0}.mi>div>span{color:var(--mut);display:inline-block;min-width:58px}.mi a{color:var(--ac)}.mi pre{margin:2px 0 0;white-space:pre-wrap;font:inherit}',
 '</style></head><body><main>',
 '<h1>SA Mod Manager - Mod List</h1><p class="sub">Generated '+h(d.stamp)+'</p>');
 if(bad.length)L.push('<div class="card alert"><b>'+bad.length+' problem'+(bad.length>1?'s':'')+' found</b><ul>'+bad.map(b=>'<li>'+h(b)+'</li>').join('')+'</ul></div>');
 L.push('<h2>Overview</h2><div class="card grid">',
  S.gname?kv('Game',S.gname):'',S.exe?kv('Executable',S.exe):'',
  kv('Profile',S.active+(S.active===S.cur?' (current)':' ($current = '+S.cur+')')),
  kv('Mode',d.mode),kv('Inherits',d.par.length?d.par.join(', '):'none'),
  S.pl!=null?kv('Priority limit',S.pl):'',
  kv('Mods',d.rows.length),kv('Active',d.act.length),kv('Inactive',d.off.length),kv('Files in mods',d.nFiles),
  kv('Ignored mods',d.p.im.length?d.p.im.join(', '):'none'),
  kv('Ignored files',d.p.ig.length?d.p.ig.join(', '):'none'),
  d.p.inc.length?kv('Included mods',d.p.inc.join(', ')):'',
  kv('All profiles',Object.keys(S.profiles).join(', ')),'</div>');
 if(r){
  const lbl={ok:'OK',warn:'WARN',bad:'FAIL'};
  L.push('<h2>Game environment</h2><div class="card">');
  [['gta_sa.exe',r.exe],['ASI loader',r.asi],['Mod Loader',r.ml],['Limit adjuster',r.lim]].forEach(([k,x])=>{
   L.push('<div class="chk"><span class="st '+x.state+'">'+lbl[x.state]+'</span><div><b>'+h(k)+'</b> - '+h(x.title)
    +(x.detail?'<small>'+h(x.detail)+'</small>':'')+(x.meta?'<small>'+h(x.meta)+'</small>':'')+'</div></div>')});
  const have=r.ess.filter(x=>x.where),miss=r.ess.filter(x=>!x.where);
  L.push('<details style="margin-top:8px"><summary style="padding-left:0"><span class="n">Essentials: '+have.length+' of '+r.ess.length+' found</span></summary>');
  have.forEach(x=>L.push('<div class="chk"><span class="st ok">OK</span><div>'+h(x.name)+'<small>'+h(x.where)+'</small></div></div>'));
  miss.forEach(x=>L.push('<div class="chk"><span class="st bad">--</span><div>'+h(x.name)+'<small>'+(S.essIgn.includes(x.id)?'missing (ignored by user)':'MISSING')+'</small></div></div>'));
  L.push('</details></div>')}
 L.push('<h2>File conflicts ('+d.conflicts.length+')</h2><div class="card">');
 if(d.conflicts.length)d.conflicts.forEach(c=>L.push('<div class="cf"><code>'+h(c.file)+'</code><small>wins: <b>'+h(c.mods[0].m.name)+'</b> (P'+h(c.mods[0].pr)+') &mdash; overrides: '+c.mods.slice(1).map(x=>h(x.m.name)+' (P'+h(x.pr)+')').join(', ')+'</small></div>'));
 else L.push('<div class="empty">No active mods provide the same file.</div>');
 L.push('</div>',
  '<div class="bar"><input id="q" type="search" placeholder="Filter mods or files..." autofocus><button id="eo">Expand all</button><button id="ec">Collapse all</button></div>',
  '<h2>Active mods ('+d.act.length+') &mdash; higher priority wins</h2><div id="act">',
  d.act.length?d.act.map(modEl).join(''):'<div class="empty">None</div>','</div>',
  '<h2>Inactive mods ('+d.off.length+')</h2><div id="off">',
  d.off.length?d.off.map(modEl).join(''):'<div class="empty">None</div>','</div>',
  '</main><script>',
  '(function(){var q=document.getElementById("q"),m=[].slice.call(document.querySelectorAll(".mod"));',
  'q.oninput=function(){var v=q.value.trim().toLowerCase();m.forEach(function(e){var any=false;[].forEach.call(e.querySelectorAll("li[data-p]"),function(l){var h=!!v&&l.getAttribute("data-p").toLowerCase().indexOf(v)>=0;l.classList.toggle("hit",h);if(h)any=true});var hit=!v||e.querySelector("summary").textContent.toLowerCase().indexOf(v)>=0||any;e.hidden=!hit;if(v&&hit)e.open=true;if(v)[].forEach.call(e.querySelectorAll(".dir"),function(d){d.open=!!d.querySelector("li.hit")})})};',
  'document.getElementById("eo").onclick=function(){m.forEach(function(e){if(!e.hidden){e.open=true;[].forEach.call(e.querySelectorAll(".dir"),function(d){d.open=true})}})};',
  'document.getElementById("ec").onclick=function(){m.forEach(function(e){e.open=false;[].forEach.call(e.querySelectorAll(".dir"),function(d){d.open=false})})};})();',
  '<\/script></body></html>');
 return L.join('\n')}

/* ---- buttons ------------------------------------------------------------------------ */
async function exportPrep(){
 if(!S.mods.length){toast('Scan a GTA folder first');return false}
 if(!VC.res&&(root||game)){try{await runChecks()}catch(x){}}
 return true}

/* kind: 'txt' (no subfolders), 'txt-tree' (with subfolders), 'html' (full report). Shift = copy the .txt to the clipboard. */
async function exportRun(kind,shift){
 if(!await exportPrep())return;
 if(kind==='html'){
  let html;try{html=exportHtml()}catch(x){toast('Export failed: '+x.message);return}
  try{const f=await saveAs(exportName(exportData(),'html'),html,'HTML file');if(f)toast('Saved '+f)}catch(x){toast('Saving failed: '+x.message)}
  return}
 let txt;try{txt=exportReport(kind==='txt-tree')}catch(x){toast('Export failed: '+x.message);return}
 if(shift){try{if(!await nCopy(txt))throw new Error('the clipboard is not available');toast('Mod list copied to clipboard')}catch(x){toast('Copy failed: '+x.message)}return}
 try{const f=await saveAs(exportName(exportData(),'txt'),txt,'Text file');if(f)toast('Saved '+f)}catch(x){toast('Saving failed: '+x.message)}}

function expMenuClose(){$('#expm').hidden=true;$('#expmore').setAttribute('aria-expanded','false')}
$('#expbtn').onclick=e=>{expMenuClose();exportRun('txt',e.shiftKey)};
$('#expmore').onclick=e=>{
 e.stopPropagation();
 const open=$('#expm').hidden;
 expMenuClose();
 if(open){$('#expm').hidden=false;$('#expmore').setAttribute('aria-expanded','true')}};
$('#expm').onclick=e=>{
 const it=e.target.closest('.ddi');if(!it)return;
 expMenuClose();exportRun(it.dataset.x,e.shiftKey&&it.dataset.x!=='html')};
document.addEventListener('click',e=>{if(!$('#expd').contains(e.target))expMenuClose()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')expMenuClose()});
