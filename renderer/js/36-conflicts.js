/* SA Mod Manager - 36-conflicts.js: file conflict view, which mods contain the same file and which one wins */
/* Classic script: loaded in order by index.html, shares globals with the other files. */
/* SAMM-FEATURES. Files are compared by file name (Mod Loader replaces game files by name, whatever folder they are in).
   Winner = highest priority under the active profile (prio(), which includes the PriorityLimit). Equal priorities are shown as a tie. */
var CF={res:null,tm:0};
const CF_DATA=/\.(ide|ipl|dat|cfg)$/i;
function cfCompute(){
 E=eff();const by=new Map();let zero=0;
 for(const m of S.mods){
  if(!swOn(m.name)||exOther(m.name))continue;
  const pr=prio(m.name);if(pr<=0){zero++;continue}
  const seen=new Set();
  for(const f of m.files){
   if(JUNK.test(f)||isDoc(f)||fileIgnored(m,f))continue;
   const b=f.split('/').pop().toLowerCase();if(seen.has(b))continue;seen.add(b);
   let a=by.get(b);if(!a)by.set(b,a=[]);a.push({mod:m.name,rel:f,pr})}}
 const rows=[];
 for(const[b,a]of by){if(a.length<2)continue;
  a.sort((x,y)=>y.pr-x.pr||x.mod.localeCompare(y.mod,undefined,{numeric:true,sensitivity:'base'}));
  rows.push({key:b,name:a[0].rel.split('/').pop(),list:a,tie:a.filter(x=>x.pr===a[0].pr).length>1,data:CF_DATA.test(b)})}
 rows.sort((x,y)=>x.name.localeCompare(y.name,undefined,{numeric:true,sensitivity:'base'}));
 return{rows,zero}}
function cfRow(r){const w=r.list[0];
 return '<div class="cfr"><div class="cfn"><b>'+esc(r.name)+'</b>'+(r.tie?'<span class="tag warn">same priority</span>':'')+'</div>'
  +r.list.map(x=>{const t=x.pr===w.pr?(r.tie?'<span class="tag warn">tie</span>':'<span class="tag st">wins</span>'):'<span class="tag">overridden</span>';
   return '<div class="cfm'+(x.pr===w.pr?'':' lose')+'"><span class="cfp" title="Priority">'+x.pr+'</span><span class="nm">'+esc(x.mod)+'</span><span class="cfpath" title="'+esc(x.rel)+'">'+esc(x.rel)+'</span>'+t+'</div>'}).join('')+'</div>'}
function cfDraw(){const R=CF.res||(CF.res=cfCompute()),q=$('#cfq').value.trim().toLowerCase(),ties=$('#cfties').checked,cap=400;cfBtns();
 const rows=R.rows.filter(r=>(!ties||r.tie)&&(!CF.sh.size||CF.sh.has(cfExt(r.key)))&&!CF.hd.has(cfExt(r.key))&&(!q||r.key.includes(q)||r.list.some(x=>x.mod.toLowerCase().includes(q)||x.rel.toLowerCase().includes(q))));
 const t=R.rows.filter(r=>r.tie).length;
 $('#cfinfo').textContent=R.rows.length+' file'+(R.rows.length===1?'':'s')+' in conflict'+(t?' · '+t+' with equal priority':'')+(rows.length!==R.rows.length?' · '+rows.length+' shown':'');
 $('#cflist').innerHTML=rows.slice(0,cap).map(cfRow).join('')+(rows.length>cap?'<div class="stats" style="padding:8px 10px">…and '+(rows.length-cap)+' more. Search to narrow the list.</div>':'')
  ||'<div class="stats" style="padding:10px">'+(R.rows.length?'No files match.':'No conflicts. Every file name comes from one mod only.')+'</div>';
 $('#cfnote2').textContent='Only mods that are on and have a priority above 0 are compared'+(R.zero?' ('+R.zero+' left out at priority 0)':'')+'. Files matched by “Ignored files” are left out. Data files (.ide, .ipl, .dat, .cfg) may be merged by Mod Loader instead of replaced.'}
function cfBadge(){const R=CF.res=cfCompute(),n=R.rows.length,t=R.rows.filter(r=>r.tie).length,c=$('#cfcnt'),nt=$('#cfnote'),b=$('#cfopen');
 if(c){c.textContent=n?String(n):'';c.className='cnt'+(t?' warn':'')}
 if(nt)nt.textContent=!S.mods.length?'Scan a GTA folder to see conflicts.':n?n+' file name'+(n===1?'':'s')+' appear in more than one mod'+(t?', '+t+' with equal priority':'')+'.':'No file name appears in more than one mod.';
 if(b)b.disabled=!S.mods.length;
 if($('#cfd').open){cfMenus();cfDraw()}}
const cfSoon=()=>{clearTimeout(CF.tm);CF.tm=setTimeout(cfBadge,500)};
document.body.insertAdjacentHTML('beforeend','<dialog id="cfd" class="cfdlg"><div class="lh"><h2>File conflicts</h2><span class="stats" id="cfinfo"></span><span style="flex:1"></span><button class="btn sm" id="cfx">Close</button></div>'
 +'<div class="stats">Mods that contain a file with the same name. Under the current profile the mod with the higher priority wins. Change priorities on the mod list.</div>'
 +'<div class="cftool"><input type="search" id="cfq" placeholder="Search files or mods"><label class="stats"><input type="checkbox" id="cfties">Only same priority</label><div class="cfdd"><button class="btn sm" data-cfm="cfshp" aria-haspopup="true" aria-expanded="false">Show: <span id="cfsht">All types</span> ▾</button><div class="cfmenu" id="cfshp" data-k="sh" hidden></div></div><div class="cfdd"><button class="btn sm" data-cfm="cfhdp" aria-haspopup="true" aria-expanded="false">Hide: <span id="cfhdt">Nothing</span> ▾</button><div class="cfmenu" id="cfhdp" data-k="hd" hidden></div></div></div>'
 +'<div class="cflist" id="cflist"></div><div class="stats" id="cfnote2" style="margin-top:8px"></div></dialog>');
$('#cfopen').onclick=()=>{CF.res=cfCompute();cfClose();cfMenus();cfDraw();$('#cfd').showModal()};
$('#cfx').onclick=()=>$('#cfd').close();
['#cfq','#cfties'].forEach(x=>$(x).addEventListener('input',cfDraw));
/* SAMM-FEATURES-2: file type filters for the conflict view. Show = only these types (empty = all types), Hide = never show these types.
   A type can only be in one of the two lists. The choice is saved in S.cfFil. */
const cfExt=k=>{const i=k.lastIndexOf('.');return i>0?k.slice(i+1):'(none)'};
const cfFe=x=>x==='(none)'?x:'.'+x;
S.cfFil=S.cfFil||{sh:[],hd:[]};CF.sh=new Set(S.cfFil.sh||[]);CF.hd=new Set(S.cfFil.hd||[]);
const cfSaveF=()=>{S.cfFil={sh:[...CF.sh],hd:[...CF.hd]};save()};
function cfLab(set,none){const a=[...set].sort();return a.length?(a.length<=2?a.map(cfFe).join(', '):cfFe(a[0])+', '+cfFe(a[1])+' +'+(a.length-2)):none}
function cfBtns(){const a=$('#cfsht'),b=$('#cfhdt');if(a)a.textContent=cfLab(CF.sh,'All types');if(b)b.textContent=cfLab(CF.hd,'Nothing')}
function cfMenus(){const R=CF.res||(CF.res=cfCompute()),cnt=new Map();
 R.rows.forEach(r=>{const e=cfExt(r.key);cnt.set(e,(cnt.get(e)||0)+1)});
 ['ide','ipl','dat','cfg',...CF.sh,...CF.hd].forEach(e=>{if(!cnt.has(e))cnt.set(e,0)});
 const exts=[...cnt].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
 [['sh','#cfshp'],['hd','#cfhdp']].forEach(([k,sel])=>{const el=$(sel);if(!el)return;const set=CF[k],top=el.scrollTop;
  el.innerHTML='<div class="cfpt"><button class="btn sm" data-cfq="clear">Clear</button>'+'</div>'
   +(exts.length?exts.map(([e,n])=>'<label class="cfo"><input type="checkbox" data-e="'+esc(e)+'"'+(set.has(e)?' checked':'')+'><span class="cfe">'+esc(cfFe(e))+'</span><span class="cfk">'+esc(TYPES[e]||'')+'</span><span class="cfc">'+n+'</span></label>').join(''):'<div class="stats" style="padding:6px">No conflicts to filter.</div>');
  el.scrollTop=top});
 cfBtns()}
function cfClose(){['#cfshp','#cfhdp'].forEach(s=>{const p=$(s);if(p)p.hidden=true});document.querySelectorAll('#cfd [data-cfm]').forEach(b=>b.setAttribute('aria-expanded','false'))}
$('#cfd').addEventListener('click',e=>{
 const b=e.target.closest('[data-cfm]');
 if(b){const p=$('#'+b.dataset.cfm),open=p.hidden;cfClose();if(open){p.hidden=false;b.setAttribute('aria-expanded','true')}return}
 const q=e.target.closest('[data-cfq]');
 if(q){const k=q.closest('.cfmenu').dataset.k;
  if(q.dataset.cfq==='clear')CF[k].clear();
  
  cfSaveF();cfMenus();cfDraw();return}
 if(!e.target.closest('.cfmenu'))cfClose()});
$('#cfd').addEventListener('change',e=>{const t=e.target,x=t.dataset&&t.dataset.e;if(x==null)return;
 const k=t.closest('.cfmenu').dataset.k,o=k==='sh'?'hd':'sh';
 if(t.checked){CF[k].add(x);CF[o].delete(x)}else CF[k].delete(x);
 cfSaveF();cfMenus();cfDraw()});
$('#cfd').addEventListener('cancel',e=>{if(!$('#cfshp').hidden||!$('#cfhdp').hidden){e.preventDefault();cfClose()}});
$('#cfd').addEventListener('close',cfClose);
/* the list changes whenever the mod list is redrawn, so refresh the count shortly after every render() */
(function(){const r0=render;render=function(){const x=r0.apply(this,arguments);cfSoon();return x}})();
cfSoon();
