/* SA Mod Manager - 31-wiki.js: in-app Wiki reader (GitHub wiki repo, cached on disk so it also opens offline) */
/* Classic script: loaded in order by index.html, shares globals with the other files. */
/* Source: index.json + search.json + the .md pages from raw.githubusercontent.com. Cache: <userData>/wiki-cache.json. UI state: localStorage 'samm-wiki'. */
/*PURE-START*/
function wkEsc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function wkSlug(s){return String(s).toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu,'').trim().replace(/\s+/g,'-')||'x'}
function wkEnc(p){return String(p).split('/').map(encodeURIComponent).join('/')}
function wkResolve(dir,rel){let r=rel;try{r=decodeURIComponent(rel)}catch(e){}
 const out=r[0]==='/'?[]:dir.split('/').filter(Boolean);
 r.replace(/^\/+/,'').split('/').forEach(s=>{if(s==='..')out.pop();else if(s&&s!=='.')out.push(s)});return out.join('/')}
function wkBase(path){return wkSlug(String(path).split('/').pop().replace(/\.md$/i,'').replace(/^\d+[-_. ]\s*/,'').replace(/[-_]+/g,' '))}
/* Markdown -> HTML. Everything is escaped first; only the tags produced here (plus kbd/sub/sup/br) can appear. Returns {html,heads} */
function wkMd(src,dir,rawBase,opt,nested){
 opt=opt||{};const heads=[],seen={};let dropped=!!nested;
 const asset=u=>/^https?:\/\//i.test(u)?u:rawBase+wkEnc(wkResolve(dir,u.replace(/&amp;/g,'&')));
 const emph=t=>t.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/(^|[^\w])__(.+?)__(?!\w)/g,'$1<strong>$2</strong>')
  .replace(/(^|[^*\w])\*(?![\s*])([^*]+?)\*(?!\*)/g,'$1<em>$2</em>').replace(/(^|[^\w])_(?![\s_])([^_]+?)_(?!\w)/g,'$1<em>$2</em>').replace(/~~(.+?)~~/g,'<del>$1</del>');
 const link=(t,u)=>{
  if(/^https?:\/\//i.test(u))return '<a href="'+u+'" data-x="'+u+'">'+t+'</a>';
  if(u[0]==='#')return '<a href="'+u+'" data-h="'+u.slice(1)+'">'+t+'</a>';
  if(/^[a-z][a-z0-9+.-]*:/i.test(u))return t;
  const m=u.replace(/&amp;/g,'&').split('#'),p=wkResolve(dir,m[0]);
  if(/\.md$/i.test(p))return '<a href="#" data-w="'+wkEsc(p)+'" data-a="'+wkEsc(m[1]||'')+'">'+t+'</a>';
  const h=rawBase+wkEnc(p);return '<a href="'+h+'" data-x="'+h+'">'+t+'</a>'};
 const inl=s=>{const code=[],st=[],keep=h=>{st.push(h);return '\u0002'+(st.length-1)+'\u0002'};
  let t=String(s).replace(/(`+)([\s\S]*?[^`])\1(?!`)/g,(m,a,b)=>{code.push(wkEsc(b.trim()));return '\u0001'+(code.length-1)+'\u0001'});
  t=wkEsc(t).replace(/&lt;(\/?)(kbd|sub|sup)&gt;/g,'<$1$2>').replace(/&lt;br\s*\/?&gt;/g,'<br>');
  t=t.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g,(m,a,u)=>keep('<img src="'+asset(u)+'" alt="'+a+'" loading="lazy">'));
  t=t.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,(m,a,b)=>{const p=opt.wiki&&opt.wiki(a.replace(/&amp;/g,'&').trim());
   return keep(p?'<a href="#" data-w="'+wkEsc(p)+'" data-a="">'+emph(b||a)+'</a>':'<span class="wk-bad" title="No wiki page called “'+a+'”">'+emph(b||a)+'</span>')});
  t=t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g,(m,a,u)=>keep(link(emph(a),u)));
  t=emph(t);
  while(/\u0002\d+\u0002/.test(t))t=t.replace(/\u0002(\d+)\u0002/g,(m,i)=>st[i]);
  return t.replace(/\u0001(\d+)\u0001/g,(m,i)=>'<code>'+code[i]+'</code>')};
 const L=String(src).replace(/\r\n?/g,'\n').split('\n'),out=[];let i=0;
 const isFence=l=>/^\s*(```|~~~)/.test(l),isHr=l=>/^\s*([-*_])(\s*\1){2,}\s*$/.test(l),LI=/^(\s*)([-*+]|\d{1,3}[.)])\s+(.*)$/;
 const isSep=l=>l!==undefined&&l.includes('-')&&/^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/.test(l);
 const starts=(l,n)=>isFence(l)||/^\s{0,3}#{1,6}\s/.test(l)||isHr(l)||/^\s*>/.test(l)||LI.test(l)||(l.includes('|')&&isSep(n));
 const CO={NOTE:['note','Note'],TIP:['tip','Tip'],IMPORTANT:['imp','Important'],WARNING:['warn','Warning'],CAUTION:['bad','Caution']};
 while(i<L.length){const l=L[i];let m;
  if(!l.trim()){i++;continue}
  if(isFence(l)){const f=l.trim().slice(0,3),ind=l.match(/^\s*/)[0].length,b=[];i++;
   while(i<L.length&&!L[i].trim().startsWith(f)){b.push(L[i].replace(new RegExp('^\\s{0,'+ind+'}'),''));i++}i++;
   out.push('<pre class="wk-code"><button class="wk-cp" data-cp>Copy</button><code>'+wkEsc(b.join('\n'))+'</code></pre>');continue}
  if((m=l.match(/^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/))){i++;
   if(m[1].length===1&&!dropped&&!out.length){dropped=true;continue}dropped=true;
   const plain=m[2].replace(/\[([^\]]*)\]\([^)]*\)/g,'$1').replace(/[`*_~]/g,'');let id=wkSlug(plain);if(seen[id]){id+='-'+(++seen[id])}else seen[id]=1;
   const lv=Math.max(2,m[1].length);heads.push({l:lv,t:plain,id});out.push('<h'+lv+' id="wk-h-'+id+'">'+inl(m[2])+'</h'+lv+'>');continue}
  if(isHr(l)){out.push('<hr>');i++;continue}
  if(/^\s*>/.test(l)){const b=[];while(i<L.length&&/^\s*>/.test(L[i])){b.push(L[i].replace(/^\s*>\s?/,''));i++}
   let body=b.join('\n'),c=body.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][ \t]*\n?/i);
   if(c){body=body.slice(c[0].length);const k=CO[c[1].toUpperCase()];
    out.push('<div class="wk-co '+k[0]+'"><div class="wk-ct">'+k[1]+'</div>'+wkMd(body,dir,rawBase,opt,true).html+'</div>')}
   else out.push('<blockquote>'+wkMd(body,dir,rawBase,opt,true).html+'</blockquote>');continue}
  if(l.includes('|')&&isSep(L[i+1])){
   const cells=r=>r.trim().replace(/^\|/,'').replace(/\|$/,'').split(/(?<!\\)\|/).map(c=>c.trim().replace(/\\\|/g,'|'));
   const hd=cells(l),al=cells(L[i+1]).map(c=>/^:-+:$/.test(c)?'center':/-:$/.test(c)?'right':'');i+=2;const rows=[];
   while(i<L.length&&L[i].trim()&&L[i].includes('|')){rows.push(cells(L[i]));i++}
   const cell=(c,k,tg)=>'<'+tg+(al[k]?' style="text-align:'+al[k]+'"':'')+'>'+inl(c)+'</'+tg+'>';
   out.push('<div class="wk-tw"><table><thead><tr>'+hd.map((c,k)=>cell(c,k,'th')).join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+hd.map((_,k)=>cell(r[k]||'',k,'td')).join('')+'</tr>').join('')+'</tbody></table></div>');continue}
  if(LI.test(l)&&!isHr(l)){const it=[];
   while(i<L.length){const x=L[i];
    if(!isHr(x)&&(m=x.match(LI))){it.push({ind:m[1].replace(/\t/g,'    ').length,ord:/^\d/.test(m[2]),t:m[3]});i++;continue}
    if(!x.trim()){let j=i+1;while(j<L.length&&!L[j].trim())j++;
     if(it.length&&j<L.length&&(LI.test(L[j])||/^\s{2,}\S/.test(L[j]))&&!isFence(L[j])){i=j;continue}break}
    if(it.length&&/^\s{2,}\S/.test(x)&&!isFence(x)){it[it.length-1].t+=' '+x.trim();i++;continue}
    break}
   const task=t=>{const k=t.match(/^\[([ xX])\]\s+(.*)$/);return k?'<input type="checkbox" disabled'+(k[1]!==' '?' checked':'')+'> '+inl(k[2]):inl(t)};
   let h='';const stk=[];
   it.forEach(x=>{while(stk.length&&stk[stk.length-1].ind>x.ind)h+='</li></'+stk.pop().tag+'>';
    let top=stk[stk.length-1];const tg=x.ord?'ol':'ul';
    if(top&&top.ind===x.ind&&top.tag!==tg){h+='</li></'+stk.pop().tag+'>';top=stk[stk.length-1]}
    if(!top||top.ind<x.ind){const tag=x.ord?'ol':'ul';h+='<'+tag+'>';stk.push({ind:x.ind,tag})}else h+='</li>';
    h+='<li>'+task(x.t)});
   while(stk.length)h+='</li></'+stk.pop().tag+'>';out.push(h);continue}
  const p=[l];i++;while(i<L.length&&L[i].trim()&&!starts(L[i],L[i+1]))p.push(L[i++]);
  out.push('<p>'+inl(p.join('\n')).replace(/ {2,}\n/g,'<br>')+'</p>')}
 return{html:out.join('\n'),heads}}
function wkSnip(txt,terms){const t=String(txt||'').replace(/\s+/g,' ').trim(),lo=t.toLowerCase();let at=-1;
 terms.forEach(w=>{const k=lo.indexOf(w);if(k>=0&&(at<0||k<at))at=k});
 if(at<0)return t.slice(0,150)+(t.length>150?'…':'');
 const s=Math.max(0,at-55);return(s?'…':'')+t.slice(s,s+170)+(s+170<t.length?'…':'')}
/* search: every word must match somewhere (title, tag, heading, summary or body); "tag:xyz" filters by tag */
function wkSearch(q,pages,texts){const terms=[],tags=[];
 String(q).toLowerCase().split(/\s+/).filter(Boolean).forEach(w=>{if(/^tag:./.test(w))tags.push(w.slice(4));else terms.push(w)});
 const res=[];
 for(const p of pages){const pt=(p.tags||[]).map(t=>t.toLowerCase());if(tags.some(t=>!pt.includes(t)))continue;
  const ti=p.title.toLowerCase(),sm=(p.summary||'').toLowerCase(),hd=(p.heads||[]).map(h=>h.toLowerCase()),raw=texts?(texts[p.path]||''):'',bd=raw.toLowerCase();
  let sc=tags.length?5:0,ok=true;
  for(const t of terms){let s=0;
   if(ti.includes(t))s+=ti===t?20:ti.startsWith(t)?12:8;
   if(pt.some(x=>x.includes(t)))s+=6;
   if(hd.some(h=>h.includes(t)))s+=4;
   if(sm.includes(t))s+=3;
   if(bd){const k=bd.split(t).length-1;if(k)s+=Math.min(k,5)}
   if(!s){ok=false;break}sc+=s}
  if(ok)res.push({p,sc,snip:wkSnip(raw||p.summary,terms)})}
 res.sort((a,b)=>b.sc-a.sc||a.p.title.localeCompare(b.p.title));return{terms,tags,res}}
function wkHl(s,terms){if(!terms.length)return wkEsc(s);
 const re=new RegExp('('+terms.map(t=>t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')','i');
 return String(s).split(re).map((x,i)=>i%2?'<mark>'+wkEsc(x)+'</mark>':wkEsc(x)).join('')}
/*PURE-END*/
WI.wiki='<path d="M8 3.6C6.7 2.7 4.9 2.4 2.2 2.4v9.4c2.7 0 4.5.3 5.8 1.2 1.3-.9 3.1-1.2 5.8-1.2V2.4c-2.7 0-4.5.3-5.8 1.2zM8 3.6V13"/>';
WI.back='<path d="M9.8 3.5 5.3 8l4.5 4.5"/>';WI.fwd='<path d="M6.2 3.5 10.7 8l-4.5 4.5"/>';
WI.home='<path d="M2.5 7.6 8 3l5.5 4.6M4 6.8V13h8V6.8"/>';WI.ref='<path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9"/><path d="M13.5 2.5v3h-3"/>';
WI.find='<circle cx="7" cy="7" r="4.2"/><path d="m10.2 10.2 3.3 3.3"/>';WI.chev='<path d="M6 3.5 10.5 8 6 12.5"/>';
const WK={
 repo:'H4cKz7/San-Andreas-Mod-Manager-Wiki',branches:['main','master'],
 ready:false,c:{pages:{}},idx:null,pages:[],byPath:{},m:{},cur:null,hist:[],hi:-1,q:'',terms:[],open:new Set(),online:null,fetched:0,busy:false,sBusy:false,sTried:false,
 raw(b,p){return'https://raw.githubusercontent.com/'+this.repo+'/'+b+'/'+wkEnc(p)},
 rawBase(){return'https://raw.githubusercontent.com/'+this.repo+'/'+(this.c.br||this.branches[0])+'/'},
 /* network: Node https (no CORS), follows redirects, 8 s timeout */
 get(url,hops){hops=hops||0;return new Promise((res,rej)=>{
  const rq=require('https').get(url,{headers:{'User-Agent':'SAMM-Wiki','Cache-Control':'no-cache'},timeout:8000},r=>{
   if(r.statusCode>=300&&r.statusCode<400&&r.headers.location&&hops<4){r.resume();return res(this.get(new URL(r.headers.location,url).href,hops+1))}
   if(r.statusCode!==200){r.resume();return rej(Object.assign(new Error('HTTP '+r.statusCode),{code:r.statusCode}))}
   const b=[];r.on('data',d=>b.push(d));r.on('end',()=>res(Buffer.concat(b).toString('utf8')));r.on('error',rej)});
  rq.on('timeout',()=>rq.destroy(new Error('Timed out')));rq.on('error',rej)})},
 cfile(){return require('path').join(window.__native.userData,'wiki-cache.json')},
 loadCache(){try{const c=JSON.parse(require('fs').readFileSync(this.cfile(),'utf8'));if(c&&c.index&&c.index.sections){c.pages=c.pages||{};return c}}catch(e){}return{pages:{}}},
 saveCache(){clearTimeout(this._st);this._st=setTimeout(()=>{try{require('fs').promises.writeFile(this.cfile(),JSON.stringify(this.c)).catch(()=>{})}catch(e){}},600)},
 ui(){try{return JSON.parse(localStorage.getItem('samm-wiki'))||{}}catch(e){return{}}},
 saveUi(){try{localStorage.setItem('samm-wiki',JSON.stringify({last:this.cur||'',open:[...this.open]}))}catch(e){}},
 setIndex(ix){this.idx=ix;this.pages=[];this.byPath={};this.m={};
  const walk=(secs,ids,tt)=>(secs||[]).forEach(s=>{const i2=ids.concat(s.id),t2=tt.concat(s.title);
   (s.pages||[]).forEach(p=>{this.m[p.path]={anc:i2,trail:t2};this.pages.push(p);this.byPath[p.path]=p});walk(s.sections,i2,t2)});
  walk(ix.sections,[],[])},
 count(s){return(s.pages||[]).length+(s.sections||[]).reduce((n,x)=>n+this.count(x),0)},
 first(s){return s.pages&&s.pages.length?s.pages[0].path:((s.sections||[]).map(x=>this.first(x)).find(Boolean)||'')},
 find(n){const k=n.toLowerCase(),sl=wkSlug(n),r=this.pages.find(p=>p.title.toLowerCase()===k)||this.pages.find(p=>wkBase(p.path)===sl)||this.pages.find(p=>wkSlug(p.title)===sl);return r?r.path:null},
 /* ---- dialog ---- */
 build(){const d=this.d=document.createElement('dialog');d.className='wk';d.setAttribute('aria-label','Wiki');
  d.innerHTML='<div class="wk-top"><button class="btn icon" data-act="back" title="Back (Alt+Left)" aria-label="Back">'+wi(WI.back)+'</button><button class="btn icon" data-act="fwd" title="Forward (Alt+Right)" aria-label="Forward">'+wi(WI.fwd)+'</button>'
   +'<button class="btn icon" data-act="home" title="All sections" aria-label="All sections">'+wi(WI.home)+'</button>'
   +'<div class="wk-sbox">'+wi(WI.find)+'<input id="wkq" type="text" placeholder="Search the wiki  ( / )" autocomplete="off" spellcheck="false" aria-label="Search the wiki"><button class="wk-qc" data-act="clear" title="Clear search" aria-label="Clear search" hidden>'+wi(WI.x)+'</button></div>'
   +'<button class="btn icon" data-act="sync" title="Check for wiki updates" aria-label="Check for wiki updates">'+wi(WI.ref)+'</button><button class="btn icon" data-act="close" title="Close" aria-label="Close">'+wi(WI.x)+'</button></div>'
   +'<div class="wk-body"><div class="wk-side"><div class="wk-nav" id="wknav"></div><div class="wk-st" id="wkst"></div></div><div class="wk-main" id="wkmain"><div id="wkart"></div><div id="wkres" hidden></div></div></div>';
  document.body.appendChild(d);
  const q=this.qi=d.querySelector('#wkq');let t;
  q.oninput=()=>{clearTimeout(t);t=setTimeout(()=>this.setQ(q.value),110)};
  d.addEventListener('click',e=>{if(e.target===d){d.close();return}
   const a=e.target.closest('[data-w],[data-t],[data-x],[data-h],[data-s],[data-cp],[data-act]');if(!a||!d.contains(a))return;e.preventDefault();
   const D=a.dataset;
   if(D.act){const f={back:()=>this.step(-1),fwd:()=>this.step(1),home:()=>this.go(''),clear:()=>{this.setQ('');q.focus()},sync:()=>this.sync(true),close:()=>d.close(),retry:()=>{this.sync(true);if(this.cur)this.go(this.cur,'',true)}}[D.act];f&&f()}
   else if(D.w!==undefined)this.go(D.w,D.a||'');
   else if(D.t)this.setQ('tag:'+D.t,true);
   else if(D.x)window.open(D.x);
   else if(D.h!==undefined)this.jump(D.h);
   else if(D.s)this.fold(a);
   else if(D.cp!==undefined)this.copy(a)});
  d.addEventListener('cancel',e=>{if(q.value){e.preventDefault();this.setQ('')}});
  d.addEventListener('close',()=>this.saveUi());
  d.addEventListener('keydown',e=>{e.stopPropagation();const k=e.key.toLowerCase(),mod=e.ctrlKey||e.metaKey;
   if(e.altKey&&e.key==='ArrowLeft'){e.preventDefault();this.step(-1)}
   else if(e.altKey&&e.key==='ArrowRight'){e.preventDefault();this.step(1)}
   else if((e.key==='/'&&!/INPUT|TEXTAREA/.test(e.target.tagName))||(mod&&(k==='f'||k==='k'))){e.preventDefault();q.focus();q.select()}})},
 async show(){if(!this.d)this.build();
  if(!this.ready){this.ready=true;this.c=this.loadCache();const u=this.ui();this.open=new Set(u.open||[]);this._last=u.last;if(this.c.index)this.setIndex(this.c.index)}
  this.d.showModal();this.qi.focus();
  if(this.idx){this.renderNav();if(this.cur===null)this.go(this._last&&this.byPath[this._last]?this._last:'')}
  else this.d.querySelector('#wkart').innerHTML='<div class="wk-msg">Loading the wiki…</div>';
  this.status();this.sync(false)},
 status(msg){const el=this.d.querySelector('#wkst'),ix=this.idx;let t=msg;
  if(!t)t=this.online===false?'Offline: showing the saved copy':this.online?'Up to date':'';
  const u=ix&&ix.updated?new Date(ix.updated):null;if(!msg&&u&&!isNaN(u))t+=(t?' · ':'')+'Wiki updated '+u.toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'});
  el.textContent=t},
 /* ---- sync with GitHub ---- */
 async sync(force){if(this.busy)return;if(!force&&this.idx&&Date.now()-this.fetched<60000)return;
  this.busy=true;this.d.querySelector('[data-act=sync]').classList.add('spin');this.status('Checking for updates…');
  const order=this.c.br?[this.c.br].concat(this.branches.filter(b=>b!==this.c.br)):this.branches;let txt=null,err=null,used=null;
  for(const b of order){try{txt=await this.get(this.raw(b,'index.json'));used=b;break}catch(e){err=e;if(e.code!==404)break}}
  this.busy=false;this.d.querySelector('[data-act=sync]').classList.remove('spin');
  let ix=null;if(txt!=null){try{ix=JSON.parse(txt);if(!ix||!Array.isArray(ix.sections))throw 0}catch(e){ix=null;err=new Error('index.json is not valid');err.code=-1}}
  if(!ix){this.online=err&&err.code===404||(err&&err.code===-1)?this.online:false;
   if(!this.idx)this.fail(err);else{if(err&&(err.code===404||err.code===-1))this.status('Wiki index problem: '+err.message);else this.status()}return}
  this.online=true;this.fetched=Date.now();this.c.br=used;
  if(!this.idx||ix.rev!==this.c.rev){const had=!!this.idx;this.c.rev=ix.rev;this.c.index=ix;this.c.search=null;this.c.pages={};this.sTried=false;this.setIndex(ix);this.saveCache();this.renderNav();
   if(this.cur&&this.byPath[this.cur])this.go(this.cur,'',true);else this.go(!had&&this._last&&this.byPath[this._last]?this._last:'','');
   if(this.q)this.runSearch()}
  else this.saveCache();
  this.status()},
 fail(e){const nf=e&&e.code===404;
  this.d.querySelector('#wkart').innerHTML='<div class="wk-msg"><b>'+(nf?'The wiki index was not found':'Couldn’t reach the wiki')+'</b><p>'
   +(nf?'The repository has no <code>index.json</code> yet. Run <code>node tools/build-index.js</code> in the wiki repo and push the result.':'Check your internet connection and try again. Once the wiki has loaded one time it also works offline.')
   +'</p><p><button class="btn" data-act="retry">Try again</button> <button class="btn" data-x="https://github.com/'+this.repo+'">Open on GitHub</button></p></div>';
  this.status(e?String(e.message):'')},
 async text(p){if(this.c.pages[p.path]!=null)return this.c.pages[p.path];
  const t=await this.get(this.raw(this.c.br||this.branches[0],p.path));this.c.pages[p.path]=t;this.saveCache();return t},
 async needSearch(){if(this.c.search||this.sBusy||this.sTried)return;this.sBusy=true;this.sTried=true;
  try{const s=JSON.parse(await this.get(this.raw(this.c.br||this.branches[0],'search.json')));if(s&&typeof s==='object'){this.c.search=s;this.saveCache()}}catch(e){}
  this.sBusy=false;if(this.q)this.runSearch()},
 /* ---- navigation ---- */
 navHtml(secs,dp){return secs.map(s=>{const o=this.open.has(s.id);
  return'<div class="wk-sec"><button class="wk-sh" data-s="'+wkEsc(s.id)+'" aria-expanded="'+o+'">'+wi(WI.chev)+'<span>'+wkEsc(s.title)+'</span><i>'+this.count(s)+'</i></button><div class="wk-sp"'+(o?'':' hidden')+'>'
   +(s.pages||[]).map(p=>'<a href="#" class="wk-pi'+(p.path===this.cur?' on':'')+'" data-w="'+wkEsc(p.path)+'">'+wkEsc(p.title)+'</a>').join('')+this.navHtml(s.sections||[],dp+1)+'</div></div>'}).join('')},
 renderNav(){const n=this.d.querySelector('#wknav');n.innerHTML=this.navHtml(this.idx.sections,0)},
 fold(b){const id=b.dataset.s,o=b.getAttribute('aria-expanded')!=='true';o?this.open.add(id):this.open.delete(id);
  b.setAttribute('aria-expanded',o);b.nextElementSibling.hidden=!o;this.saveUi()},
 mark(){const n=this.d.querySelector('#wknav');n.querySelectorAll('.wk-pi.on').forEach(e=>e.classList.remove('on'));
  const m=this.m[this.cur];if(!m)return;let redo=false;m.anc.forEach(a=>{if(!this.open.has(a)){this.open.add(a);redo=true}});
  if(redo)this.renderNav();const el=n.querySelector('.wk-pi[data-w="'+CSS.escape(this.cur)+'"]');if(el){el.classList.add('on');el.scrollIntoView({block:'nearest'})}},
 btns(){const b=this.d.querySelector('[data-act=back]'),f=this.d.querySelector('[data-act=fwd]');b.disabled=this.hi<=0;f.disabled=this.hi>=this.hist.length-1},
 step(k){const n=this.hi+k;if(n<0||n>=this.hist.length)return;this.hi=n;this.go(this.hist[n],'',true)},
 jump(id){const el=this.d.querySelector('#wk-h-'+CSS.escape(id));if(el)el.scrollIntoView({block:'start',behavior:'smooth'})},
 copy(b){const c=b.parentNode.querySelector('code').textContent;
  nCopy(c);
  b.textContent='Copied';clearTimeout(b._t);b._t=setTimeout(()=>{b.textContent='Copy'},1200)},
 async go(path,anchor,keep){const art=this.d.querySelector('#wkart'),main=this.d.querySelector('#wkmain');
  this.d.querySelector('#wkres').hidden=true;art.hidden=false;
  if(!keep){if(this.hist[this.hi]!==path){this.hist=this.hist.slice(0,this.hi+1);this.hist.push(path);this.hi=this.hist.length-1}}
  this.cur=path;this.btns();
  if(path===''||!this.byPath[path]){this.cur='';this.mark();art.innerHTML=this.landing();main.scrollTop=0;this.saveUi();return}
  const p=this.byPath[path];this.mark();art.innerHTML='<div class="wk-msg">Loading…</div>';
  try{const raw=await this.text(p);if(this.cur!==path)return;art.innerHTML=this.article(p,raw);
   if(this.q)this.markDom(art,this.terms);
   if(anchor)this.jump(anchor);else main.scrollTop=0}
  catch(e){if(this.cur!==path)return;this.online=false;this.status();
   art.innerHTML='<div class="wk-msg"><b>This page isn’t saved on this computer yet</b><p>Connect to the internet and open it once. After that it is available offline.</p><p><button class="btn" data-act="retry">Try again</button></p></div>'}
  this.saveUi()},
 landing(){const x=this.idx,tg={};this.pages.forEach(p=>(p.tags||[]).forEach(t=>{tg[t]=(tg[t]||0)+1}));
  const tl=Object.keys(tg).sort((a,b)=>tg[b]-tg[a]||a.localeCompare(b)).slice(0,32),home=x.home&&this.byPath[x.home];
  return'<div class="wk-art"><h1>'+wkEsc(x.title||'Wiki')+'</h1>'+(x.description?'<p class="wk-lead">'+wkEsc(x.description)+'</p>':'')
   +(home?'<p><a href="#" data-w="'+wkEsc(home.path)+'">Start here: '+wkEsc(home.title)+'</a></p>':'')
   +'<div class="wk-sl">'+x.sections.map(s=>'<a href="#" class="wk-sr" data-w="'+wkEsc(this.first(s))+'"><b>'+wkEsc(s.title)+'</b>'+(s.summary?'<span>'+wkEsc(s.summary)+'</span>':'')+'<i>'+this.count(s)+' pages</i></a>').join('')+'</div>'
   +(tl.length?'<h2>Browse by tag</h2><div class="wk-tags">'+tl.map(t=>'<button class="wk-tag" data-t="'+wkEsc(t)+'">'+wkEsc(t)+' <i>'+tg[t]+'</i></button>').join('')+'</div>':'')+'</div>'},
 article(p,raw){const body=raw.replace(/^\uFEFF/,'').replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/,''),dir=p.path.split('/').slice(0,-1).join('/');
  const r=wkMd(body,dir,this.rawBase(),{wiki:n=>this.find(n)}),h2=r.heads.filter(h=>h.l===2),mt=this.m[p.path]||{trail:[]};
  const toc=h2.length>=3?'<div class="wk-toc"><b>On this page</b>'+h2.map(h=>'<a href="#" data-h="'+wkEsc(h.id)+'">'+wkEsc(h.t)+'</a>').join('')+'</div>':'';
  const i=this.pages.indexOf(p),pv=this.pages[i-1],nx=this.pages[i+1],br=this.c.br||this.branches[0];
  return'<div class="wk-art"><div class="wk-bc">'+mt.trail.map(wkEsc).join(' › ')+'</div><h1>'+wkEsc(p.title)+'</h1>'
   +(p.summary?'<p class="wk-lead">'+wkEsc(p.summary)+'</p>':'')
   +((p.tags||[]).length?'<div class="wk-tags">'+p.tags.map(t=>'<button class="wk-tag" data-t="'+wkEsc(t)+'">'+wkEsc(t)+'</button>').join('')+'</div>':'')
   +toc+'<div class="wk-md">'+r.html+'</div><div class="wk-ft"><div class="wk-pn">'
   +(pv?'<a href="#" data-w="'+wkEsc(pv.path)+'"><small>Previous</small>'+wkEsc(pv.title)+'</a>':'<span></span>')
   +(nx?'<a href="#" class="nx" data-w="'+wkEsc(nx.path)+'"><small>Next</small>'+wkEsc(nx.title)+'</a>':'<span></span>')+'</div>'
   +(p.updated?'<div class="wk-ed">Updated '+wkEsc(p.updated)+'</div>':'')+'</div></div>'},
 /* ---- search ---- */
 setQ(v,fill){v=String(v);if(fill||this.qi.value!==v)this.qi.value=v;this.q=v.trim();this.d.querySelector('.wk-qc').hidden=!this.q;this.runSearch()},
 runSearch(){const res=this.d.querySelector('#wkres'),art=this.d.querySelector('#wkart');
  if(!this.q){res.hidden=true;art.hidden=false;this.terms=[];art.querySelectorAll('mark').forEach(m=>m.replaceWith(m.textContent));art.normalize();return}
  if(!this.idx)return;this.needSearch();
  const r=wkSearch(this.q,this.pages,this.c.search);this.terms=r.terms;const sh=r.res.slice(0,60);
  const note=this.c.search?'':(this.sBusy?'Loading full-text search…':'Searching titles, tags and headings. Full-text search needs an internet connection the first time.');
  res.innerHTML='<div class="wk-art"><div class="wk-rh">'+(r.res.length?r.res.length+(r.res.length===1?' page':' pages')+' match':'No pages match')+' “'+wkEsc(this.q)+'”'+(r.res.length>sh.length?' (showing '+sh.length+')':'')+'</div>'
   +sh.map(x=>{const m=this.m[x.p.path]||{trail:[]};
    return'<a href="#" class="wk-r" data-w="'+wkEsc(x.p.path)+'"><span class="wk-rt">'+wkHl(x.p.title,r.terms)+'</span><span class="wk-rb">'+m.trail.map(wkEsc).join(' › ')+'</span>'
     +(x.snip?'<span class="wk-rs">'+wkHl(x.snip,r.terms)+'</span>':'')+'</a>'}).join('')
   +(r.res.length?'':'<div class="wk-msg">Try fewer or shorter words, or browse by tag from the home page. Use <code>tag:name</code> to list pages with a tag.</div>')
   +(note?'<div class="wk-note">'+note+'</div>':'')+'</div>';
  res.hidden=false;art.hidden=true;this.d.querySelector('#wkmain').scrollTop=0},
 markDom(el,terms){if(!terms.length)return;
  const re=new RegExp('('+terms.map(t=>t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')','i'),w=document.createTreeWalker(el.querySelector('.wk-md')||el,NodeFilter.SHOW_TEXT),ns=[];
  while(w.nextNode())ns.push(w.currentNode);
  ns.forEach(n=>{if(n.parentNode.closest('button')||!re.test(n.nodeValue))return;const f=document.createDocumentFragment();
   n.nodeValue.split(re).forEach((x,i)=>{if(i%2){const m=document.createElement('mark');m.textContent=x;f.appendChild(m)}else if(x)f.appendChild(document.createTextNode(x))});n.parentNode.replaceChild(f,n)});
  const first=el.querySelector('mark');if(first)first.scrollIntoView({block:'center'})}};
$('#wikib').innerHTML=wi(WI.wiki);
$('#wikib').onclick=()=>WK.show();
