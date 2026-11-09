/* SA Mod Manager - 13-editor-form.js: config editor Form (INI) and Tree (JSON) rendering, undo history for the editor */
/* Classic script: loaded in order by index.html, shares globals with the other files. */
const JNUM=/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/,jStrict=t=>{try{JSON.parse(t);return true}catch(e){return false}};
/* read JSON text into the tree model; throws when the text can't be read */
function jLoad(c,text){
 if(!text.trim()){c.ast={synthetic:true,root:{t:'object',s:0,e:2,members:[]},lead:[]};c.obj=Object.create(null);c.jt=text;c.jc=false;return}
 const a=JC.parse(text);c.ast=a;c.obj=JC.val(a.root);c.jt=text;c.jc=!jStrict(text)}
/* change one value / member in place (comments, indentation and line endings stay as they are) */
function jEdit(c,op,p,a){const old=c.jt;let t=old,ast=c.ast;
 if(ast.synthetic){t='{}\n';ast=JC.parse(t)}
 try{jLoad(c,op==='set'?JC.set(t,ast,p,a.raw):op==='del'?JC.del(t,ast,p):JC.add(t,ast,p,a.key,a.raw))}
 catch(e){try{jLoad(c,old)}catch(x){}toast('Couldn’t apply that change: '+e.message);return false}
 return true}
const KEYN={8:'Backspace',9:'Tab',13:'Enter',16:'Shift',17:'Ctrl',18:'Alt',20:'Caps Lock',27:'Esc',32:'Space',33:'Page Up',34:'Page Down',35:'End',36:'Home',37:'Left',38:'Up',39:'Right',40:'Down',45:'Insert',46:'Delete',160:'Left Shift',161:'Right Shift',162:'Left Ctrl',163:'Right Ctrl',164:'Left Alt',165:'Right Alt',186:';',187:'=',188:',',189:'-',190:'.',191:'/',192:'`',219:'[',220:'\\',221:']',222:"'"};
const vkName=v=>{if(!/^0x[0-9a-f]{1,3}$/i.test(v))return'';const n=parseInt(v,16);if(n>=48&&n<=57||n>=65&&n<=90)return String.fromCharCode(n);if(n>=112&&n<=135)return'F'+(n-111);if(n>=96&&n<=105)return'Num '+(n-96);return KEYN[n]||''};
const cleanC=raw=>raw.replace(/^\s*[;#]+\s?/,'').replace(/\s*[#;]+\s*$/,'').trim();
const isIdList=v=>/^"\s*\d+(\s*,\s*\d+)*\s*"$/.test(v.trim());
const idTokens=v=>v.trim().slice(1,-1).split(',').map(x=>x.trim()).filter(Boolean);
const chipHtml=t=>t.map((x,i)=>`<span class="chip" data-i="${i}">${esc(x)}<button data-chipx aria-label="Remove ${esc(x)}">×</button></span>`).join('');
function chipsRender(row,l){const t=idTokens(l.val);row.querySelector('.cl').innerHTML=chipHtml(t);row.querySelector('.cn').textContent=t.length+' IDs'}
function iniForm(m,txt,col){txt=txt||new Set();col=col||new Set();const L=m.lines,secs=[];let cur={li:-1,name:null,items:[]};secs.push(cur);
 L.forEach((l,li)=>{if(l.t==='s'){cur={li,name:l.name,items:[]};secs.push(cur)}else if(l.t!=='b')cur.items.push([l,li])});
 const row=([l,li],sn)=>{
  if(l.t==='c'){const t=cleanC(l.raw);return t&&!/^[-=#*_~ ]+$/.test(t)?`<div class="note">${esc(t)}</div>`:''}
  if(l.t==='e')return `<div class="kv" data-li="${li}"><div class="kl"><div class="kn"></div></div><div class="v"><input type="text" data-raw value="${esc(l.raw.trim())}" spellcheck="false"></div><button class="x" data-del title="Remove">×</button></div>`;
  const key=l.key.trim(),v=l.val.trim(),d=cleanC(l.cm||''),numericHint=/\(\s*-?[\d.]+\s*(to|-|–)\s*-?[\d.]+/i.test(l.cm||'');
  const isB0=/^(true|false)$/i.test(v)||(/^[01]$/.test(v)&&!numericHint),isB=isB0&&!txt.has(sn+'|'+key);
  const head=`<div class="kl"><div class="kn" title="${esc(key)}">${esc(key)}</div>${d?`<div class="kd">${esc(d)}</div>`:''}</div>`;
  if(isIdList(v)){const t=idTokens(v);return `<div class="kv wide" data-li="${li}">${head}<button class="x" data-del title="Remove">×</button><div class="v ids"><div class="cl">${chipHtml(t)}</div><div class="cadd"><input type="text" class="chip-in" placeholder="Add an ID and press Enter" spellcheck="false"><small class="cn">${t.length} IDs</small></div></div></div>`}
  let val;
  if(isB){const on=/^(true|1)$/i.test(v);val=`<button class="sw ${on?'on':''}" data-tog aria-label="Toggle ${esc(key)}"></button><span class="bv">${esc(v)}</span><button class="tt" data-totext title="Not really a toggle? Edit as text" aria-label="Edit ${esc(key)} as text">${ICO.pen}</button>`}
  else{const kn=vkName(v);val=`<input type="text" data-val value="${esc(l.val)}" spellcheck="false">${kn?`<span class="kbd">${esc(kn)}</span>`:''}${isB0?`<button class="tt" data-totog title="Show as a toggle" aria-label="Show ${esc(key)} as a toggle">${ICO.tog}</button>`:''}`}
  return `<div class="kv" data-li="${li}">${head}<div class="v">${val}</div><button class="x" data-del title="Remove">×</button></div>`};
 let h='';
 secs.forEach(sc=>{if(sc.li<0){
   const about=sc.items.filter(([l])=>l.t==='c').map(([l])=>cleanC(l.raw)).filter(t=>t&&!/^[-=#*_~ ]+$/.test(t)),rest=sc.items.filter(([l])=>l.t!=='c');
   if(about.length)h+=`<details class="about"><summary>About this file</summary><div>${about.map(t=>`<p>${esc(t)}</p>`).join('')}</div></details>`;
   if(rest.length)h+=`<div class="edsec" data-sec="-1">${rest.map(x=>row(x,'')).join('')}</div>`;return}
  const keys=sc.items.filter(([l])=>l.t==='k'||l.t==='e').length;
  h+=`<div class="edsec${col.has(sc.name)?' collapsed':''}" data-sec="${sc.li}" data-sn="${esc(sc.name)}"><div class="sh" tabindex="0" role="button" title="Click to collapse or expand" aria-expanded="${!col.has(sc.name)}"><span>[${esc(sc.name)}]</span><small>${keys} setting${keys===1?'':'s'}</small></div>${sc.items.map(x=>row(x,sc.name)).join('')}<div class="addkv"><input type="text" class="ak" placeholder="New key" spellcheck="false"><input type="text" class="av" placeholder="Value" spellcheck="false"><button class="btn sm" data-addkv>Add</button></div></div>`});
 return h+`<div class="edaddsec"><input type="text" id="edsecname" placeholder="New section name"><button class="btn sm" data-addsec>Add section</button></div>`}
function jsonTree(o,ast,txt,jo){const P=p=>esc(JSON.stringify(p)),cap=300,dm=ast?JC.descs(ast):new Map(),hm=ast?JC.heads(ast):new Map();
 const D=p=>dm.get(JSON.stringify(p))||'';
 const hx2=n=>('0'+Math.max(0,Math.min(255,Math.round(+n)||0)).toString(16)).slice(-2);
 const cpick=(v,sw)=>sw?'<span class="cpw">'+sw+'<button type="button" class="cpick" aria-label="Pick colour" title="Pick colour"></button></span>':'';
 const swatch=v=>v&&typeof v==='object'&&!Array.isArray(v)&&['red','green','blue'].every(x=>typeof v[x]==='number')?'<i class="csw" title="rgba('+v.red+', '+v.green+', '+v.blue+(typeof v.alpha==='number'?', '+v.alpha:'')+')" style="background:rgba('+v.red+','+v.green+','+v.blue+','+(typeof v.alpha==='number'?Math.max(0,Math.min(255,v.alpha))/255:1)+')"></i>':'';
 const lbl=(p,k)=>{const d=D(p);return `<div class="jkc"><span class="jk" title="${esc(String(k))}">${esc(String(k))}</span>${d?`<div class="kd">${esc(d)}</div>`:''}</div>`};
 const leaf=(v,p,k)=>{const t=v===null?'null':typeof v,flag=t==='number'&&(v===0||v===1)&&/^b[A-Z_]/.test(String(k));
  const isBo=t==='boolean'||flag,asT=isBo&&txt&&txt.has(JSON.stringify(p)),ed=isBo&&!asT?`<button class="sw ${v===true||v===1?'on':''}" data-jtog aria-label="Toggle"></button><span class="bv">${v}</span><button class="tt" data-totext title="Not really a toggle? Edit as text" aria-label="Edit as text">${ICO.pen}</button>`:t==='null'?'<span class="jnull">null</span><button class="btn sm" data-jset>Set value</button>':`<input type="text" class="jv" data-jt="${t==='boolean'?'b':t==='number'?'n':'s'}" value="${esc(String(v))}" spellcheck="false">${isBo?`<button class="tt" data-totog title="Show as a toggle" aria-label="Show as a toggle">${ICO.tog}</button>`:''}`;
  return `<div class="jl" data-path="${P(p)}">${lbl(p,k)}<div class="v">${ed}</div><span class="jty">${flag?'0 / 1':t}</span><button class="x" data-jdel title="Remove">×</button></div>`};
 const node=(v,p,k,d)=>{const hx=hm.get(JSON.stringify(p));return(hx?'<div class="note jsec">'+esc(hx)+'</div>':'')+node0(v,p,k,d)};
 const node0=(v,p,k,d)=>{if(v&&typeof v==='object'){const isA=Array.isArray(v),ks=Object.keys(v);
   if(isA&&p.length&&ks.length&&ks.length<=300&&v.every(x=>typeof x==='number'))
    return `<div class="jl jids" data-path="${P(p)}">${lbl(p,k)}<div class="v ids"><div class="cl">${v.map((x,i)=>`<span class="chip" data-i="${i}">${x}<button data-jchipx aria-label="Remove ${x}">×</button></span>`).join('')}</div><div class="cadd"><input type="text" class="jchip-in" placeholder="Add a number, then Enter" spellcheck="false"><small>${ks.length} value${ks.length===1?'':'s'}</small></div></div><span class="jty">list</span><button class="x" data-jdel title="Remove">×</button></div>`;
   const dd=D(p);
   return `<details class="jn" ${(jo&&JSON.stringify(p) in jo?jo[JSON.stringify(p)]:d<1)?'open':''} data-path="${P(p)}"><summary><span class="jk">${esc(String(k))}</span>${cpick(v,swatch(v))}<small>${isA?'['+ks.length+']':'{'+ks.length+'}'}</small>${dd?`<span class="jdesc" title="${esc(dd)}">${esc(dd)}</span>`:''}${p.length?'<button class="x" data-jdel title="Remove">×</button>':''}</summary><div class="jc">${ks.slice(0,cap).map(x=>node(v[x],[...p,isA?+x:x],x,d+1)).join('')}${ks.length>cap?`<div class="stats" style="padding:4px 14px">…and ${ks.length-cap} more (use Raw to edit)</div>`:''}<div class="jadd">${isA?'':'<input type="text" class="jak" placeholder="key" spellcheck="false">'}<div class="dd cdd jat" data-opts="string,number,boolean,null,object,array" data-val="string" aria-label="Type"></div><input type="text" class="jav" placeholder="value" spellcheck="false"><button class="btn sm" data-jadd>Add</button></div></div></details>`}
  return leaf(v,p,k)};
 return node(o,[],'root',0)}
const jget=(o,p)=>p.reduce((a,k)=>a[k],o);
// live colour swatch: re-read the red/green/blue/alpha values of the object the edited field belongs to
function swUpdate(t){const c=ED.cur,d=t.closest('details.jn');if(!c||!d)return;const sw=d.querySelector(':scope>summary .csw');if(!sw)return;
 let v;try{v=jget(c.obj,JSON.parse(d.dataset.path))}catch(e){return}
 if(!v||typeof v!=='object')return;const n=x=>Math.max(0,Math.min(255,Math.round(+v[x])||0)),ha=typeof v.alpha==='number',s=n('red')+','+n('green')+','+n('blue');
 sw.style.background='rgba('+s+','+(ha?n('alpha')/255:1)+')';sw.title='rgba('+s+(ha?', '+n('alpha'):'')+')';
 const pk=d.querySelector(':scope>summary .cpick');if(pk)pk.value='#'+[n('red'),n('green'),n('blue')].map(x=>('0'+x.toString(16)).slice(-2)).join('')}
function edText(){const c=ED.cur;if(c.view==='raw')return c.text;
 if(c.kind==='ini')return iniText(c.model);
 return c.jt}
function edBase(c){if(c.view==='form'&&c.kind==='ini'){if(c._bo!==c.orig){c._bo=c.orig;c._bn=iniText(parseIniEd(c.orig))}return c._bn}return c.orig}
function edStateNow(){clearTimeout(ED._st);edState()}
function edState(){const c=ED.cur;if(!c)return;c.dirty=edText()!==edBase(c);
 const s=$('#edsave');if(s){s.disabled=!c.dirty;s.textContent=c.dirty?'Save changes':'Saved'}const rv=$('#edrev');if(rv)rv.disabled=!c.dirty;
 const p=$('#edright .edp');if(p)p.classList.toggle('dirty',c.dirty);
 clearTimeout(ED._ht);ED._ht=setTimeout(edHistPush,420);edHistUi()}
function edStateSoon(){clearTimeout(ED._st);const c=ED.cur;if(c&&c.view==='raw')return edState();ED._st=setTimeout(edState,160)}
function edHistUi(){const c=ED.cur,u=$('#edundo'),r=$('#edredo');if(!c||!u)return;const nu=c.hi+(edText()!==c.hist[c.hi]?1:0),nr=c.hist.length-1-c.hi;u.disabled=!nu;r.disabled=nr<=0;
 const um=$('#edundomore'),rm=$('#edredomore');if(um)um.disabled=!nu;if(rm)rm.disabled=nr<=0;const a=$('#edundoalln'),b=$('#edredoalln');if(a)a.textContent=nu;if(b)b.textContent=Math.max(0,nr)}
function edHistPush(){const c=ED.cur;if(!c||c._restoring)return;const t=edText();if(t===c.hist[c.hi]){edHistUi();return}
 c.hist.splice(c.hi+1);c.hist.push(t);if(c.hist.length>100)c.hist.shift();c.hi=c.hist.length-1;edHistUi()}
function edSetText(t){const c=ED.cur;c._restoring=true;
 if(c.view==='raw')c.text=t;
 else if(c.kind==='ini')c.model=parseIniEd(t);
 else{try{jLoad(c,t)}catch(e){c.view='raw';c.text=t}}
 edRight(true);c._restoring=false}
function edUndo(){const c=ED.cur;if(!c)return;clearTimeout(ED._st);clearTimeout(ED._ht);edHistPush();if(c.hi<=0)return;c.hi--;edSetText(c.hist[c.hi])}
function edRedo(){const c=ED.cur;if(!c)return;clearTimeout(ED._st);clearTimeout(ED._ht);if(c.hi>=c.hist.length-1)return;c.hi++;edSetText(c.hist[c.hi])}
function edUndoAll(){const c=ED.cur;if(!c)return;clearTimeout(ED._st);clearTimeout(ED._ht);edHistPush();if(c.hi<=0)return;c.hi=0;edSetText(c.hist[0])}
function edRedoAll(){const c=ED.cur;if(!c)return;clearTimeout(ED._st);clearTimeout(ED._ht);if(c.hi>=c.hist.length-1)return;c.hi=c.hist.length-1;edSetText(c.hist[c.hi])}
function edSplClose(){['#edundom','#edredom'].forEach(k=>{const m=$(k);if(m)m.hidden=true});['#edundomore','#edredomore'].forEach(k=>{const b=$(k);if(b)b.setAttribute('aria-expanded','false')})}
document.addEventListener('click',e=>{if(!e.target.closest('#edundod,#edredod'))edSplClose()});
function edBody(){cpClose();const c=ED.cur,b=$('#edbody');
 if(c.view==='raw'){b.innerHTML=`<div class="edrawwrap"><pre id="edmir" aria-hidden="true"></pre><textarea id="edraw" spellcheck="false">${esc(c.text)}</textarea></div>`;edFindApply();return}
 b.innerHTML=c.kind==='ini'?iniForm(c.model,c.txt,c.col):(c.ast.lead.length?`<details class="about"><summary>About this file</summary><div>${c.ast.lead.map(t=>`<p>${esc(t)}</p>`).join('')}</div></details>`:'')+jsonTree(c.obj,c.ast,c.txt,c.jo);enhanceCdd(b);edFindApply()}
function edRight(keep){const c=ED.cur,r=$('#edright'),sc0=keep&&$('#edbody')?$('#edbody').scrollTop:0;
 if(!c){r.innerHTML='<div class="empty" style="margin:auto;border:0">Pick a file on the left to edit it.<br>Every change is backed up automatically.</div>';return}
 r.innerHTML=`<div class="edh"><div class="edp" title="${esc(c.abs)}">${esc(c.rel)}</div><div class="edt"><div class="seg" id="edview"><button data-v="form" class="${c.view==='form'?'on':''}">${c.kind==='json'?'Tree':'Form'}</button><button data-v="raw" class="${c.view==='raw'?'on':''}">Raw</button></div>${c.kind==='json'&&!c.jc?'<button class="btn sm" id="edfmt">Format</button>':''}<div class="dd" id="edbd"><button class="btn sm" id="edbk">Backups</button><div class="ddm right" id="edbm" hidden></div></div><div class="dd split" id="edundod"><button class="btn sm" id="edundo" disabled title="Undo (Ctrl+Z)">Undo</button><button class="btn sm more" id="edundomore" disabled title="More undo options" aria-label="More undo options" aria-haspopup="menu" aria-expanded="false"><svg viewBox="0 0 12 12" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5"/></svg></button><div class="ddm" id="edundom" role="menu" hidden><div class="ddi" role="menuitem" data-eall="undo">Undo all<small id="edundoalln"></small></div></div></div><div class="dd split" id="edredod"><button class="btn sm" id="edredo" disabled title="Redo (Ctrl+Y)">Redo</button><button class="btn sm more" id="edredomore" disabled title="More redo options" aria-label="More redo options" aria-haspopup="menu" aria-expanded="false"><svg viewBox="0 0 12 12" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5"/></svg></button><div class="ddm right" id="edredom" role="menu" hidden><div class="ddi" role="menuitem" data-eall="redo">Redo all<small id="edredoalln"></small></div></div></div><button class="btn sm" id="edrev">Revert</button><button class="btn sm pri" id="edsave">Save changes</button></div></div>${edTbHtml(c)}${!c.exists?'<div class="edn">This file no longer exists. Restore a backup to bring it back.</div>':''}${c.err?`<div class="edn bad">${esc(c.err)}</div>`:''}<div class="edbody" id="edbody"></div>`;
 edBody();edState();if(keep){const b=$('#edbody');if(b)b.scrollTop=sc0}}
function edList(){const box=$('#edlist');$('#edbkbar').hidden=ED.tab!=='bk';
 if(ED.tab==='bk'){const q=ED.q.trim().toLowerCase(),all=BK.all(),a=all.filter(x=>(ED.filter==='all'||extOfRel(x.rel)===ED.filter)&&(!q||x.rel.toLowerCase().includes(q)));
  box.innerHTML=a.length?a.map(x=>`<div class="edr ${ED.cur&&ED.cur.abs===x.abs?'sel':''}" data-abs="${esc(x.abs)}" style="padding-left:10px" title="${esc(x.rel)}"><span class="ext ${extOfRel(x.rel)}">${extOfRel(x.rel)}</span><span class="nm">${esc(x.rel)}</span>${x.missing?'<small style="color:var(--bad)">deleted</small>':''}<small>${x.count}</small></div>`).join(''):`<div class="stats" style="padding:10px">${all.length?'No backups match this search or filter.':'No backups yet. One is saved automatically before a config changes. Use “Back up configs…” above to save one for your files now.'}</div>`;return}
 const q=ED.q.trim().toLowerCase(),fl=ED.files.filter(f=>(ED.filter==='all'||f.ext===ED.filter)&&(!q||f.rel.toLowerCase().includes(q)));
 if(ED.scanning&&!fl.length){box.innerHTML='<div class="stats" style="padding:10px">Scanning…</div>';return}
 if(!fl.length){box.innerHTML='<div class="stats" style="padding:10px">No config files found</div>';return}
 const groups=new Map();fl.forEach(f=>{const i=f.rel.lastIndexOf('/'),d=i<0?'':f.rel.slice(0,i);if(!groups.has(d))groups.set(d,[]);groups.get(d).push(f)});
 const cur=ED.cur&&ED.cur.abs;let h='',shown=0;
 for(const[d,arr]of groups){const open=!!q||ED.open[d]||arr.some(f=>f.abs===cur);
  h+=`<div class="edg ${open?'open':''}" data-d="${esc(d)}">${CV}<span class="nm" title="${esc(d)}">${esc(d||'Game folder')}</span><small>${arr.length}</small></div>`;
  if(open&&shown<700)arr.forEach(f=>{shown++;h+=`<div class="edr ${f.abs===cur?'sel':''}" data-abs="${esc(f.abs)}" title="${esc(f.rel)}"><span class="ext ${f.ext}">${f.ext}</span><span class="nm">${esc(f.rel.split('/').pop())}</span>${BK.has(f.abs)?'<i class="bkd" title="Has backups"></i>':''}<small>${fmtSize(f.size)}</small></div>`})}
 box.innerHTML=h}
async function cfgWalk(base,out,tick){const skip=new Set(['.git','node_modules','$recycle.bin','system volume information']);let n=0;
 const walk=async(dir,depth)=>{let ents;try{ents=await fsN.promises.readdir(dir,{withFileTypes:true})}catch(e){return}
  for(const e of ents){const p=pathN.join(dir,e.name);
   if(e.isDirectory()){if(depth<14&&!skip.has(e.name.toLowerCase()))await walk(p,depth+1)}
   else if(/\.(ini|jsonc?)$/i.test(e.name)){let sz=0;try{sz=(await fsN.promises.stat(p)).size}catch(x){}if(sz<=3e6)out.push({abs:p,rel:pathN.relative(base,p).replace(/\\/g,'/'),size:sz,ext:e.name.split('.').pop().toLowerCase()})}
   if(++n%250===0&&tick)await tick(out.length)}};
 await walk(base,0);out.sort((a,b)=>a.rel.localeCompare(b.rel,undefined,{numeric:true}));return out}
async function edScan(){const base=edAnchor();if(!base)return;ED.files=[];ED.scanning=true;ED.inst=S.curInst;edList();
 await cfgWalk(base,ED.files,async n=>{$('#edinfo').textContent=`Scanning… ${n} files`;await new Promise(r=>setTimeout(r))});
 ED.scanning=false;
 $('#edinfo').textContent=`${ED.files.length} config file${ED.files.length===1?'':'s'}`;edList()}
async function edOpen(abs,force){cpClose();const c=ED.cur;
 if(!force&&c&&c.dirty&&c.abs!==abs&&!await ask({title:'Discard unsaved changes?',text:c.rel,ok:'Discard',danger:true}))return;
 let text='',bom=false;const exists=fsN.existsSync(abs);
 if(exists){try{text=fsN.readFileSync(abs,'utf8')}catch(e){return notice('Couldn’t read the file',e.message)}if(text.charCodeAt(0)===0xFEFF){bom=true;text=text.slice(1)}}
 const rel=pathN.relative(edAnchor(),abs).replace(/\\/g,'/'),kind=/\.jsonc?$/i.test(abs)?'json':'ini';
 const n=ED.cur={abs,rel,kind,exists,bom,orig:text,text,dirty:false,view:'form',err:'',touched:false,hist:[text],hi:0,txt:new Set(),col:new Set(),jo:{}};if(c&&c.abs===abs&&c.txt){n.txt=c.txt;n.col=c.col;n.jo=c.jo||{}}
 if(kind==='ini')n.model=parseIniEd(text);
 else{try{jLoad(n,text);n.indent=detectIndent(text);n.nl=/\n$/.test(text)}catch(e){n.err='This JSON can’t be shown as a tree yet: '+e.message;n.view='raw'}}
 edRight();edList()}
async function edSave(){const c=ED.cur;if(!c)return;edStateNow();if(!c.dirty)return;let text=edText();
 if(c.kind==='json'){try{JC.parse(text)}catch(e){if(!await ask({title:'This JSON is not valid',text:e.message+' Save it anyway?',ok:'Save anyway',danger:true}))return}}
 try{if(fsN.existsSync(c.abs))BK.save(c.abs,fsN.readFileSync(c.abs,'utf8'));fsN.mkdirSync(pathN.dirname(c.abs),{recursive:true});fsN.writeFileSync(c.abs,(c.bom?'\uFEFF':'')+text)}
 catch(e){return notice('Saving failed',e.message)}
 c.orig=text;c.exists=true;c.touched=false;if(c.view==='raw')c.text=text;const r=root&&root._path;if(r&&c.abs.toLowerCase().startsWith(r.toLowerCase()))ED.touchedML=true;
 edState();edList();toast('Saved. The previous version is in Backups')}
async function edRestore(id){const c=ED.cur;if(!c)return;
 if(!await ask({title:id==='original'?'Restore the original file?':'Restore this version?',text:'The current file is backed up first, so you can undo this.',ok:'Restore'}))return;
 try{const text=BK.read(c.abs,id);if(fsN.existsSync(c.abs))BK.save(c.abs,fsN.readFileSync(c.abs,'utf8'));fsN.mkdirSync(pathN.dirname(c.abs),{recursive:true});fsN.writeFileSync(c.abs,text)}
 catch(e){return notice('Restore failed',e.message)}
 const r=root&&root._path;if(r&&c.abs.toLowerCase().startsWith(r.toLowerCase()))ED.touchedML=true;
 await edOpen(c.abs,true);toast('Restored')}
async function edClose(){const c=ED.cur;if(c&&c.dirty&&!await ask({title:'Discard unsaved changes?',text:c.rel,ok:'Discard',danger:true}))return;
 ED.cur=null;$('#edd').close();
 if(ED.touchedML){ED.touchedML=false;const pend=files().filter(([p,t])=>written[p]!==t).length;if(pend)toast('Saved. Rescan to load the changes into the main view.');else{try{await scanRoot()}catch(e){}}}}
function keepOpen(fn){const op=[...$('#edbody').querySelectorAll('details.jn[open]')].map(d=>d.dataset.path);fn();$('#edbody').querySelectorAll('details.jn').forEach(d=>{if(op.includes(d.dataset.path))d.open=true})}
$('#edbtn').onclick=()=>{if(!root&&!game)return toast('Scan a GTA folder first');$('#edd').showModal();ED.tab='files';document.querySelectorAll('#edtabs button').forEach(b=>b.classList.toggle('on',b.dataset.t==='files'));if(ED.inst!==S.curInst||!ED.files.length)edScan();else edList();edRight()};
$('#edclose').onclick=edClose;$('#edrescan').onclick=edScan;
$('#edd').addEventListener('cancel',e=>{e.preventDefault();edClose()});
$('#edd').addEventListener('keydown',e=>{if(!(e.ctrlKey||e.metaKey))return;const k=e.key.toLowerCase();
 if(k==='f'&&!e.shiftKey&&!e.altKey){e.preventDefault();if(ED.cur)edFindOpen();else $('#edq').focus();return}
 else if(k==='s'){e.preventDefault();edSave()}
 else if((k==='z'||k==='y')&&e.target.id!=='edraw'&&e.target.id!=='edfq'){e.preventDefault();if(k==='y'||e.shiftKey)edRedo();else edUndo()}});
$('#edq').oninput=e=>{ED.q=e.target.value;edList()};
$('#edtabs').onclick=e=>{const b=e.target.closest('button');if(!b)return;ED.tab=b.dataset.t;document.querySelectorAll('#edtabs button').forEach(x=>x.classList.toggle('on',x===b));edList()};
$('#edf').onclick=e=>{const b=e.target.closest('button');if(!b)return;ED.filter=b.dataset.f;document.querySelectorAll('#edf button').forEach(x=>x.classList.toggle('on',x===b));edList()};
$('#edlist').onclick=e=>{const g=e.target.closest('.edg');if(g){ED.open[g.dataset.d]=!g.classList.contains('open');edList();return}
 const r=e.target.closest('.edr');if(r)edOpen(r.dataset.abs)};
