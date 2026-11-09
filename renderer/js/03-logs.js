/* SA Mod Manager - 03-logs.js: log viewer dialog (modloader.log parsing and display) */
/* Classic script: loaded in order by index.html, shares globals with the other files. */
/* log viewer */
const LV={rows:[],f:'all'},reEsc=x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const lastSeg=p=>p.replace(/[\\/]+$/,'').split(/[\\/]/).pop();
function parseLog(t){const rows=[];let mod='';
 t.split(/\r?\n/).forEach(l=>{if(!l.trim())return;
  if(/^\s+\S/.test(l)&&rows.length){rows[rows.length-1].more.push(l.trim());return}
  const s=l.trim(),r={time:'',kind:'',level:'info',msg:s,more:[],sec:false};let m;
  const fail=/^(Failed|Fatal)|\bfailed\b/i.test(s);
  if(/^=+.*=+$/.test(s)){r.kind='start';r.sec=true;r.msg=s.replace(/^=+\s*|\s*=+$/g,'');mod=''}
  else if(m=s.match(/^Scanning mods at "(.*?)"/)){r.kind='scan';r.sec=true;r.msg='Scanning mods in '+m[1];mod=''}
  else if(m=s.match(/^Scanning files at "(.*?)"/)){r.kind='scan';r.sec=true;mod=lastSeg(m[1]);r.msg='Scanning '+mod}
  else if(m=s.match(/^Ignoring mod at "(.*?)"/)){r.kind='ignore';r.sec=true;r.level='warn';mod=lastSeg(m[1]);r.msg='Ignoring mod '+mod}
  else if(m=s.match(/^Updating mods for "(.*?)"/)){r.kind='update';r.sec=true;r.msg='Updating mods in '+m[1];mod=''}
  else if(m=s.match(/^(Updating state for|No files in) "(.*?)"/)){r.kind='update';mod=lastSeg(m[2]);r.msg=(m[1]==='No files in'?'No files in ':'Updating ')+mod}
  else if(m=s.match(/^Found file \[(0x[0-9A-Fa-f]+)\] "(.*)" with handler "(.*)"$/)){r.kind='file';r.msg=m[2];r.chip=m[3];r.hash=m[1]}
  else if(m=s.match(/^No handler or callme for file "(.*)"/)){r.kind='file';r.level='debug';r.msg=m[1];r.chip='no handler'}
  else if(m=s.match(/^Ignoring file "(.*)"/)){r.kind='ignore';r.msg=m[1];r.level='warn'}
  else if(m=s.match(/^(Install|Reinstall|Uninstall)ing file "(.*)"$/)){r.kind=m[1].toLowerCase();r.msg=m[2]}
  else if(m=s.match(/^Extinguishing (?:some files from|file) "(.*)"/)){r.kind='remove';r.msg=m[1]}
  else if(/^(Reading profile|Using profile)/.test(s))r.kind='profile';
  else if(/^(Loading basic config|Parsing command line|Command line|Using Mod Loader folder|Starting up filesystem|Shutting down)/.test(s))r.kind='config';
  else if(/plugin/i.test(s))r.kind='plugin';
  if(fail)r.level='error';
  if(/^Warning:/i.test(s)){r.level='warn';r.msg=s.replace(/^Warning:\s*/i,'');if(!r.kind)r.kind='warning'}
  if(fail&&!r.kind)r.kind='error';
  r.mod=mod;rows.push(r)});
 return rows}
const tx=(h,fn)=>h.split(/(<[^>]+>)/).map((x,i)=>i%2?x:fn(x)).join('');
function drawLog(){const q=$('#lq').value.toLowerCase(),rows=LV.rows,cnt={all:rows.length,error:0,warn:0,info:0,debug:0};
 rows.forEach(r=>cnt[r.level]++);
 const lab={all:'All',error:'Errors',warn:'Warnings',info:'Info',debug:'Debug'};
 document.querySelectorAll('#lf button').forEach(b=>{b.textContent=`${lab[b.dataset.f]} ${cnt[b.dataset.f]}`;b.classList.toggle('on',b.dataset.f===LV.f)});
 const names=S.mods.map(m=>esc(m.name)).filter(n=>n.length>2).sort((a,b)=>b.length-a.length),
  mre=names.length?new RegExp('('+names.map(reEsc).join('|')+')','g'):null;
 let list=rows.filter(r=>(LV.f==='all'||r.level===LV.f)&&(!q||(r.msg+' '+r.more.join(' ')+' '+(r.mod||'')+' '+(r.chip||'')).toLowerCase().includes(q)));
 const cut=list.length>3000;if(cut)list=list.slice(-3000);
 const fm=m=>{let h=esc(m);
  h=tx(h,x=>x.replace(/\b[\w\-]+\.(?:dff|txd|col|ifp|ide|ipl|dat|cfg|ini|cs|cm|csa|asi|dll|cleo|wav|mp3|ogg|img|gxt|fxt|fxp|scm|log)\b/gi,'<span class="lf">$&</span>'));
  h=tx(h,x=>x.replace(/(^|[\s(\[:,])'([^'<>]{2,80})'(?=[\s).,:\]]|$)/g,'$1<span class="lq">\'$2\'</span>').replace(/\b0x[0-9a-f]+\b/gi,'<span class="lh2">$&</span>'));
  if(mre)h=tx(h,x=>x.replace(mre,v=>`<button class="lmod" data-mod="${v}">${v}</button>`));
  return h};
 $('#lb').innerHTML=(cut?'<div class="lr"><span></span><span></span><span class="lh2">Showing the last 3000 matching entries</span></div>':'')+
  (list.length?list.map(r=>`<div class="lr ${r.level}${r.sec?' sec':''}"><span class="lt">${esc(r.kind||r.time)}</span><span class="lv">${r.level}</span><div class="lm">${fm(r.msg)}${r.chip?`<span class="hc">${esc(r.chip)}</span>`:''}${r.more.length?`<div class="lx">${esc(r.more.join('\n'))}</div>`:''}</div></div>`).join(''):'<div class="empty" style="border:0">Nothing to show</div>')}
const LOG_BIG=2*1048576,LOG_MAX=16*1048576;LV.extra=[];LV.abs='';LV.list=[];LV.raw='';LV.size=0;LV.trunc=false;
const isMLlog=p=>/modloader\.log$/i.test(p);
function parseGenericLog(t){return t.split(/\r?\n/).filter(l=>l.trim()).map(l=>{const m=l.trim(),r={time:'',kind:'',level:'info',msg:m,more:[],sec:false,mod:''};
 if(/\b(error|exception|fatal|crash|failed|failure)\b/i.test(m))r.level='error';else if(/\bwarn(ing)?\b/i.test(m))r.level='warn';return r})}
async function logWalk(base){const out=[],skip=new Set(['.git','node_modules','$recycle.bin','system volume information']);
 const walk=async(dir,depth)=>{if(out.length>=400)return;let ents;try{ents=await fsN.promises.readdir(dir,{withFileTypes:true})}catch(e){return}
  for(const e of ents){const p=pathN.join(dir,e.name);
   if(e.isDirectory()){if(depth<4&&!skip.has(e.name.toLowerCase()))await walk(p,depth+1)}
   else if(/\.log$/i.test(e.name)){let st;try{st=await fsN.promises.stat(p)}catch(x){continue}out.push({abs:p,rel:pathN.relative(base,p).replace(/\\/g,'/'),size:st.size,t:st.mtimeMs})}}};
 await walk(base,0);return out}
async function refreshLogList(){const base=gameDir()||(root&&root._path)||'',l=base?await logWalk(base):[];
 LV.extra.forEach(p=>{if(!l.some(x=>x.abs===p)){try{const st=fsN.statSync(p);l.push({abs:p,rel:p,size:st.size,t:st.mtimeMs})}catch(e){}}});
 l.sort((a,b)=>(isMLlog(b.abs)-isMLlog(a.abs))||b.t-a.t);LV.list=l;
 if(!l.some(x=>x.abs===LV.abs))LV.abs=l[0]?l[0].abs:'';
 cddOptions($('#lsel'),l.length?l.map(x=>({v:x.abs,t:pathN.basename(x.abs)})):[{v:'',t:'No .log files found'}],LV.abs)}
function logUi(){const big=LV.size>LOG_BIG;$('#lwarn').hidden=!big;
 if(big)$('#lwarntx').textContent=`This log is ${fmtSize(LV.size)}. Copying it can be slow and may freeze the app`+(LV.trunc?'; only the last 4 MB is shown here':'')+'. Use “Open file location” to open it in your editor instead.';
 $('#lcopy').disabled=!LV.abs;$('#lloc').disabled=!LV.abs;{const lp=$('#lpath');lp.textContent=LV.abs?'Location: '+pathN.dirname(LV.abs)+'  ·  '+fmtSize(LV.size):'';lp.title=LV.abs}}
async function loadLog(rewalk){const lb=$('#lb');LV.rows=[];LV.raw='';LV.trunc=false;LV.size=0;
 $('#lpill').textContent=`$current = ${S.cur} · ${S.mods.length} mods`;
 if(rewalk!==false)await refreshLogList();
 if(!LV.abs){drawLog();lb.innerHTML='<div class="empty" style="border:0">No .log files found in the game folder. Run the game once, rescan, or use Open file.</div>';logUi();return}
 try{const st=await fsN.promises.stat(LV.abs);LV.size=st.size;let text;
  if(st.size>LOG_MAX){const fh=await fsN.promises.open(LV.abs,'r');try{const len=4*1048576,b=Buffer.alloc(len);await fh.read(b,0,len,st.size-len);text=b.toString('utf8');text=text.slice(text.indexOf('\n')+1);LV.trunc=true}finally{await fh.close()}}
  else text=await fsN.promises.readFile(LV.abs,'utf8');
  LV.raw=text;LV.rows=isMLlog(LV.abs)?parseLog(text):parseGenericLog(text);drawLog();lb.scrollTop=lb.scrollHeight}
 catch(e){lb.innerHTML=`<div class="empty" style="border:0">Couldn’t read the log: ${esc(e.message)}</div>`}
 logUi()}
$('#logb').onclick=()=>{$('#logd').showModal();loadLog()};
$('#lre').onclick=()=>loadLog();$('#lx').onclick=()=>$('#logd').close();
$('#lsel').onchange=e=>{LV.abs=e.target.value;loadLog(false)};
$('#lopen').onclick=()=>$('#lfile').click();
$('#lfile').onchange=e=>{const fl=e.target.files[0];e.target.value='';if(!fl)return;let p='';
 try{p=require('electron').webUtils.getPathForFile(fl)}catch(x){}
 if(!p)return toast('Couldn’t read that file’s location');
 LV.extra=LV.extra.filter(x=>x!==p).concat(p);LV.abs=p;loadLog()};
$('#lloc').onclick=()=>{if(LV.abs)window.__native.showItem(LV.abs)};
$('#lcopy').onclick=async()=>{if(!LV.abs)return;
 if(LV.size>LOG_BIG&&!await ask({title:'This log is very large',text:`${pathN.basename(LV.abs)} is ${fmtSize(LV.size)}. Copying it may take a while and can freeze the app. Copy it anyway?`,ok:'Copy anyway'}))return;
 try{const t=LV.trunc?await fsN.promises.readFile(LV.abs,'utf8'):LV.raw;require('electron').clipboard.writeText(t);toast('Log copied')}catch(e){toast('Couldn’t copy: '+e.message)}};
$('#lq').oninput=drawLog;
$('#lf').onclick=e=>{const b=e.target.closest('button');if(b){LV.f=b.dataset.f;drawLog()}};
$('#lb').onclick=e=>{const b=e.target.closest('.lmod');if(b){$('#lq').value=b.dataset.mod;drawLog()}};
