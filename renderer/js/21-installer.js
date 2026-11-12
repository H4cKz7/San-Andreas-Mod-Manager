/* SA Mod Manager - 21-installer.js: Install mod dialog: archives, plan, file picker tree, copy, undo install */
/* Classic script: loaded in order by index.html, shares globals with the other files. */
let pend=null,PLAN=null,ARCH={tmps:[]},baseInstall=null;const dlg=$('#dlg');
const K3=[['root','dRoot','GTA root folder'],['scripts','dScripts','scripts folder'],['cleo','dCleo','CLEO folder']];
const LBL=Object.fromEntries(K3.map(x=>[x[0],x[2]]));
const pathOf=f=>{try{return require('electron').webUtils.getPathForFile(f)||''}catch(e){return''}};
const gfiles=()=>{const g=gameDir();if(!g)return null;const s=new Set();
 for(const sub of['','scripts','plugins','cleo'])try{fsN.readdirSync(pathN.join(g,sub)).forEach(n=>s.add(n.toLowerCase()))}catch(e){}
 try{if(root&&root._path)listFiles(root._path).forEach(f=>{if(/\.asi$/i.test(f))s.add(f.split('/').pop().toLowerCase())})}catch(e){}
 return s};
async function readText(f){try{let b;
 if(f.abs){if((await fsN.promises.stat(f.abs)).size>800000)return'';b=await fsN.promises.readFile(f.abs)}
 else if(f.file&&f.file.size<=800000)b=Buffer.from(await f.file.arrayBuffer());else return'';
 let t=b[0]===0xFF&&b[1]===0xFE?b.toString('utf16le'):b.toString('utf8');
 if(/\.rtf$/i.test(f.r))t=t.replace(/\\par[d]?/g,'\n').replace(/\\'[0-9a-f]{2}/gi,' ').replace(/\\[a-z]+-?\d* ?/gi,'').replace(/[{}]/g,'');
 else if(/\.html?$/i.test(f.r))t=t.replace(/<br\s*\/?>|<\/p>|<\/div>|<\/tr>|<\/li>/gi,'\n').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&');
 return t}catch(e){return''}}
async function buildPlan(items,fb){
 const P=classify(items,fb),warns=[],G=gfiles(),all={hand:[],ide:[]},base=f=>f.r.split('/').pop();let req='';
 for(const f of P.files.filter(f=>/\.(txt|rtf|md|html?|nfo|diz)$/i.test(f.r)).slice(0,40)){
  const t=await readText(f);if(!t)continue;if(req.length<300000)req+='\n'+t;
  const s=scanLines(t);s.hand.forEach(x=>all.hand.push({...x,doc:f.r}));s.ide.forEach(x=>all.ide.push({...x,doc:f.r}))}
 let{hand,ide}=pickLines(all);const has=n=>P.files.some(f=>base(f).toLowerCase()===n);
 if(has('handling.cfg'))hand=[];if(has('vehicles.ide'))ide=[];
 let gen=null,strip=new Set();
 if(!P.ess&&(hand.length||ide.length)){strip=new Set([...hand,...ide].map(x=>x.doc));
  gen={name:'handling and vehicles.txt',text:[...hand.map(x=>x.line),...ide.map(x=>x.line)].join('\r\n')+'\r\n',hand,ide}}
 const progs=P.skip.filter(x=>x.why==='program'),arcs=P.skip.filter(x=>x.why==='archive');
 if(progs.length)warns.push(`Not installed: ${progs.slice(0,3).map(base).join(', ')}${progs.length>3?'…':''}. Installers and scripts (setup or uninstall .exe, .bat, .msi …) are never run or copied.`);
 if(P.files.some(f=>f.exe))warns.push('This package replaces gta_sa.exe in your game folder (e.g. Essentials Pack). The original is backed up first, and “Undo install” restores it.');
 if(arcs.length)warns.push(`There is another archive inside (${arcs.slice(0,2).map(base).join(', ')}). It wasn’t opened. Extract it first if the mod needs it.`);
 const tops=[...new Set(P.files.filter(f=>f.c==='ml'&&f.r.includes('/')).map(f=>f.r.split('/')[0]))],opt=tops.filter(t=>/opt|alt|variant|version|choose|select|^\d+[\s._)-]|type|style|colou?r/i.test(t));
 if(opt.length>=2)warns.push(`This package has several options (${opt.slice(0,4).join(', ')}). Files that share a name are sorted out automatically. Use “Choose files” to untick anything else you don’t want.`);
 if(G){
  const have=re=>[...G].some(n=>re.test(n))||P.files.some(f=>re.test(base(f).toLowerCase()));
  if(/silent ?patch/i.test(req)&&!have(/silentpatch.*\.asi$/))warns.push('The readme mentions SilentPatch, which wasn’t found in your game folder.');
  if(/limit adjuster|fastman|open limit/i.test(req)&&!have(/limit\s*adjuster.*\.asi$/))warns.push('The readme mentions a limit adjuster, but none was found in your game folder.')}
 const plan={...P,warns,gen,strip};if(baseInstall){const err=applyBasePlan(plan,baseInstall.kind);if(err)plan.baseErr=err}await markVersions(plan);return plan}
const cleanName=()=>$('#mname').value.trim().replace(/[\\/:*?"<>|]/g,'');
function uniqueName(n,keep){n=n.replace(/[\\/:*?"<>|]/g,'').trim()||'New mod';const has=x=>S.mods.some(m=>m.name.toLowerCase()===x.toLowerCase());
 if(keep||!has(n))return n;let i=2;while(has(`${n} (${i})`))i++;return `${n} (${i})`}
/* final placement = detected placement + the three checkboxes */
function route(){
 const T={};K3.forEach(([k,id])=>T[k]=$('#'+id).checked&&!$('#'+id).disabled);
 if(PLAN.ess)T.root=true;const forced=K3.map(x=>x[0]).filter(k=>T[k]&&!PLAN.auto[k]),left=forced.length?forced:['ml'];
 const R={ml:[],root:[],scripts:[],cleo:[],T,left};
 const so=!!PLAN.gen&&$('#hcb').checked&&left.includes('ml');
 if(so)R.ml.push({c:'gen',r:PLAN.gen.name,to:PLAN.gen.name,text:PLAN.gen.text});
 PLAN.files.forEach(x=>{
  if(PLAN.ess&&x.eDoc&&$('#ecb').checked)return;if(PLAN.off&&PLAN.off.has(x.k))return;if(so&&PLAN.strip.has(x.r))return;
  if(x.c==='ml_ess'){R.root.push({...x,to:x.d});return}
  if(x.exe){R.root.push({...x,to:x.d});return}
  if(x.c==='doc'){if(left.includes('ml'))R.ml.push(x);return}
  if(x.c!=='ml'&&T[x.c]){R[x.c].push({...x,to:x.d});return}
  left.forEach(k=>R[k].push({...x,to:k==='cleo'||k==='scripts'?x.r.replace(new RegExp('^'+k+'/','i'),''):x.r}))});
 R.ml.forEach(x=>{if(!x.to)x.to=x.r});return R}
function drawPlan(){if(!PLAN)return;const R=route(),g=gameDir(),nm=cleanName();
 const s=n=>n+' file'+(n===1?'':'s'),ex=a=>a.slice(0,3).map(x=>x.r.split('/').pop()).join(', ')+(a.length>3?'…':'');
 const mlF=R.ml.filter(x=>x.c!=='doc'),docs=R.ml.length-mlF.length,rows=[],wl=[...PLAN.warns,...pkMulti()];
 const row=(t,d)=>`<div class="ir"><b title="${esc(t)}">${esc(t)}</b><span>${esc(d)}</span></div>`;
 if(mlF.length){const ne=$('#inex').checked&&$('#exsel').value;rows.push(row('modloader/'+(ne?$('#exsel').value+'/':'')+(nm||'…'),s(mlF.length)+(docs?` + ${docs} readme`:'')))}
 K3.forEach(([k,,l])=>{if(R[k].length)rows.push(row(l,s(R[k].length)+': '+ex(R[k])))});
 const tgt=R.left[0]==='ml'?'modloader':LBL[R.left[0]];
 if(R.left[0]!=='ml')wl.push(`Everything (except what only works in the GTA folder) will be copied into the ${tgt} instead of modloader.`);
 const nI=mlF.length+R.root.length+R.scripts.length+R.cleo.length;if(!nI)wl.push('No installable files were found in this package.');
 const bins=[...R.ml,...R.root,...R.scripts,...R.cleo].filter(x=>x.bin);
 if(bins.length)wl.push('This mod installs '+(bins.length===1?'a program':bins.length+' programs')+' ('+bins.slice(0,3).map(x=>x.r.split('/').pop()).join(', ')+(bins.length>3?'…':'')+'). SA Mod Manager never runs it, but the mod may start it while you play. Only keep it if you trust where this download came from. You can untick it under “Choose files”.');
 const ty=typesOf({files:PLAN.files.map(x=>x.r)});
 $('#asum').innerHTML=`<div class="ir"><b>Detected</b><span>${esc(ty.length?ty.join(', '):s(PLAN.files.length))}</span></div>`+rows.join('')+wl.map(w=>`<div class="wn">⚠ ${esc(w)}</div>`).join('');
 K3.forEach(([k,id])=>{const el=$('#'+id),lab=el.closest('.dopt'),n=PLAN.files.filter(x=>x.c===k);
  el.disabled=!g;lab.classList.toggle('dis',!g);
  $('#'+id+'H').textContent=!g?'Scan the folder that contains gta_sa.exe to use this.':n.length?`This package has files that only work in the GTA folder (${ex(n)}). Tick this only if the readme says so.`:'Rarely needed. Tick this only if the readme says to copy files there.'});
 $('#erow').hidden=!PLAN.ess;
 const nameLab=document.querySelector('label[for="mname"]');
 if(nameLab)nameLab.style.display=PLAN.base?'none':'block';
 $('#mname').style.display=PLAN.base?'none':'';
 if(PLAN.base){$('#destbox').hidden=true;$('#inex').checked=false;const nestLab=$('#inex').closest('label');if(nestLab)nestLab.hidden=true}
 if(PLAN.ess){K3.forEach(([k,id])=>{const el=$('#'+id),lab=el.closest('.dopt');if(k==='root')el.checked=true;el.disabled=!g;lab.classList.toggle('dis',!g)});
  $('#dRootH').textContent='Essentials Pack detected: every file is installed here, on top of the files already in the game folder.'+(g?'':' Scan the game folder first.');
  const nd=PLAN.files.filter(x=>x.eDoc),nn=nd.length;
  $('#ecs').textContent=nn?nn+' file'+(nn===1?'':'s')+' not installed: '+nd.slice(0,3).map(x=>x.r.split('/').pop()).join(', ')+(nn>3?'…':''):'This package has no .url or readme files.'}
 const gv=!!PLAN.gen&&R.left.includes('ml');$('#hrow').hidden=!gv;
 if(gv){const g2=PLAN.gen;$('#hct').textContent='Replace the readme with a clean file of its vehicle lines';
  $('#hcs').textContent=[g2.hand.length?`handling.cfg: ${g2.hand.map(x=>x.name).join(', ')}`:'',g2.ide.length?`vehicles.ide: ${g2.ide.map(x=>x.id).join(', ')}`:''].filter(Boolean).join(' · ')+`. A new “${g2.name}” holds only those lines and the original (${[...PLAN.strip].map(x=>x.split('/').pop()).join(', ')}) isn’t installed. Mod Loader reads the lines from the .txt itself.`;
  $('#hpre').textContent=g2.text}
 const tg={ml:'',root:'[GTA] ',scripts:'[scripts] ',cleo:'[CLEO] '},lines=[];
 ['ml','root','scripts','cleo'].forEach(k=>R[k].forEach(x=>lines.push(tg[k]+x.to)));
 $('#plist').innerHTML=lines.slice(0,80).map(esc).join('<br>')+(lines.length>80?`<br>…and ${lines.length-80} more`:'');
 $('#ok').disabled=!((root||baseInstall)&&nI>0&&(!mlF.length||nm));$('#ok').textContent='Install';exclK3()}
/* only one of GTA root / scripts / CLEO can be ticked: the other two are greyed out */
function exclK3(){const g=gameDir(),on=K3.find(([k,id])=>$('#'+id).checked);
 K3.forEach(([k,id])=>{const el=$('#'+id),lab=el.closest('.dopt'),off=!g||(!!on&&on[1]!==id);el.disabled=off;lab.classList.toggle('dis',off)})}
// ---- installer: several versions of one file + choose which files to install ----
const VER_EXT=/\.(asi|cs|cs3|cs4|csa|cm|cleo|dff|txd|col|ifp|ide|ipl)$/i;
const ALT_RE=/(^|[\s._()\[\]-])(alt|alts|alternate|alternative|option|optional|old|older|previous|backup|bak|original|orig|vanilla|lite|low|lowres|beta|test|unused|extra|extras|spare)($|[\s._()\[\]-])/i;
function verOf(p){const m=p.match(/(?:^|[^a-z0-9])v(?:er(?:sion)?)?[\s._-]?(\d+(?:\.\d+)*)/i)||p.match(/(?:^|[^\d.])(\d+(?:\.\d+)+)(?!\d)/);return m?m[1].split('.').map(Number):[0]}
const cmpVer=(a,b)=>{for(let i=0;i<Math.max(a.length,b.length);i++){const d=(b[i]||0)-(a[i]||0);if(d)return d}return 0};
// best candidate first: not an "alt/old/backup" folder, then the highest version number, then the shallowest path
const rankFiles=(a,b)=>(ALT_RE.test(a.r)-ALT_RE.test(b.r))||cmpVer(verOf(a.r),verOf(b.r))||(a.r.split('/').length-b.r.split('/').length)||a.r.localeCompare(b.r,undefined,{numeric:true});
async function sameBytes(a,b){try{const sa=await fsN.promises.stat(a),sb=await fsN.promises.stat(b);if(sa.size!==sb.size||sa.size>64*1048576)return false;
 const x=await Promise.all([fsN.promises.readFile(a),fsN.promises.readFile(b)]);return x[0].equals(x[1])}catch(e){return false}}
// finds files that share a name, keeps the best one ticked and the rest unticked
async function markVersions(plan){
 plan.files.forEach((f,i)=>f.k=i);plan.off=new Set();plan.groups=[];plan.dups=[];
 const by=new Map();
 plan.files.forEach(f=>{if(f.c==='doc'||!VER_EXT.test(f.r))return;const k=f.r.split('/').pop().toLowerCase();(by.get(k)||by.set(k,[]).get(k)).push(f)});
 let n=0;
 for(const g of by.values()){if(g.length<2)continue;
  g.sort(rankFiles);const keep=g[0],rest=[];
  for(const o of g.slice(1)){
   if(keep.abs&&o.abs&&await sameBytes(keep.abs,o.abs)){o.same=keep;plan.off.add(o.k);plan.dups.push(o)}else rest.push(o);
   if(++n%40===0)await new Promise(r=>setTimeout(r))}
  if(rest.length){const grp=[keep,...rest];grp.forEach(f=>f.grp=plan.groups.length);rest.forEach(o=>plan.off.add(o.k));plan.groups.push(grp)}}
 if(plan.groups.length){const c=plan.groups.length;
  plan.warns.push(`${c} file${c===1?'':'s'} ${c===1?'comes':'come'} in more than one version (${plan.groups.slice(0,3).map(g=>g[0].r.split('/').pop()).join(', ')}${c>3?'…':''}). Only one of each is ticked, the most likely one. Check them under “Choose files”.`)}}
let PKT=0;
const pkQ=()=>$('#pkq').value.trim().toLowerCase();
function pkView(){const q=pkQ(),hit=f=>!q||f.r.toLowerCase().includes(q);
 return{groups:PLAN.groups.filter(g=>g.some(hit)),
  plain:PLAN.files.filter(f=>f.grp===undefined&&hit(f)).sort((a,b)=>a.r.localeCompare(b.r,undefined,{numeric:true,sensitivity:'base'}))}}
function pkRow(f){const on=!PLAN.off.has(f.k),g=f.grp!==undefined?PLAN.groups[f.grp]:null;
 const tag=(f.c==='doc'?'<span class="tag">readme</span>':f.c==='root'?'<span class="tag warn">GTA folder</span>':'')+(f.bin?'<span class="tag warn">program (.exe)</span>':'')+(g&&g[0]===f?'<span class="tag st">suggested</span>':'')+(f.same?'<span class="tag">identical copy</span>':'');
 return `<label class="pkr"><input type="checkbox" data-k="${f.k}"${on?' checked':''}><span class="nm" title="${esc(f.r)}">${esc(f.r)}</span>${tag}</label>`}
// groups where more than one version is ticked, as a warning text for the install summary
function pkMulti(){if(!PLAN||!PLAN.groups)return[];
 const bad=PLAN.groups.filter(g=>g.filter(f=>!PLAN.off.has(f.k)).length>1);if(!bad.length)return[];
 return[`${bad.length} file${bad.length===1?'':'s'} will be installed in more than one version (${bad.slice(0,3).map(g=>g[0].r.split('/').pop()).join(', ')}${bad.length>3?'…':''}). They share a name, so they can conflict or override each other in the game. Only keep this if the mod really needs it.`]}
function pkUi(){const has=!!PLAN.groups.length;$('#pkgx').hidden=!has;if(!has)return;
 const on=$('#pkmulti').checked;
 $('#pkwarn').textContent=pkMulti().length?'More than one version of some files is ticked. They share a name, so they can conflict or override each other in the game.':on?'Installing several versions is allowed. Right now only one of each is ticked.':'Some files come in more than one version. Installing several at once can make them conflict, so only one of each can be ticked. Tick the box below if this mod really needs more than one.'}
$('#pkmulti').onchange=()=>{if(!PLAN)return;
 if(!$('#pkmulti').checked)PLAN.groups.forEach(g=>{let seen=false;g.forEach(o=>{if(PLAN.off.has(o.k))return;if(seen)PLAN.off.add(o.k);else seen=true})});
 drawPick();drawPlan()};
function pkStat(){if(!PLAN)return;pkUi();const tot=PLAN.files.length,sel=PLAN.files.filter(f=>!PLAN.off.has(f.k)).length,g=PLAN.groups.length,d=PLAN.dups.length;
 $('#pksum').textContent='Choose files · '+sel+' of '+tot+' selected'+(g?' · '+g+' with several versions':'')+(d?' · '+d+' identical cop'+(d===1?'y':'ies')+' skipped':'')}
function drawPick(first){const box=$('#pickbox');if(!PLAN){box.hidden=true;return}
 if(first){$('#pkq').value='';$('#pkmulti').checked=false;PLAN.pkx={};PLAN.pkOpen=PLAN.files.length<=60;$('#pkd').open=PLAN.groups.length>0}
 box.hidden=false;const v=pkView(),cap=1200;let h='';
 v.groups.forEach(g=>{h+='<div class="pkg"><div class="pkgh"><span>'+esc(g[0].r.split('/').pop())+'</span><span class="tag warn">'+g.length+' versions: pick one</span></div>'+g.map(pkRow).join('')+'</div>'});
 const room=Math.max(0,cap-v.groups.reduce((a,g)=>a+g.length,0));
 h+=pkTree(v.plain,room);v.plain.length=Math.min(v.plain.length,room);
 if(v.plain.length>room)h+='<div class="stats" style="padding:8px 10px">…and '+(v.plain.length-room)+' more. Search to narrow the list. “All” and “None” include them.</div>';
 if(!h)h='<div class="stats" style="padding:8px 10px">No files match</div>';
 $('#pklist').innerHTML=h;$('#pklist').querySelectorAll('input[data-st="2"]').forEach(i=>i.indeterminate=true);pkStat()}
// ---- Choose files as a folder tree ----
function pkTreeRow(f,d){const on=!PLAN.off.has(f.k),bt=f.bin?'<span class="tag warn">program (.exe)</span>':'';
 const tag=(f.c==='doc'?'<span class="tag">readme</span>':f.c==='root'?'<span class="tag warn">GTA folder</span>':'')+(f.same?'<span class="tag">identical copy</span>':'');
 return `<label class="pkr" style="--d:${d}"><span class="pkc"></span><input type="checkbox" data-k="${f.k}"${on?' checked':''}><span class="nm" title="${esc(f.r)}">${esc(f.r.split('/').pop())}</span>${bt}${tag}${f.c==='doc'&&typeof rdBtn==='function'?rdBtn(f):''}</label>`}
function pkTree(files,room){if(!files.length)return'';
 PLAN.pkx=PLAN.pkx||{};const q=pkQ(),root={d:{},f:[],all:[]};
 files.forEach(f=>{const ps=f.r.split('/');ps.pop();let n=root,p='';
  ps.forEach(x=>{p=p?p+'/'+x:x;n=n.d[x]||(n.d[x]={d:{},f:[],all:[],p});n.all.push(f)});n.f.push(f)});
 const cmp=(a,b)=>a.localeCompare(b,undefined,{numeric:true,sensitivity:'base'});
 const isOpen=p=>q?true:(p in PLAN.pkx?PLAN.pkx[p]:!!PLAN.pkOpen);
 let h='',rows=0,cut=false;
 const draw=(n,d)=>{
  for(const k of Object.keys(n.d).sort(cmp)){
   if(rows>=room){cut=true;return}
   const c=n.d[k],open=isOpen(c.p),el=c.all.filter(f=>!f.same),on=el.filter(f=>!PLAN.off.has(f.k)).length,st=!el.length||!on?0:on===el.length?1:2;rows++;
   h+=`<div class="pkf${open?' open':''}" data-p="${esc(c.p)}" style="--d:${d}"><span class="pkc">${CV}</span><input type="checkbox" data-fp="${esc(c.p)}" data-st="${st}"${st===1?' checked':''} aria-label="Select the folder ${esc(k)}"><span class="pkfi">${FO}</span><span class="nm" title="${esc(c.p)}">${esc(k)}</span><span class="pkn">${c.all.length} file${c.all.length===1?'':'s'}</span></div>`;
   if(open)draw(c,d+1)}
  for(const f of n.f.slice().sort((a,b)=>cmp(a.r,b.r))){if(rows>=room){cut=true;return}rows++;h+=pkTreeRow(f,d)}};
 draw(root,0);
 if(cut)h+='<div class="stats" style="padding:8px 10px">…more files not shown. Close some folders or search to narrow the list.</div>';
 return h}
// tick or untick everything inside a folder (only the files matching the search, if one is typed)
function pkFolder(p,on){const q=pkQ(),under=PLAN.files.filter(f=>f.r.startsWith(p+'/')&&(!q||f.r.toLowerCase().includes(q)));
 if(!on){under.forEach(f=>PLAN.off.add(f.k));return}
 const gs=new Map(),multi=$('#pkmulti').checked;
 under.forEach(f=>{if(f.grp===undefined){if(!f.same)PLAN.off.delete(f.k)}else(gs.get(f.grp)||gs.set(f.grp,[]).get(f.grp)).push(f)});
 gs.forEach((mem,gi)=>{const g=PLAN.groups[gi];
  if(multi)mem.forEach(o=>PLAN.off.delete(o.k));
  else if(!g.some(o=>!PLAN.off.has(o.k))){mem.sort((a,b)=>g.indexOf(a)-g.indexOf(b));PLAN.off.delete(mem[0].k)}})}
function pkRedraw(){const l=$('#pklist'),st=l.scrollTop;drawPick();l.scrollTop=st}
$('#pklist').addEventListener('click',e=>{if(!PLAN)return;const r=e.target.closest('.pkf');if(!r||e.target.closest('input')||pkQ())return;
 PLAN.pkx=PLAN.pkx||{};PLAN.pkx[r.dataset.p]=!r.classList.contains('open');pkRedraw()});
$('#pklist').addEventListener('change',e=>{const t=e.target;if(!PLAN||t.dataset.fp==null)return;
 pkFolder(t.dataset.fp,t.checked);pkRedraw();drawPlan()});
$('#pkexp').onclick=()=>{if(!PLAN)return;PLAN.pkx={};PLAN.pkOpen=true;pkRedraw()};
$('#pkcol').onclick=()=>{if(!PLAN)return;PLAN.pkx={};PLAN.pkOpen=false;pkRedraw()};
$('#pklist').addEventListener('change',e=>{const t=e.target;if(!PLAN||t.dataset.k==null)return;const k=+t.dataset.k,f=PLAN.files[k];
 if(t.checked){PLAN.off.delete(k);
  if(f.grp!==undefined&&!$('#pkmulti').checked)PLAN.groups[f.grp].forEach(o=>{if(o!==f){PLAN.off.add(o.k);const c=$('#pklist input[data-k="'+o.k+'"]');if(c)c.checked=false}})}
 else PLAN.off.add(k);
 pkStat();drawPlan()});
$('#pkq').oninput=()=>{clearTimeout(PKT);PKT=setTimeout(()=>{if(PLAN)drawPick()},120)};
// "All" and "None" work on whatever the search currently shows
$('#pkall').onclick=()=>{if(!PLAN)return;const v=pkView();
 v.plain.forEach(f=>{if(!f.same)PLAN.off.delete(f.k)});
 v.groups.forEach(g=>g.forEach((o,i)=>(i&&!$('#pkmulti').checked)?PLAN.off.add(o.k):PLAN.off.delete(o.k)));drawPick();drawPlan()};
$('#pknone').onclick=()=>{if(!PLAN)return;const v=pkView();
 v.plain.forEach(f=>PLAN.off.add(f.k));v.groups.forEach(g=>g.forEach(o=>PLAN.off.add(o.k)));drawPick();drawPlan()};
async function loadPackage(items,fb){
 pend={items,fb};rdReset();const bz=$('#ibusy');bz.hidden=false;bz.textContent='Analysing the files…';$('#ok').disabled=true;
 try{PLAN=await buildPlan(items,fb||(items.length===1?items[0].rel.split(/[\\/]/).pop().replace(/\.[^.]+$/,''):''))}
 catch(e){bz.hidden=true;return notice('Couldn’t analyse the files',e.message)}
 if(PLAN&&PLAN.baseErr){const err=PLAN.baseErr;PLAN=null;pend=null;bz.hidden=true;return notice('Wrong package',err)}
 bz.hidden=true;$('#mname').value=uniqueName(PLAN.name,true);$('#hcb').checked=true;$('#ecb').checked=true;const g=gameDir();
 K3.forEach(([k,id])=>{const el=$('#'+id);el.disabled=!g;el.checked=false});
$('#destbox').hidden=false;$('#asum').hidden=false;exUi();drawPick(true);drawPlan();rdDraw()}
function clearTmps(){const t=ARCH.tmps;ARCH={tmps:[]};t.forEach(d=>{try{window.__native.cleanTmp(d)}catch(e){}})}
async function openArchive(file,depth=0,fb){
 if(!depth)clearTmps();const nm=pathN.basename(file),bz=$('#ibusy');fb=fb||nm.replace(/\.[^.]+$/,'').replace(/_+/g,' ').trim();let pw='',r;
 for(;;){bz.hidden=false;bz.textContent=`Opening ${nm}…`;$('#ok').disabled=true;
  r=await window.__native.extract(file,pw);bz.hidden=true;
  if(r&&r.needPassword){
   const p=await ask({title:'Password required',text:pw&&r.wrong?'That password didn’t work. Try again.':`“${nm}” is password protected. Download pages and readmes usually say what the password is.`,input:true,password:true,placeholder:'Password',ok:'Unlock'});
   if(p===null)return;pw=p;continue}
  break}
 if(!r||!r.ok)return notice('Couldn’t open the archive',(r&&r.error)||'Unknown error');
 ARCH.tmps.push(r.dir);
 const items=listFiles(r.dir).map(rel=>({rel,abs:pathN.join(r.dir,rel)}));
 if(!items.length)return notice('Empty archive',`There is nothing inside “${nm}”.`);
 const real=items.filter(i=>!JUNK.test(i.rel)&&!isDoc(i.rel));
 if(depth<3&&real.length===1&&ARCH_RE.test(real[0].rel))return openArchive(real[0].abs,depth+1,fb);
 await loadPackage(items,fb)}
async function take(files){
 files=files.filter(f=>!JUNK.test(f.webkitRelativePath||f._p||f.name));if(!files.length)return;
 const rp=f=>f.webkitRelativePath||f._p||'';
 if(files.length===1&&ARCH_RE.test(files[0].name)&&!rp(files[0]).includes('/')){const p=pathOf(files[0]);if(p)return openArchive(p)}
 clearTmps();await loadPackage(files.map(f=>({rel:rp(f)||f.name,abs:pathOf(f),file:f})),'')}
$('#inst').onclick=()=>{const base=baseInstall;clearTmps();pend=null;PLAN=null;baseInstall=base;['#asum','#destbox','#hrow','#erow','#ibusy','#pickbox'].forEach(x=>$(x).hidden=true);rdReset();
 $('#plist').textContent=base?'Choose a .zip, .rar or .7z archive, or an extracted folder.':(root?'':'Mod Loader is not installed yet. Install it first (Version & Essentials card).');
 const h2=dlg.querySelector('h2');if(h2)h2.textContent=base?(base.kind==='ess'?'Install Essentials Pack':'Install Mod Loader'):'Install mod';
 const nameLab=document.querySelector('label[for="mname"]');if(nameLab)nameLab.style.display='';
 $('#mname').style.display='';
 const nestLab=$('#inex').closest('label');if(nestLab)nestLab.hidden=!!base;
 $('#mname').value='';$('#ok').disabled=true;$('#inex').checked=false;$('#exq').value='';K3.forEach(([,id])=>$('#'+id).checked=false);exUi();dlg.showModal()};
$('#cx').onclick=()=>dlg.close();dlg.addEventListener('close',()=>{clearTmps();baseInstall=null;const h2=dlg.querySelector('h2');if(h2)h2.textContent='Install mod';const nameLab=document.querySelector('label[for="mname"]');if(nameLab)nameLab.style.display='';const mname=$('#mname');if(mname)mname.style.display='';const nestLab=$('#inex')&&$('#inex').closest('label');if(nestLab)nestLab.hidden=false});
$('#pf').onclick=()=>$('#ff').click();
$('#pa').onclick=async()=>{const p=await window.__native.pickArchive();if(p)openArchive(p)};
$('#ff').onchange=e=>{const f=[...e.target.files];e.target.value='';take(f)};
['#mname'].forEach(x=>$(x).addEventListener('input',drawPlan));
['#inex','#exsel'].forEach(x=>$(x).addEventListener('change',drawPlan));
$('#destbox').addEventListener('change',drawPlan);$('#hrow').addEventListener('change',drawPlan);$('#erow').addEventListener('change',drawPlan);
const dr=$('#drop');
dr.ondragover=e=>{e.preventDefault();dr.classList.add('hov')};dr.ondragleave=()=>dr.classList.remove('hov');
dr.ondrop=async e=>{e.preventDefault();dr.classList.remove('hov');
 const arch=[...e.dataTransfer.files].find(f=>ARCH_RE.test(f.name));
 if(arch){const p=pathOf(arch);if(p)return openArchive(p)}
 const walk=async(en,pre)=>{if(en.isFile)return[await new Promise(r=>en.file(f=>{f._p=pre+f.name;r(f)}))];
  const rd=en.createReader(),out=[];let b;do{b=await new Promise(r=>rd.readEntries(r));for(const c of b)out.push(...await walk(c,pre+en.name+'/'))}while(b.length);return out};
 const it=[...e.dataTransfer.items].map(i=>i.webkitGetAsEntry&&i.webkitGetAsEntry()).filter(Boolean);
 const fl=[];for(const en of it)fl.push(...await walk(en,''));take(fl)};
async function undoInstall(J,quiet){
 for(const c of J.created){try{await fsN.promises.rm(c.abs,{force:true});let d=pathN.dirname(c.abs);const st=c.stop.toLowerCase();
  while(d.toLowerCase()!==st&&d.toLowerCase().startsWith(st)){try{fsN.rmdirSync(d)}catch(e){break}d=pathN.dirname(d)}}catch(e){}}
 for(const r of J.replaced){try{await fsN.promises.copyFile(r.bk,r.abs)}catch(e){}}
 if(J.mlTop)refreshMod(J.mlTop);undoReset();render();runChecks();if(!quiet)toast('Install undone')}
$('#ok').onclick=async()=>{if(!pend||!PLAN||(!root&&!baseInstall))return;
 /*OVERWRITE-MOD*/let n=cleanName(),ow=false;const R=route(),mlF=R.ml.filter(x=>x.c!=='doc'),g=gameDir();
 const nest=$('#inex').checked&&mlF.length>0,dest=nest?$('#exsel').value:'',parts=dest.split('/'),tm=nest?S.mods.find(m=>m.name===parts[0]):null,sub=parts.slice(1).join('/'),rel=(sub?sub+'/':'')+n;
 if(mlF.length){
  if(!n)return toast('Give the mod a name');
  let clash=false,exMod=null;
  if(nest){if(!tm)return toast('Pick an existing mod folder');clash=tm.files.some(f=>f.startsWith(rel+'/'))}
  else{exMod=S.mods.find(m=>m.name.toLowerCase()===n.toLowerCase());clash=!!exMod}
  if(clash){
   if(!await ask({title:`Overwrite “${exMod?exMod.name:n}”?`,text:`${nest?`“${n}” already exists inside ${dest}.`:`A mod folder named “${exMod.name}” already exists.`} Files from this package replace files with the same name, other files in the folder are kept. Replaced files are backed up first and “Undo install” puts them back.`,ok:'Overwrite'}))return;
   ow=true;if(exMod)n=exMod.name}}
 if((R.root.length||R.scripts.length||R.cleo.length)&&!g)return toast('The GTA folder is unknown. Scan the folder that contains gta_sa.exe');
 const mlRoot=root&&root._path,mlBase=nest?parts[0]+'/'+rel:n,ops=[];
 const add=(x,base,stop)=>{const dst=pathN.join(base,...x.to.split('/'));if(pathN.relative(base,dst).startsWith('..'))return;ops.push({x,dst,stop})};
 if(mlRoot){const mlDir=pathN.join(mlRoot,...mlBase.split('/'));R.ml.forEach(x=>add(x,mlDir,mlRoot))}
 R.root.forEach(x=>add(x,g,g));
 R.scripts.forEach(x=>add(x,pathN.join(g,'scripts'),pathN.join(g,'scripts')));
 R.cleo.forEach(x=>add(x,pathN.join(g,'cleo'),pathN.join(g,'cleo')));
 const mlDirP=mlRoot&&mlF.length?pathN.join(mlRoot,...mlBase.split('/')):null,inMl=o=>mlDirP&&!pathN.relative(mlDirP,o.dst).startsWith('..');
 const exist=ops.filter(o=>fsN.existsSync(o.dst)&&!(ow&&inMl(o)));
 if(exist.length&&!await ask({title:`Replace ${exist.length} existing file${exist.length===1?'':'s'}?`,text:`${exist.slice(0,6).map(o=>pathN.basename(o.dst)).join(', ')}${exist.length>6?'…':''} already exist${exist.length===1?'s':''} in your game folders. The originals are backed up first, and “Undo install” puts them back.`,ok:'Replace'}))return;
 const J={name:mlF.length?n:PLAN.name,created:[],replaced:[],mlTop:mlF.length?(nest?parts[0]:n):'',stamp:Date.now().toString(36)},bdir=pathN.join(window.__native.userData,'install-backups',S.curInst||'default',J.stamp);
 const b=$('#ok');b.disabled=true;b.textContent='Copying…';let done=0;
 try{
  for(const o of ops){
   await fsN.promises.mkdir(pathN.dirname(o.dst),{recursive:true});
   if(fsN.existsSync(o.dst)){const bk=pathN.join(bdir,String(J.replaced.length));await fsN.promises.mkdir(bdir,{recursive:true});await fsN.promises.copyFile(o.dst,bk);J.replaced.push({abs:o.dst,bk})}
   else J.created.push({abs:o.dst,stop:o.stop});
   if(o.x.abs)await fsN.promises.copyFile(o.x.abs,o.dst);else if(o.x.file)await fsN.promises.writeFile(o.dst,Buffer.from(await o.x.file.arrayBuffer()));else if(o.x.text!=null)await fsN.promises.writeFile(o.dst,o.x.text);
   if(++done%25===0){b.textContent=`Copying… ${done}/${ops.length}`;await new Promise(r=>setTimeout(r))}}
  }
 catch(e){await undoInstall(J,true);b.textContent='Install';drawPlan();return notice('Copy failed',e.message+'. Everything that was copied has been removed again.')}
 try{await ibWriteManifest(J,bdir)}catch(e){}b.textContent='Install';const bh=baseInstall&&baseInstall.h;dlg.close();
 if(bh){try{await fsN.promises.mkdir(pathN.join(bh._path,'modloader'),{recursive:true})}catch(e){}}
 if(PLAN&&PLAN.ess&&root){try{scanRoot()}catch(e){}}
 if(J.mlTop){refreshMod(J.mlTop);if(nest){const m=S.mods.find(x=>x.name===J.mlTop);if(m){m._o=true;m._x=m._x||{};rel.split('/').reduce((a,x)=>{const c=a?a+'/'+x:x;m._x[c]=true;return c},'')}}}
 undoReset();render();runChecks();
 const sm=[];if(mlF.length)sm.push(`${mlF.length} file${mlF.length===1?'':'s'} in modloader/${mlBase}`);
 if(R.ml.some(x=>x.c==='gen'))sm.push('Vehicle lines saved to “'+PLAN.gen.name+'” (readme not installed)');
 K3.forEach(([k,,l])=>{if(R[k].length)sm.push(`${R[k].length} file${R[k].length===1?'':'s'} in the ${l}`)});
 if(J.replaced.length)sm.push(`${J.replaced.length} existing file${J.replaced.length===1?'':'s'} replaced (backed up)`);
 const rs=await ask({title:`Installed “${J.name}”`,text:sm.join('\n'),ok:'Done',info:true,alt:'Undo install'});
 if(rs==='alt'){await undoInstall(J);ibMarkRestored(bdir)}else if(bh)await setRoot(bh)};
