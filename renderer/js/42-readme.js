/* SA Mod Manager - 42-readme.js: readme reader for the installer (read .txt .md .html .rtf .pdf .nfo before installing, as a popup over the installer) */
/* Classic script: loaded in order by index.html, shares globals with the other files. Uses wkMd / wkEsc / wkResolve from 31-wiki.js. */
const RD={docs:[],i:-1,t:0,tmp:[],fs:(()=>{try{return Math.min(20,Math.max(11,+localStorage.getItem('samm-rdfs')||13))}catch(e){return 13}})()};
const RD_MAX=4*1048576,RD_OPEN_OK=/\.(txt|md|nfo|diz|rtf|pdf|html?|docx?)$/i;
const RD_IMG={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',gif:'image/gif',webp:'image/webp',bmp:'image/bmp'};
const RD_BOOK='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3.6C6.7 2.7 4.9 2.4 2.2 2.4v9.4c2.7 0 4.5.3 5.8 1.2 1.3-.9 3.1-1.2 5.8-1.2V2.4c-2.7 0-4.5.3-5.8 1.2zM8 3.6V13"/></svg>';
const RD_X='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg>';
/* code page 437 (DOS), the high half. .nfo / .diz files are usually drawn with it */
const CP437='ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■\u00a0';
const rdName=f=>f.r.split('/').pop();
const rdExt=f=>((rdName(f).match(/\.([a-z0-9]+)$/i)||[,''])[1]).toLowerCase();
/* which documents a package offers: everything the installer already calls a readme/doc, plus loose top-level .txt files */
function rdRank(f){const n=rdName(f);
 if(/\.(url|website)$/i.test(n))return 5;
 if(/(^|[ _.-])(read[ _.-]?me|leia[ _.-]?me|lisez[ _.-]?moi)/i.test(n))return 0;
 if(/^(install|instructions?|how[ _-]?to|usage|tutorial|manual|help)/i.test(n))return 1;
 if(/^(change[ _-]?log|credits?|licen[cs]e|terms|permissions?)/i.test(n))return 4;
 return 2}
function rdList(){if(!PLAN)return[];
 return PLAN.files.filter(f=>f.c==='doc'||(!f.r.includes('/')&&/\.(txt|nfo|diz)$/i.test(f.r)))
  .sort((a,b)=>rdRank(a)-rdRank(b)||a.r.split('/').length-b.r.split('/').length||a.r.localeCompare(b.r,undefined,{numeric:true,sensitivity:'base'}))}
/* ---- the row in the installer ---- */
function rdRowEl(){let r=$('#rdrow');if(r)return r;
 r=document.createElement('div');r.id='rdrow';r.className='rdrow';r.hidden=true;
 r.innerHTML='<span class="rdi">'+RD_BOOK+'</span><div class="rdt"><b id="rdhead">Read the readme before you install</b><small id="rdsub"></small></div><button type="button" class="btn sm" id="rdopen">Read</button>';
 $('#asum').after(r);$('#rdopen').onclick=()=>rdOpen(0);return r}
function rdDraw(){const r=rdRowEl();RD.docs=rdList();
 const real=RD.docs.filter(f=>rdRank(f)<5);
 if(!real.length){r.hidden=true;return}
 const n=RD.docs.length;
 $('#rdsub').textContent=RD.docs.slice(0,3).map(rdName).join(', ')+(n>3?'…':'');
 $('#rdopen').textContent=n===1?'Read':'Read ('+n+')';r.hidden=false}
function rdReset(){const r=$('#rdrow');if(r)r.hidden=true;RD.docs=[]}
/* small "Read" button for the doc rows of the Choose files tree (called from 21-installer.js) */
const rdBtn=f=>'<button type="button" class="btn sm rdv" data-rd="'+f.k+'" title="Read this file">Read</button>';
function rdOpenFile(k){if(!PLAN)return;RD.docs=rdList();const i=RD.docs.findIndex(f=>f.k===k);if(i>=0)rdOpen(i)}
function rdOpen(i){if(!PLAN)return;if(!RD.docs.length)RD.docs=rdList();if(!RD.docs[i])return;
 const d=rdDlg();if(!d.open)d.showModal();rdShow(i)}
/* ---- the popup ---- */
function rdDlg(){let d=$('#rdd');if(d)return d;
 d=document.createElement('dialog');d.id='rdd';d.className='rddlg';d.style.setProperty('--rdfs',RD.fs+'px');
 d.innerHTML='<div class="rdin"><div class="rdh"><h2 id="rdtitle">Readme</h2><div class="rdtools">'
  +'<button type="button" class="btn sm rdb" id="rdsm" title="Smaller text" aria-label="Smaller text">A−</button>'
  +'<button type="button" class="btn sm rdb" id="rdlg" title="Larger text" aria-label="Larger text">A+</button>'
  +'<button type="button" class="btn sm" id="rdrs" title="Reset text size" aria-label="Reset text size">Reset</button>'
  +'<button type="button" class="btn sm" id="rdext" title="Open this file with the default program">Open file</button>'
  +'<button type="button" class="btn sm rdb" id="rdx" title="Close" aria-label="Close">'+RD_X+'</button></div></div>'
  +'<div class="rdtabs" id="rdtabs"></div><div class="rdbody" id="rdbody" tabindex="0"></div></div>';
 document.body.append(d);
 const fs=n=>{RD.fs=n===0?13:Math.min(20,Math.max(11,RD.fs+n));$('#rdrs').disabled=RD.fs===13;d.style.setProperty('--rdfs',RD.fs+'px');try{localStorage.setItem('samm-rdfs',String(RD.fs))}catch(e){}};
 $('#rdrs').disabled=RD.fs===13;$('#rdrs').onclick=()=>fs(0);$('#rdx').onclick=()=>d.close();$('#rdsm').onclick=()=>fs(-1);$('#rdlg').onclick=()=>fs(1);
 d.addEventListener('click',e=>{if(e.target===d)d.close()});/* click on the dimmed backdrop */
 d.addEventListener('close',()=>{RD.t++;$('#rdbody').innerHTML=''});
 $('#rdtabs').addEventListener('click',e=>{const b=e.target.closest('[data-i]');if(b)rdShow(+b.dataset.i)});
 $('#rdext').onclick=async()=>{const f=RD.docs[RD.i];if(!f)return;
  try{const p=await rdAbs(f),r=await nOpenPath(p);if(r)notice('Couldn’t open the file',r)}catch(e){notice('Couldn’t open the file',e.message)}};
 /* links must never navigate the app window */
 $('#rdbody').addEventListener('click',e=>{
  const cp=e.target.closest('[data-cp]');if(cp){const c=cp.parentElement.querySelector('code');nCopy(c?c.textContent:'').then(ok=>{cp.textContent=ok?'Copied':'Copy failed';setTimeout(()=>{cp.textContent='Copy'},1200)});return}
  const a=e.target.closest('a');if(!a)return;e.preventDefault();
  const u=a.dataset.x||'';if(/^https?:\/\//i.test(u)){nOpen(u);return}
  if(a.dataset.h!=null){const t=$('#rdbody').querySelector('[id="wk-h-'+a.dataset.h.replace(/"/g,'')+'"]');if(t)t.scrollIntoView({block:'start'})}});
 return d}
async function rdShow(i){const f=RD.docs[i];if(!f)return;RD.i=i;const tk=++RD.t,body=$('#rdbody');
 $('#rdtitle').textContent=rdName(f);
 const tabs=$('#rdtabs');tabs.hidden=RD.docs.length<2;
 tabs.innerHTML=RD.docs.map((x,k)=>'<button type="button" class="rdtab'+(k===i?' on':'')+'" data-i="'+k+'" title="'+wkEsc(x.r)+'">'+wkEsc(rdName(x))+'</button>').join('');
 const on=tabs.querySelector('.on');if(on)on.scrollIntoView({block:'nearest',inline:'nearest'});
 $('#rdext').hidden=!RD_OPEN_OK.test(rdName(f));
 body.className='rdbody';body.innerHTML='<div class="rdmsg">Loading…</div>';
 let r;try{r=await rdRender(f)}catch(e){r={cls:'',html:'<div class="rdmsg">Couldn’t open this file: '+wkEsc(e.message||String(e))+'</div>'}}
 if(tk!==RD.t)return;
 body.className='rdbody '+(r.cls||'');body.innerHTML=r.html;body.scrollTop=0;if(!r.cls||r.cls==='txt'||r.cls==='nfo'||r.cls==='md')body.focus({preventScroll:true})}
async function rdRender(f){const ext=rdExt(f);
 if(ext==='pdf'){const p=await rdAbs(f);return{cls:'frame',html:'<iframe class="rd-frame" src="'+wkEsc(require('url').pathToFileURL(p).href)+'" title="'+wkEsc(rdName(f))+'"></iframe>'}}
 if(ext==='doc'||ext==='docx')return{cls:'',html:'<div class="rdmsg">Word documents can’t be shown here. Use “Open file” to read it in Word or WordPad.</div>'};
 const b=await rdBytes(f,ext==='url'||ext==='website'?65536:RD_MAX),cut=b.cut?'<div class="rdmsg">Only the first 4 MB are shown. Use “Open file” to see the rest.</div>':'';
 let t=rdDecode(b,ext);
 if(ext==='url'||ext==='website'){const m=t.match(/^\s*URL\s*=\s*(\S+)/im),u=m?m[1]:'';
  return{cls:'',html:'<div class="rdmsg">This is an internet shortcut that came with the mod.'+(/^https?:\/\//i.test(u)?'<br><br><a href="'+wkEsc(u)+'" data-x="'+wkEsc(u)+'">'+wkEsc(u)+'</a><br><br>Click the link to open it in your browser.':'')+'</div>'}}
 if(ext==='rtf'&&/^\s*\{\\rtf/i.test(t))t=rdRtf(t);
 if(/^html?$/.test(ext))return{cls:'frame',html:await rdHtml(t,f)};
 if(ext==='md')return{cls:'md',html:'<div class="rd-md">'+await rdImgs(wkMd(t,'','',{},true).html,f)+'</div>'+cut};
 return{cls:ext==='nfo'||ext==='diz'?'nfo':'txt',html:'<pre class="rd-pre">'+rdLink(t.replace(/\u001a/g,''))+'</pre>'+cut}}
/* ---- reading and decoding ---- */
async function rdBytes(f,max){let b;
 if(f.abs){const h=await fsN.promises.open(f.abs,'r');try{const st=await h.stat(),n=Math.min(st.size,max);b=Buffer.alloc(n);await h.read(b,0,n,0);b.cut=st.size>max}finally{await h.close()}}
 else if(f.file){b=Buffer.from(await f.file.arrayBuffer());if(b.length>max){b=b.subarray(0,max);b.cut=true}}
 else throw new Error('the file is not available');
 return b}
/* real path of a doc; a file that only exists in memory (dropped without a path) is written to a temp folder first */
async function rdAbs(f){if(f.abs&&fsN.existsSync(f.abs))return f.abs;if(!f.file)throw new Error('the file is not available');
 const dir=await fsN.promises.mkdtemp(pathN.join(require('os').tmpdir(),'samm-readme-'));RD.tmp.push(dir);
 const p=pathN.join(dir,pathN.basename(f.r));await fsN.promises.writeFile(p,Buffer.from(await f.file.arrayBuffer()));return p}
function rdClean(){RD.tmp.splice(0).forEach(d=>{try{fsN.rmSync(d,{recursive:true,force:true})}catch(e){}})}
function rdDecode(b,ext){
 if(b[0]===0xFF&&b[1]===0xFE)return b.toString('utf16le',2);
 if(b[0]===0xFE&&b[1]===0xFF)return new TextDecoder('utf-16be').decode(b.subarray(2));
 let s=b.toString('utf8');if(s.charCodeAt(0)===0xFEFF)s=s.slice(1);
 if(!s.includes('\ufffd'))return s;
 if(ext==='nfo'||ext==='diz')return Array.from(b,c=>c<128?String.fromCharCode(c):CP437[c-128]).join('');
 return new TextDecoder('windows-1252').decode(b)}
/* RTF -> plain text: skips font / colour tables and other hidden groups, understands \par \tab \'xx \uN */
function rdRtf(src){const SK=/^(fonttbl|colortbl|stylesheet|info|pict|object|header|footer|themedata|colorschememapping|datastore|latentstyles|listtable|listoverridetable|generator|filetbl|revtbl|rsidtbl|xmlnstbl)$/,
 SYM={emdash:'—',endash:'–',bullet:'•',lquote:'‘',rquote:'’',ldblquote:'“',rdblquote:'”',tab:'\t',par:'\n',line:'\n',page:'\n'},
 re=/\\([a-zA-Z]+)(-?\d+)? ?|\\'([0-9a-fA-F]{2})|\\([^a-zA-Z])/y,st=[],cp=new TextDecoder('windows-1252');
 let skip=false,uc=1,out='',i=0;const n=src.length;
 while(i<n){const c=src[i];
  if(c==='{'){st.push({skip,uc});i++;if(src[i]==='\\'&&src[i+1]==='*')skip=true;continue}
  if(c==='}'){const p=st.pop();if(p){skip=p.skip;uc=p.uc}i++;continue}
  if(c==='\\'){re.lastIndex=i;const m=re.exec(src);if(!m){i++;continue}i=re.lastIndex;
   if(m[1]){const w=m[1];
    if(SK.test(w))skip=true;
    else if(w==='uc')uc=+m[2]||0;
    else if(w==='u'&&!skip){const v=+m[2];out+=String.fromCharCode(v<0?v+65536:v);let k=uc;while(k-->0&&i<n){if(src[i]==='\\'&&src[i+1]==="'")i+=4;else i++}}
    else if(!skip&&SYM[w]!==undefined)out+=SYM[w]}
   else if(m[3]){if(!skip)out+=cp.decode(Uint8Array.of(parseInt(m[3],16)))}
   else if(m[4]){if(!skip){if(m[4]==='~')out+='\u00a0';else if('\\{}'.includes(m[4]))out+=m[4]}}
   continue}
  if(!skip&&c!=='\r'&&c!=='\n')out+=c;i++}
 return out.replace(/[ \t]+\n/g,'\n').replace(/\n{3,}/g,'\n\n').trim()}
/* plain text -> escaped HTML with clickable http(s) links */
function rdLink(t){return wkEsc(t).replace(/\bhttps?:\/\/[^\s<>"']+[^\s<>"'.,;:!?)\]]/g,u=>'<a href="'+u+'" data-x="'+u+'">'+u+'</a>')}
/* images next to the readme (md / html) are shown inline as data: URLs. Remote images are never loaded. */
function rdFindImg(f,u){const dir=f.r.split('/').slice(0,-1).join('/'),p=wkResolve(dir,u.split('#')[0].split('?')[0]).toLowerCase();
 return PLAN&&PLAN.files.find(x=>x.r.toLowerCase()===p)||null}
async function rdImgs(h,f){const re=/(<img\b[^>]*?\ssrc\s*=\s*["'])([^"']+)(["'])/gi,urls=new Set(),map=new Map();
 h.replace(re,(m,a,u)=>{urls.add(u);return m});
 for(const u of urls){if(/^data:image\//i.test(u)){map.set(u,u);continue}
  if(/^[a-z][a-z0-9+.-]*:/i.test(u)||u.startsWith('//'))continue;
  const x=rdFindImg(f,u),e=x?rdExt(x):'';if(!x||!RD_IMG[e])continue;
  try{map.set(u,'data:'+RD_IMG[e]+';base64,'+(await rdBytes(x,3*1048576)).toString('base64'))}catch(e2){}}
 return h.replace(re,(m,a,u,c)=>a+(map.get(u)||'data:,')+c)}
/* html readme: scripts are removed and the page is shown in a sandboxed frame (no scripts, no network, only inline images) */
async function rdHtml(t,f){
 t=t.replace(/<script\b[\s\S]*?<\/script\s*>/gi,'').replace(/<(iframe|object|embed|link|base|meta)\b[^>]*>/gi,'');
 t=await rdImgs(t,f);
 const doc='<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; img-src data:; style-src \'unsafe-inline\'; font-src data:"><style>body{font:14px/1.5 system-ui,Segoe UI,sans-serif;color:#111;background:#fff;margin:16px;overflow-wrap:anywhere}img{max-width:100%}</style>'+t;
 return '<iframe class="rd-frame" sandbox srcdoc="'+wkEsc(doc)+'" title="'+wkEsc(rdName(f))+'"></iframe>'}
/* ---- wiring ---- */
$('#pklist').addEventListener('click',e=>{const b=e.target.closest('[data-rd]');if(!b)return;e.preventDefault();e.stopPropagation();rdOpenFile(+b.dataset.rd)});
dlg.addEventListener('close',()=>{const d=$('#rdd');if(d&&d.open)d.close();rdClean();rdReset()});
