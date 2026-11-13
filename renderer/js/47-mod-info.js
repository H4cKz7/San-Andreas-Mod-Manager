/* SA Mod Manager - 47-mod-info.js: per-mod source page, version, notes and tags, update check for GitHub sources, import / export */
/* Classic script: loaded in order by index.html, shares globals with the other files. */
/* Everything is kept in ONE JSON file per installation (<userData>/mod-info/<installation>.json, keyed by mod folder name),
   so mod folders stay clean and nothing extra is scanned or copied. Same place and pattern as the Trash index.
   The page never talks to GitHub itself: main.js answers 'mod-latest' (window.__native.modLatest). */
const MI_GH=/^https?:\/\/(?:www\.)?github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:[\/#?]|$)/i;
const miV=s=>/^\d/.test(s)?'v'+s:s;
const miNum=s=>{const m=/\d+(?:\.\d+)*/.exec(String(s||''));return m?m[0].split('.').map(Number):null};
const miNewer=(a,b)=>{const x=miNum(a),y=miNum(b);if(!x||!y)return false;for(let i=0;i<Math.max(x.length,y.length);i++){const d=(x[i]||0)-(y[i]||0);if(d)return d>0}return false};
/* "github.com/user/repo" without the scheme is accepted */
const miUrl=v=>{v=String(v||'').trim();return v&&!/^[a-z][a-z0-9+.-]*:/i.test(v)&&/^[\w-]+(\.[\w-]+)+\//.test(v)?'https://'+v:v};
const miTags=a=>{const out=[];(Array.isArray(a)?a:[]).forEach(t=>{t=String(t==null?'':t).replace(/[,#\u0000-\u001f]/g,' ').replace(/\s+/g,' ').trim().slice(0,24);
 if(t&&out.length<12&&!out.some(x=>x.toLowerCase()===t.toLowerCase()))out.push(t)});return out};
/* one entry: {url, ver, notes, tags[], latest?, lurl?, lat?}. latest / lurl / lat are the last GitHub result and are never exported. */
const miClean=(e,keepLatest)=>{if(!e||typeof e!=='object')return null;
 const s=(v,n)=>typeof v==='string'?v.trim().slice(0,n):'',u=s(e.url,500),o={};
 o.url=/^https?:\/\//i.test(u)?u:'';o.ver=s(e.ver,40);o.notes=typeof e.notes==='string'?e.notes.replace(/\r\n?/g,'\n').trim().slice(0,2000):'';o.tags=miTags(e.tags);
 if(keepLatest&&typeof e.latest==='string'&&e.latest.trim()){o.latest=e.latest.trim().slice(0,60);
  if(typeof e.lurl==='string'&&/^https:\/\/github\.com\//i.test(e.lurl))o.lurl=e.lurl.slice(0,500);
  if(Number.isFinite(e.lat))o.lat=e.lat}
 return(o.url||o.ver||o.notes||o.tags.length)?o:null};
const MI={_k:null,_d:null,
 file(){return pathN.join(window.__native.userData,'mod-info',(S.curInst||'default')+'.json')},
 all(){const k=this.file();if(this._k!==k){this._k=k;this._d=Object.create(null);this._g=Object.create(null);
   try{const j=JSON.parse(fsN.readFileSync(k,'utf8')),m=(j&&j.mods)||{};if(j&&j.groups&&typeof j.groups==='object')Object.keys(j.groups).forEach(n=>{if(typeof j.groups[n]==='boolean')this._g[n]=j.groups[n]});Object.keys(m).forEach(n=>{const c=miClean(m[n],true);if(c)this._d[n]=c})}catch(e){}}
  return this._d},
 get(n){return this.all()[n]||null},
 grp(n){this.all();return this._g[n]},
 setGrp(n,v){this.all();if(typeof v==='boolean')this._g[n]=v;else delete this._g[n];this.write()},
 put(n,e){const d=this.all();if(e)d[n]=e;else delete d[n];this.write()},
 set(o){this._k=this.file();this._d=o;this.write()},
 write(){try{const f=this.file();fsN.mkdirSync(pathN.dirname(f),{recursive:true});
   fsN.writeFileSync(f,JSON.stringify({app:'SA Mod Manager',kind:'mod-info',version:1,mods:this.all(),groups:this._g||{}},null,1))}
  catch(e){toast('Couldn’t save the mod info: '+e.message)}}};
const miUpd=e=>!!e&&!!e.ver&&!!e.latest&&miNewer(e.latest,e.ver);
const miAllTags=()=>{const c=new Map(),d=MI.all();
 Object.keys(d).forEach(n=>d[n].tags.forEach(t=>{const k=t.toLowerCase(),o=c.get(k);if(o)o.n++;else c.set(k,{t,n:1})}));
 return[...c.values()].sort((a,b)=>b.n-a.n||a.t.localeCompare(b.t)).map(x=>x.t)};
/* chips shown in a mod row (called from render() in 02-modlist.js) */
// SAMM-NESTED-INFO: info line (version, tags, note) under the mod name. k = key of the entry: a top-level mod name, or "Group/Mod" for a mod inside a group folder.
const MI_NOTE='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 2.5h7l3 3v8H3z"/><path d="M5.5 8h5M5.5 10.5h3.5"/></svg>';
// SAMM-NESTED-INFO-3: the info is built from segments (update, version, tags, note), the CSS draws the strip and the dividers
// SAMM-NESTED-INFO-5: max = how many tags are shown before the rest collapse into a "+N" chip (3 on a mod row and on a folder row)
// SAMM-NESTED-INFO-6: max = most tags shown, bud = rough character budget for the tags (long tags use it up faster); the rest collapse into "+N"
function miChips(k,e,max,bud){const K=esc(k),seg=(c,x)=>`<span class="mi-seg ${c}">${x}</span>`,mx=max||3,bd=bud||26;let h='';
 if(miUpd(e))h+=seg('mi-s-up',`<span class="mi-c mi-up" data-mi="rel" data-mk="${K}" title="A newer version is on GitHub. Click to open the release page">↑ Update ${esc(miV(e.latest))}</span>`);
 if(e.ver)h+=seg('mi-s-ver',`<span class="mi-ver" title="Installed version ${esc(miV(e.ver))}">${esc(miV(e.ver))}</span>`);
 if(e.tags.length){let n=0,w=0;
  while(n<e.tags.length&&n<mx){const l=Math.min(e.tags[n].length,14)+2;if(n&&w+l>bd)break;w+=l;n++}
  const rest=e.tags.slice(n);
  h+=seg('mi-s-tg',e.tags.slice(0,n).map(t=>`<span class="mi-c mi-tg" data-mi-tag="${esc(t)}" title="Show only mods tagged “${esc(t)}”"><span class="mi-h">#</span>${esc(t)}</span>`).join('')
   +(rest.length?`<span class="mi-c mi-more" data-mi="edit" data-mk="${K}" data-more="${esc(JSON.stringify(rest))}">+${rest.length}</span>`:''))}
 if(e.notes){const f=e.notes.split('\n')[0].trim().slice(0,70);
  h+=seg('mi-s-note',`<span class="mi-c mi-note" data-mi="edit" data-mk="${K}" title="${esc(e.notes.slice(0,240))}">${MI_NOTE}<span>${esc(f)}</span></span>`)}
 return h}
// chips of a mod row (called from render() in 02-modlist.js); a group folder also says how many mods inside it have info
/* SAMM-NAME-INFO: the strip alone (shown beside the name) and the group counter alone (shown under the chips) */
function miLine(n){const e=MI.get(n),h=e?miChips(n,e,2,20):'';return h?'<div class="mi-line">'+h+'</div>':''}
function miSub(n){const c=Object.keys(MI.all()).filter(k=>k.startsWith(n+'/')&&miAlive(k)).length;
 return c?`<div class="mi-sub" title="Mod folders inside this folder that have source, version, notes or tags">${c} mod${c===1?'':'s'} with info</div>`:''}
function miMeta(n){const e=MI.get(n);let h=e?miChips(n,e):'';
 const c=Object.keys(MI.all()).filter(k=>k.startsWith(n+'/')&&miAlive(k)).length;
 return(h?'<div class="mi-line">'+h+'</div>':'')+(c?`<div class="mi-sub" title="Mod folders inside this folder that have source, version, notes or tags">${c} mod${c===1?'':'s'} with info</div>`:'')}
/* the search box also finds tags, notes, versions and source pages; "#tag" matches tags only */
function miMatch(n,q){if(!q)return false;const d=MI.all(),one=e=>{
  if(q[0]==='#'){const t=q.slice(1).trim();return!!t&&e.tags.some(x=>x.toLowerCase().includes(t))}
  return e.tags.some(x=>x.toLowerCase().includes(q))||e.notes.toLowerCase().includes(q)||e.ver.toLowerCase().includes(q)||e.url.toLowerCase().includes(q)};
 return Object.keys(d).some(k=>(k===n||k.startsWith(n+'/'))&&one(d[k]))}
/* SAMM-TAG-SUBFOLDERS: while the search box holds "#tag", an expanded group mod only lists the mod folders inside it that carry the tag.
   Returns null (show everything) or a function(file) -> bool. Everything is shown when the group itself carries the tag or no subfolder does. */
function miTagFilter(m){const v=($('#q')?$('#q').value:'').toLowerCase();if(v[0]!=='#')return null;const t=v.slice(1).trim();if(!t)return null;
 const d=MI.all(),has=e=>!!e&&e.tags.some(x=>x.toLowerCase().includes(t));
 if(has(d[m.name]))return null;
 const pre=m.name+'/',ks=Object.keys(d).filter(k=>k.startsWith(pre)&&has(d[k])).map(k=>k.slice(pre.length)+'/');
 if(!ks.length)return null;
 return f=>ks.some(r=>f.startsWith(r))}
/* ---- Info dialog ---- */
const MID={name:'',tags:[],latest:'',lurl:'',lat:0,lfor:'',err:'',prev:null};
function midDraw(){const url=miUrl($('#midurl').value),gh=MI_GH.test(url),ver=$('#midver').value.trim();
 $('#midchips').innerHTML=MID.tags.length?MID.tags.map((t,i)=>`<span class="chip">${esc(t)}<button type="button" data-r="${i}" aria-label="Remove">×</button></span>`).join(''):'<span class="stats">No tags yet</span>';
 const sug=miAllTags().filter(t=>!MID.tags.some(x=>x.toLowerCase()===t.toLowerCase())).slice(0,12);
 $('#midsugw').hidden=!sug.length;$('#midsug').innerHTML=sug.map(t=>`<span class="tag mi" role="button" tabindex="0" data-sug="${esc(t)}">${esc(t)}</span>`).join('');
 $('#midopen').disabled=!/^https?:\/\//i.test(url);$('#midcheck').hidden=!gh;
 let s;
 if(!url)s='Add the page you downloaded the mod from to keep track of it.';
 else if(!gh)s='Automatic update checks only work for GitHub links. For other sites, open the page, look for a newer version yourself and update the version here.';
 else if(MID.err)s=MID.err;
 else if(MID.latest)s='Latest on GitHub: '+miV(MID.latest)+(MID.lat?' (checked '+new Date(MID.lat).toLocaleDateString()+')':'')+(!ver?'. Set your installed version to compare.':miNewer(MID.latest,ver)?'. Newer than yours.':'. You have the latest.');
 else s='Not checked yet.';
 $('#midlat').textContent=s;
 $('#midmark').hidden=!(MID.latest&&gh&&ver!==MID.latest.replace(/^v/i,''))}
function miOpen(n){const cur=MI.get(n),e=cur||{};
 MID.name=n;MID.prev=cur?JSON.parse(JSON.stringify(cur)):null;MID.tags=[...(e.tags||[])];
 MID.latest=e.latest||'';MID.lurl=e.lurl||'';MID.lat=e.lat||0;MID.lfor=e.latest?(e.url||''):'';MID.err='';
 $('#midnm').textContent=n;$('#midurl').value=e.url||'';$('#midver').value=e.ver||'';$('#midnotes').value=e.notes||'';$('#midtag').value='';
 $('#midclr').disabled=!cur;miGrpUi(n);midDraw();$('#mid').showModal();$('#midurl').focus()}
function miAddTag(v){const before=MID.tags.length;MID.tags=miTags([...MID.tags,...String(v).split(',')]);$('#midtag').value='';
 if(MID.tags.length>=12&&MID.tags.length===before)toast('Up to 12 tags per mod');midDraw()}
function miSave(){const url=miUrl($('#midurl').value);
 if(url&&!/^https?:\/\//i.test(url)){toast('The source page has to start with https://');$('#midurl').focus();return}
 if($('#midtag').value.trim())miAddTag($('#midtag').value);
 const keep=!!MID.latest&&MID.lfor===url,n=MID.name,prev=MID.prev,
  e=miClean({url,ver:$('#midver').value,notes:$('#midnotes').value,tags:MID.tags,latest:keep?MID.latest:'',lurl:keep?MID.lurl:'',lat:keep?MID.lat:0},true);
 const pg=MI.grp(n);miGrpSave(n);MI.put(n,e);$('#mid').close();render();
 toast(e?'Mod info saved':'Mod info cleared',()=>{MI.put(n,prev);if(MI.grp(n)!==pg)MI.setGrp(n,pg);render()})}
async function miLookup(url){const m=MI_GH.exec(url||'');if(!m)return{error:'Not a GitHub link.'};
 try{return await window.__native.modLatest(m[1],m[2])}catch(e){return{error:String((e&&e.message)||e)}}}
$('#midurl').addEventListener('input',()=>{const u=miUrl($('#midurl').value);if(u!==MID.lfor){MID.latest='';MID.lurl='';MID.lat=0;MID.err=''}midDraw()});
$('#midver').addEventListener('input',midDraw);
$('#midcheck').onclick=async()=>{const u=miUrl($('#midurl').value),b=$('#midcheck');if(!MI_GH.test(u))return;
 b.disabled=true;b.textContent='Checking…';const r=await miLookup(u);b.disabled=false;b.textContent='Check now';
 if(r&&r.ok){MID.latest=r.tag;MID.lurl=r.url;MID.lat=Date.now();MID.lfor=u;MID.err=''}else MID.err=(r&&r.error)||'The check failed.';midDraw()};
$('#midtag').onkeydown=e=>{if(e.key==='Enter'||e.key===','){e.preventDefault();if(e.target.value.trim())miAddTag(e.target.value)}};
$('#midtagadd').onclick=()=>{if($('#midtag').value.trim())miAddTag($('#midtag').value)};
$('#midchips').onclick=e=>{const b=e.target.closest('button');if(!b)return;MID.tags.splice(+b.dataset.r,1);midDraw()};
$('#midsug').onclick=e=>{const s=e.target.closest('[data-sug]');if(s)miAddTag(s.dataset.sug)};
$('#midsug').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){const s=e.target.closest('[data-sug]');if(s){e.preventDefault();miAddTag(s.dataset.sug)}}};
$('#midopen').onclick=()=>{const u=miUrl($('#midurl').value);if(/^https?:\/\//i.test(u))window.__native.openExternal(u)};
$('#midmark').onclick=()=>{$('#midver').value=MID.latest.replace(/^v/i,'');midDraw()};
$('#midcx').onclick=()=>$('#mid').close();$('#midok').onclick=miSave;
$('#midclr').onclick=()=>{const n=MID.name,prev=MID.prev;MI.put(n,null);$('#mid').close();render();toast('Mod info cleared',()=>{MI.put(n,prev);render()})};
/* clicks inside the mod list: Info button, tag chips (filter), Note chip (edit), Update chip (release page).
   Capture phase + stopPropagation so the selection / row handlers never see these clicks. */
$('#list').addEventListener('click',e=>{const a=e.target.closest('[data-a="info"],[data-mi],[data-mi-tag]');if(!a)return;
 const el=a.closest('.mod'),m=el&&S.mods[el.dataset.i];if(!m)return;e.stopPropagation();
 if(a.dataset.miTag!=null){const q=$('#q'),v='#'+a.dataset.miTag;q.value=q.value.toLowerCase()===v.toLowerCase()?'':v;render();return}
 if(a.dataset.mi==='rel'){const x=MI.get(a.dataset.mk||m.name);window.__native.openExternal((x&&(x.lurl||x.url))||'');return}
 miOpen(a.dataset.mk||m.name)},true);
/* ---- update check (GitHub sources only) ---- */
async function miCheck(){if(miCheck.busy)return;
 const d=MI.all(),k=MI.file(),names=Object.keys(d).filter(n=>miAlive(n)&&MI_GH.test(d[n].url||''));
 if(!names.length)return toast('No GitHub source pages saved yet. Add one in a mod’s Info dialog');
 miCheck.busy=true;let i=0,found=0,fail=0,limited=false;
 toast(`Checking ${names.length} mod${names.length===1?'':'s'} on GitHub…`);
 const work=async()=>{while(i<names.length&&!limited){const e=d[names[i++]],r=await miLookup(e.url);
   if(r&&r.ok){e.latest=r.tag;e.lurl=r.url;e.lat=Date.now();if(miUpd(e))found++}else{fail++;if(r&&r.limited)limited=true}}};
 try{await Promise.all([work(),work(),work()])}finally{miCheck.busy=false}
 if(MI.file()===k)MI.write();render();
 toast(limited?'GitHub is limiting requests right now. Try again later':found?`${found} update${found===1?'':'s'} found`:fail?`No updates found (${fail} could not be checked)`:'All GitHub mods are up to date')}
/* ---- export / import (one .json file) ---- */
async function miExport(){const d=MI.all(),o=Object.create(null);
 Object.keys(d).forEach(n=>{const e=miClean(d[n]);if(e)o[n]=e});const c=Object.keys(o).length;
 if(!c)return toast('No mod info saved yet');
 try{const p=await window.__native.saveFile('samm-mod-info.json',JSON.stringify({app:'SA Mod Manager',kind:'mod-info',version:1,exported:new Date().toISOString(),mods:o},null,1));
  if(p)toast(`Exported the info of ${c} mod${c===1?'':'s'}`)}
 catch(e){notice('Couldn’t export the mod info',e.message)}}
function miImport(){const i=document.createElement('input');i.type='file';i.accept='.json,application/json';
 i.onchange=async()=>{const f=i.files[0];if(!f)return;let j;
  try{j=JSON.parse(await f.text())}catch(e){return notice('Couldn’t import the mod info','That file is not valid JSON.')}
  const src=j&&j.kind==='mod-info'&&j.mods&&typeof j.mods==='object'&&!Array.isArray(j.mods)?j.mods:null;
  if(!src)return notice('Couldn’t import the mod info','This is not a mod info file made by SA Mod Manager.');
  const inc=Object.create(null);Object.keys(src).forEach(n=>{const e=miClean(src[n]);if(e&&miKeyOk(n))inc[n]=e});
  const names=Object.keys(inc);if(!names.length)return notice('Nothing to import','The file has no mod info in it.');
  const have=new Set(S.mods.map(m=>m.name)),here=names.filter(n=>have.has(n)).length;
  const ch=await ask({title:`Import the info of ${names.length} mod${names.length===1?'':'s'}?`,
   text:`${here} of them match mods in this installation. The others are kept for when you install them.\n\nMerge: entries from the file replace the saved info of the same mod, everything else stays.\nReplace all: the info you have saved now is deleted first.`,ok:'Merge',alt:'Replace all'});
  if(!ch)return;
  const old=MI.all(),snap=Object.assign(Object.create(null),old),next=ch==='alt'?Object.create(null):Object.assign(Object.create(null),old);
  names.forEach(n=>{const o=old[n],e=inc[n];if(o&&o.latest&&o.url===e.url){e.latest=o.latest;if(o.lurl)e.lurl=o.lurl;if(o.lat)e.lat=o.lat}next[n]=e});
  MI.set(next);render();toast(`Imported the info of ${names.length} mod${names.length===1?'':'s'}`,()=>{MI.set(snap);render()})};
 i.click()}
/* SAMM-INSTALL-INFO: tags and notes in the Install dialog (fields #mitag / #michips / #misug / #minotes in index.html) */
const MIT={tags:[]};
function miiDraw(){const c=$('#michips');if(!c)return;
 c.innerHTML=MIT.tags.map(function(t,i){return '<span class="chip">'+esc(t)+'<button type="button" data-r="'+i+'" aria-label="Remove">\u00d7</button></span>'}).join('');
 const sug=miAllTags().filter(function(t){return !MIT.tags.some(function(x){return x.toLowerCase()===t.toLowerCase()})}).slice(0,12);
 $('#misugw').hidden=!sug.length;
 $('#misug').innerHTML=sug.map(function(t){return '<span class="tag mi" role="button" tabindex="0" data-sug="'+esc(t)+'">'+esc(t)+'</span>'}).join('')}
function miiAdd(v){const before=MIT.tags.length;MIT.tags=miTags(MIT.tags.concat(String(v).split(',')));$('#mitag').value='';
 if(MIT.tags.length>=12&&MIT.tags.length===before)toast('Up to 12 tags per mod');miiDraw()}
function miiReset(){MIT.tags=[];const t=$('#mitag'),n=$('#minotes');if(t)t.value='';if(n)n.value='';miiDraw()}
/* an existing mod keeps its notes; new text is added below them (nothing is lost, nothing is added twice) */
const miMergeNotes=function(a,b){a=(a||'').trim();b=(b||'').trim();return !b?a:(!a||a.indexOf(b)>=0)?(a||b):a+'\n\n'+b};
$('#mitag').addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===','){e.preventDefault();e.stopPropagation();if(e.target.value.trim())miiAdd(e.target.value)}});
$('#mitagadd').onclick=function(){if($('#mitag').value.trim())miiAdd($('#mitag').value)};
$('#michips').addEventListener('click',function(e){const b=e.target.closest('[data-r]');if(!b)return;MIT.tags.splice(+b.dataset.r,1);miiDraw()});
$('#misug').addEventListener('click',function(e){const s=e.target.closest('[data-sug]');if(s)miiAdd(s.dataset.sug)});
$('#misug').addEventListener('keydown',function(e){if(e.key!=='Enter'&&e.key!==' ')return;const s=e.target.closest('[data-sug]');if(s){e.preventDefault();miiAdd(s.dataset.sug)}});
/* ---- hooks used by other files ---- */
/* 21-installer.js: optional source page + version fields of the Install dialog (the version is guessed from the file name) */
function miPrefill(name){const u=$('#misrc'),v=$('#miver');if(u)u.value='';miiReset();
 if(v){const m=/(?:^|[^a-z0-9])v?(\d+(?:\.\d+){1,3}[a-z]?)(?![\d.])/i.exec(String(name||''));v.value=m?m[1]:''}}
function miInstalled(n,nest){const u=miUrl(($('#misrc')||{}).value),v=(($('#miver')||{}).value||'').trim();
 const pt=(($('#mitag')||{}).value||'').trim(),tg=miTags(MIT.tags.concat(pt?pt.split(','):[])),nt=(($('#minotes')||{}).value||'').trim();
 if(!n||nest||(!u&&!v&&!tg.length&&!nt))return;
 if(u&&!/^https?:\/\//i.test(u))toast('The source page was not saved: it has to start with https://');
 const c=MI.get(n)||{},url=/^https?:\/\//i.test(u)?u:(c.url||''),same=url===(c.url||'');
 MI.put(n,miClean({url,ver:v||c.ver,notes:miMergeNotes(c.notes,nt),tags:miTags((c.tags||[]).concat(tg)),latest:same?c.latest:'',lurl:same?c.lurl:'',lat:same?c.lat:0},true))}
/* 23-trash.js: a mod deleted for good from the Trash takes its info with it (unless a mod of that name exists or is still in the Trash) */
function miForget(names){const d=MI.all(),tr=TR.list().map(x=>x.rel?x.mod+'/'+x.rel:x.mod);let ch=false;
 const kept=k=>miAlive(k)||tr.some(t=>k===t||k.startsWith(t+'/'));
 names.forEach(n=>Object.keys(d).forEach(k=>{if((k===n||k.startsWith(n+'/'))&&!kept(k)){delete d[k];ch=true}}));
 if(ch)MI.write()}
$('#miupd').onclick=()=>miCheck();$('#miexp').onclick=()=>miExport();$('#miimp').onclick=()=>miImport();
/* ---- reports (28-export.js) and copying a whole mod by drag & drop (26-dnd.js) ---- */
/* .txt export: version, tags and source page. Notes stay out of it, the file is made for sharing. */
function miText(n){const e=MI.get(n);if(!e)return[];const a=[],p=[];
 if(e.ver)p.push('Version '+e.ver);if(e.tags.length)p.push('Tags: '+e.tags.join(', '));if(p.length)a.push(p.join('  |  '));
 if(e.url)a.push('Source: '+e.url);return a}
/* .html report (debugging): chips in the mod header plus a block with source, version and notes. h = the report's own escape function. */
function miHtml(n,h){const o=miHtmlOne(n,h),subs=miSubKeys(n);
 if(!subs.length)return o;
 const body=subs.map(k=>{const e=MI.get(k),q=miHtmlOne(k,h),inner=q.body?q.body.slice(16,-6):'';
  return'<div class="mi"><div><span>Mod</span> <b>'+h(k.slice(n.length+1))+'</b></div>'+(e.tags.length?'<div><span>Tags</span> '+e.tags.map(t=>'#'+h(t)).join(' ')+'</div>':'')+inner+'</div>'}).join('');
 return{sum:o.sum+'<span class="tg">'+subs.length+' with info</span>',body:o.body+body}}
// SAMM-NESTED-INFO-2: one entry of the .html report
function miHtmlOne(n,h){const e=MI.get(n);if(!e)return{sum:'',body:''};
 const sum=(e.ver?'<span class="tg">'+h(miV(e.ver))+'</span>':'')+(miUpd(e)?'<span class="tag">update '+h(miV(e.latest))+'</span>':'')+e.tags.map(t=>'<span class="tg">#'+h(t)+'</span>').join('');
 let b='';
 if(e.url)b+='<div><span>Source</span> <a href="'+h(e.url)+'" rel="noopener noreferrer">'+h(e.url)+'</a></div>';
 if(e.ver)b+='<div><span>Version</span> '+h(e.ver)+'</div>';
 if(e.notes)b+='<div><span>Notes</span><pre>'+h(e.notes)+'</pre></div>';
 return{sum,body:b?'<div class="mi">'+b+'</div>':''}}
/* a copied mod folder ("Name (copy)") starts with the info of the original */
function miCopied(from,to){const e=MI.get(from);if(e&&!MI.get(to))MI.put(to,JSON.parse(JSON.stringify(e)))}

// ===== SAMM-NESTED-INFO: mod info for mods inside group folders ("Level 1", "Level 2", ...) =====
// A mod folder inside a group is keyed by its path: "Level 1/Some Mod". Top-level mods keep their plain name, so nothing saved before changes.
// How folders are told apart (per top-level folder, from its file list):
// - a folder that directly holds files is a mod
// - a folder with no files of its own and 2+ sub-folders that are not typical GTA folders (cleo, data, models ...) is a group
// - anything else (only cleo / data / models ... inside) is a mod
// A top-level group is detected automatically; the Info dialog of a top-level folder has a tick box to override it.
const MI_STRUCT=new Set(['cleo','cleo_text','cleo_modules','data','models','model','audio','anim','text','movies','maps','scripts','plugins','texdb','txd','stream','sfx','radio','fonts','shaders','docs','doc','documentation','readme','readmes','screenshots','extras','optional','source','src','config','configs']);
function miNodes(m){if(m._mf===m.files&&m._mn)return m._mn;const nodes=new Map(),get=p=>{let n=nodes.get(p);if(!n){n={f:0,c:new Set()};nodes.set(p,n)}return n};
 get('');
 m.files.forEach(f=>{const ps=f.split('/');ps.pop();get(ps.join('/')).f++;
  for(let i=0;i<ps.length;i++){get(ps.slice(0,i).join('/')).c.add(ps[i]);get(ps.slice(0,i+1).join('/'))}});
 m._mf=m.files;m._mn=nodes;return nodes}
// 'mod' | 'group' | '' for a folder path of a top-level mod ('' = the top-level folder itself)
function miKind(m,p){const n=miNodes(m).get(p);if(!n)return'';
 if(n.f>0)return'mod';
 if([...n.c].filter(x=>!MI_STRUCT.has(x.toLowerCase())).length>=2)return'group';
 return n.c.size?'mod':''}
function miIsGroup(m){const g=MI.grp(m.name);return typeof g==='boolean'?g:miKind(m,'')==='group'}
// the key under which the info of folder p (inside top-level mod m) is saved, or '' when p is not a mod inside a group
function miSubKey(m,p){if(!p||!miIsGroup(m))return'';const ps=p.split('/');
 for(let i=1;i<ps.length;i++)if(miKind(m,ps.slice(0,i).join('/'))!=='group')return'';
 return miKind(m,p)==='mod'?m.name+'/'+p:''}
// an entry is alive while its folder exists (info of mods that are not installed is kept, but never counted)
function miAlive(k){const i=k.indexOf('/'),m=S.mods.find(x=>x.name===(i<0?k:k.slice(0,i)));if(!m)return false;if(i<0)return true;
 const r=k.slice(i+1)+'/';return m.files.some(f=>f.startsWith(r))}
const miKeyOk=n=>!!n&&n===n.trim()&&!/[\\:*?"<>|]/.test(n)&&n.split('/').every(s=>s&&s!=='.'&&s!=='..');
// info button + info line on a folder row of the file tree (called from treeBody() in 02-modlist.js)
function miSubRow(m,p){const k=miSubKey(m,p)||(MI.get(m.name+'/'+p)?m.name+'/'+p:'');if(!k)return'';const e=MI.get(k);
 return`${e?'<span class="mi-line mi-in">'+miChips(k,e,2,20)+'</span>':''}<button data-a="info"${e?' class="mi-has"':''} data-mk="${esc(k)}" title="Source page, version, notes and tags of this mod folder">Info</button>`}
// tick box in the Info dialog of a top-level folder
function miGrpUi(n){const w=$('#migrp'),cb=$('#migrpcb');if(!w||!cb)return;
 const m=n.indexOf('/')<0&&S.mods.find(x=>x.name===n),ok=!!m&&miNodes(m).get('').c.size>0;w.hidden=!ok;if(ok)cb.checked=miIsGroup(m)}
function miGrpSave(n){const w=$('#migrp'),cb=$('#migrpcb');if(!w||!cb||w.hidden||n.indexOf('/')>=0)return;
 const m=S.mods.find(x=>x.name===n);if(!m)return;const want=cb.checked===(miKind(m,'')==='group')?undefined:cb.checked;
 if(MI.grp(n)!==want)MI.setGrp(n,want)}
// a folder was moved or copied (26-dnd.js): its info, and the info of everything inside it, goes along
function miMoved(from,to,copy){if(!from||!to||from===to)return;const d=MI.all();let ch=false;
 Object.keys(d).forEach(k=>{if(k!==from&&!k.startsWith(from+'/'))return;const nk=to+k.slice(from.length);
  if(copy&&nk in d)return;d[nk]=JSON.parse(JSON.stringify(d[k]));if(!copy)delete d[k];ch=true});
 const g=MI._g;if(g&&from in g&&from.indexOf('/')<0){if(copy){if(to.indexOf('/')<0&&!(to in g)){g[to]=g[from];ch=true}}else{if(to.indexOf('/')<0&&!(to in g))g[to]=g[from];delete g[from];ch=true}}
 if(ch)MI.write()}

// ===== SAMM-NESTED-INFO-2: exports =====
// keys of the mods inside group folder n that have saved info and still exist, sorted by name
function miSubKeys(n){return Object.keys(MI.all()).filter(k=>k.startsWith(n+'/')&&miAlive(k)).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true,sensitivity:'base'}))}
// .txt export: the info of the mods inside a group folder, one small block per mod
function miTextSub(n){const out=[];
 miSubKeys(n).forEach(k=>{const l=miText(k);if(l.length){out.push(k.slice(n.length+1));l.forEach(x=>out.push('  '+x))}});
 return out}
// SAMM-NESTED-INFO-4: Info button of a folder with saved info gets class mi-has

// ===== SAMM-NESTED-INFO-7: hover popup of the "+N" tag chip, the hidden tags in the accent colour =====
// SAMM-NESTED-INFO-8: fades in / out, stays open while the mouse is on the chip or on the popup, its tags filter the list when clicked
let miPop=null,miPopT=0;
function miPopHide(){clearTimeout(miPopT);if(miPop)miPop.classList.remove('show')}
function miPopLater(){clearTimeout(miPopT);miPopT=setTimeout(miPopHide,180)}
function miPopShow(chip){clearTimeout(miPopT);let tags;try{tags=JSON.parse(chip.dataset.more||'[]')}catch(x){return}if(!tags.length)return;
 if(!miPop){miPop=document.createElement('div');miPop.className='mi-pop';miPop.setAttribute('role','tooltip');document.body.appendChild(miPop);
  miPop.addEventListener('mouseenter',()=>clearTimeout(miPopT));miPop.addEventListener('mouseleave',miPopLater);
  miPop.addEventListener('click',e=>{const t=e.target.closest('[data-tag]');if(!t)return;
   const q=$('#q'),v='#'+t.dataset.tag;q.value=q.value.toLowerCase()===v.toLowerCase()?'':v;miPopHide();render()})}
 miPop.innerHTML='<span class="mi-pop-h">Also tagged</span>'+tags.map(t=>'<span class="mi-pop-t" role="button" data-tag="'+esc(t)+'"><span class="mi-h">#</span>'+esc(t)+'</span>').join('')+'<span class="mi-pop-f">Click a tag to filter the list</span>';
 const r=chip.getBoundingClientRect(),w=miPop.offsetWidth,h=miPop.offsetHeight;
 let x=Math.max(8,Math.min(innerWidth-w-8,r.left+r.width/2-w/2)),y=r.bottom+8,up=false;
 if(y+h>innerHeight-8){y=Math.max(8,r.top-h-8);up=true}
 miPop.style.left=Math.round(x)+'px';miPop.style.top=Math.round(y)+'px'; /* SAMM-NESTED-INFO-10 */miPop.classList.toggle('up',up);
 void miPop.offsetWidth;miPop.classList.add('show')}
// SAMM-NESTED-INFO-9: hover-intent delay before the popup opens
let miPopW=0;
$('#list').addEventListener('mouseover',e=>{const c=e.target.closest&&e.target.closest('.mi-more');if(!c)return;
 if(e.relatedTarget&&c.contains(e.relatedTarget))return;
 clearTimeout(miPopW);
 if(miPop&&miPop.classList.contains('show'))miPopShow(c);
 else miPopW=setTimeout(()=>{if(c.isConnected&&c.matches(':hover'))miPopShow(c)},350)});
$('#list').addEventListener('mouseout',e=>{const c=e.target.closest&&e.target.closest('.mi-more');if(c&&!(e.relatedTarget&&c.contains(e.relatedTarget))){clearTimeout(miPopW);miPopLater()}});
$('#list').addEventListener('click',()=>clearTimeout(miPopW),true);addEventListener('scroll',()=>clearTimeout(miPopW),true);
$('#list').addEventListener('click',miPopHide,true);
addEventListener('scroll',miPopHide,true);addEventListener('blur',miPopHide);addEventListener('keydown',miPopHide,true);
