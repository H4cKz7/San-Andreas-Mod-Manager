/* SA Mod Manager - 15-editor-events.js: config editor input, keyboard and click handlers */
/* Classic script: loaded in order by index.html, shares globals with the other files. */
$('#edright').addEventListener('input',e=>{const t=e.target,c=ED.cur;if(!c)return;
 if(t.id==='edfq'){ED.fq=t.value;ED._fi=-1;edFindApply('new');return}
 if(t.id==='edraw'){c.text=t.value;edStateSoon();if(ED.fopen&&ED.fq.trim()){clearTimeout(ED._rt);ED._rt=setTimeout(()=>edRawFind(edRq(),0),120)}return}
 const row=t.closest('[data-li]');
 if(row&&t.hasAttribute('data-val')){c.model.lines[+row.dataset.li].val=t.value;edStateSoon()}
 else if(row&&t.hasAttribute('data-raw')){c.model.lines[+row.dataset.li].raw=t.value;edStateSoon()}
 else if(t.classList.contains('jv')){const p=JSON.parse(t.closest('[data-path]').dataset.path);
  if(t.dataset.jt==='n'){const s=t.value.trim(),bad=!JNUM.test(s);t.classList.toggle('bad',bad);if(bad)return;if(jEdit(c,'set',p,{raw:s})){edStateSoon();swUpdate(t)}}
  else if(t.dataset.jt==='b'){const s=t.value.trim(),raw=/^(true|false|null)$/.test(s)||JNUM.test(s)?s:JSON.stringify(t.value);if(jEdit(c,'set',p,{raw}))edStateSoon()}
  else if(jEdit(c,'set',p,{raw:JSON.stringify(t.value)}))edStateSoon()}});
$('#edright').addEventListener('keydown',e=>{if(e.target.id==='edfq'){if(e.key==='Enter'){e.preventDefault();edFindStep(e.shiftKey?-1:1)}else if(e.key==='Escape'){e.preventDefault();e.stopPropagation();edFindClose(true)}return}
 if(e.target.classList&&e.target.classList.contains('sh')&&(e.key==='Enter'||e.key===' ')){e.preventDefault();e.target.click();return}
 if(e.target.classList&&e.target.classList.contains('jchip-in')&&(e.key==='Enter'||e.key===',')){e.preventDefault();const c=ED.cur,row=e.target.closest('[data-path]');if(!c||!row)return;
  const ps=row.dataset.path,p=JSON.parse(ps),add=e.target.value.split(/[\s,]+/).filter(Boolean);
  if(!add.length)return;if(add.some(x=>!JNUM.test(x)))return toast('Only numbers can be added here');
  for(const x of add)if(!jEdit(c,'add',p,{key:null,raw:x}))break;
  keepOpen(edBody);edState();const nr=[...$('#edbody').querySelectorAll('.jids')].find(x=>x.dataset.path===ps);if(nr)nr.querySelector('.jchip-in').focus();return}
 if(e.target.classList&&e.target.classList.contains('chip-in')&&(e.key==='Enter'||e.key===',')){e.preventDefault();const c=ED.cur,row=e.target.closest('[data-li]');if(!c||!row)return;
  const l=c.model.lines[+row.dataset.li],tk=idTokens(l.val),add=e.target.value.split(/[\s,]+/).filter(x=>/^\d+$/.test(x)&&!tk.includes(x));
  if(!add.length){if(e.target.value.trim())toast('Only new numbers can be added');return}
  l.val='"'+[...tk,...add].join(', ')+'"';e.target.value='';chipsRender(row,l);edState();return}if(e.target.id==='edraw'&&e.key==='Tab'){e.preventDefault();const t=e.target,s=t.selectionStart;t.setRangeText('  ',s,t.selectionEnd,'end');t.dispatchEvent(new Event('input',{bubbles:true}))}});
$('#edright').addEventListener('click',async e=>{const t=e.target,c=ED.cur;if(!c)return;
 const bt=t.closest('button');
 const shd=t.closest('.sh');
 if(shd&&shd.parentElement.dataset.sn!=null){const sec=shd.parentElement,n=sec.dataset.sn,eff=sec.classList.contains('collapsed')&&!sec.classList.contains('fexp');
  if(eff){sec.classList.remove('collapsed');c.col.delete(n)}else{sec.classList.add('collapsed');sec.classList.remove('fexp');c.col.add(n)}
  shd.setAttribute('aria-expanded',String(eff));return}
 if(bt&&bt.id==='edfbtn'){ED.fopen?edFindClose():edFindOpen();return}
 if(bt&&bt.id==='edfx'){edFindClose(true);return}
 if(bt&&bt.id==='edfprev'){edFindStep(-1);return}
 if(bt&&bt.id==='edfnext'){edFindStep(1);return}
 if(bt&&(bt.id==='edcolall'||bt.id==='edexpall')){const cl=bt.id==='edcolall';
  if(c.kind==='ini')$('#edbody').querySelectorAll('.edsec[data-sn]').forEach(sc=>{sc.classList.toggle('collapsed',cl);if(cl){c.col.add(sc.dataset.sn);sc.classList.remove('fexp')}else c.col.delete(sc.dataset.sn);const h=sc.querySelector(':scope>.sh');if(h)h.setAttribute('aria-expanded',String(!cl))});
  else $('#edbody').querySelectorAll('details.jn').forEach(d=>{if(d.dataset.path!=='[]')d.open=!cl});
  return}
 if(t.closest('#edview')&&bt){const v=bt.dataset.v;if(v===c.view)return;edStateNow();
  if(v==='raw'){c.text=c.dirty?edText():c.orig;c.view='raw'}
  else{try{if(c.kind==='ini')c.model=parseIniEd(c.text);else{jLoad(c,c.text);c.indent=c.indent||2}c.view='form';c.err=''}catch(x){return toast('Fix the JSON first: '+x.message)}}
  edRight();return}
 if(bt&&bt.id==='edfmt'){try{const cur=edText();if(!jStrict(cur)){JC.parse(cur);return toast('This file has comments, and formatting would remove them')}
  const eol=cur.includes('\r\n')?'\r\n':'\n',out=JSON.stringify(JSON.parse(cur),null,c.indent||2).replace(/\n/g,eol)+(c.nl?eol:'');
  if(c.view==='raw')c.text=out;else jLoad(c,out);edBody();edState();toast('Formatted')}catch(x){toast('Not valid JSON: '+x.message)}return}
 if(bt&&bt.id==='edsave'){edSave();return}
 if(bt&&(bt.id==='edundomore'||bt.id==='edredomore')){const m=$(bt.id==='edundomore'?'#edundom':'#edredom'),o=m.hidden;edSplClose();m.hidden=!o;bt.setAttribute('aria-expanded',String(o));return}
 const eall=t.closest('[data-eall]');if(eall){edSplClose();eall.dataset.eall==='undo'?edUndoAll():edRedoAll();return}
 if(bt&&bt.id==='edundo'){edUndo();return}
 if(bt&&bt.id==='edredo'){edRedo();return}
 if(bt&&bt.id==='edrev'){edOpen(c.abs,true);return}
 if(bt&&bt.id==='edbk'){const m=$('#edbm'),vs=BK.versions(c.abs);
  m.innerHTML=vs.length?vs.map(v=>`<div class="ddi" data-ver="${v.id}"><span class="nmx">${v.id==='original'?'Original (before the first edit)':new Date(v.time).toLocaleString()}</span><small>Restore</small></div>`).join('')+'<div class="ddsep"></div><div class="ddi danger" data-delfile>Delete all backups of this file…</div>':'<div class="ddi" style="color:var(--mut);cursor:default">No backups yet. One is made automatically before the first change.</div>';
  m.hidden=!m.hidden;return}
 if(t.closest('[data-delfile]')){$('#edbm').hidden=true;if(await ask({title:'Delete the backups of this file?',text:c.rel+': every saved version is removed. The file itself is not touched.',ok:'Delete',danger:true})){BK.removeFile(c.abs);edList();toast('Backups deleted')}return}
 const ver=t.closest('[data-ver]');if(ver){$('#edbm').hidden=true;edRestore(ver.dataset.ver);return}
 if(!t.closest('#edbd'))$('#edbm')&&($('#edbm').hidden=true);
 const row=t.closest('[data-li]');
 if(bt&&(bt.hasAttribute('data-totext')||bt.hasAttribute('data-totog'))){const to=bt.hasAttribute('data-totext'),jr=t.closest('[data-path]'),why='That value isn’t true/false or 0/1, so it stays a text field';let id,li=null;
  if(row){const l=c.model.lines[+row.dataset.li],sec=t.closest('.edsec');li=row.dataset.li;id=(sec&&sec.dataset.sn||'')+'|'+l.key.trim();if(!to&&!/^(true|false|[01])$/i.test(l.val.trim()))return toast(why)}
  else if(jr){id=jr.dataset.path;if(!to){const cv=jget(c.obj,JSON.parse(id));if(!(typeof cv==='boolean'||cv===0||cv===1))return toast(why)}}
  else return;
  to?c.txt.add(id):c.txt.delete(id);edReflow();
  if(to){const bd=$('#edbody'),f=li!==null?bd.querySelector(`.kv[data-li="${li}"] input[data-val]`):[...bd.querySelectorAll('.jl')].find(x=>x.dataset.path===id)?.querySelector('input.jv');if(f){f.focus();f.select()}}
  return}
 const chipx=t.closest('[data-chipx]');
 if(chipx&&row){const l=c.model.lines[+row.dataset.li],tk=idTokens(l.val);tk.splice(+chipx.closest('.chip').dataset.i,1);l.val='"'+tk.join(', ')+'"';chipsRender(row,l);edState();return}
 if(bt&&bt.hasAttribute('data-tog')&&row){const l=c.model.lines[+row.dataset.li],v=l.val.trim(),bin=/^[01]$/.test(v),on=bin?v!=='1':!/^true$/i.test(v),cap=/^[A-Z]/.test(v);
  l.val=bin?(on?'1':'0'):(on?(cap?'True':'true'):(cap?'False':'false'));bt.classList.toggle('on',on);bt.nextElementSibling.textContent=l.val;edState();return}
 if(bt&&bt.hasAttribute('data-del')&&row){c.model.lines.splice(+row.dataset.li,1);edBody();edState();return}
 if(bt&&bt.hasAttribute('data-addkv')){const sec=bt.closest('.edsec'),h=+sec.dataset.sec,k=sec.querySelector('.ak').value.trim(),v=sec.querySelector('.av').value;if(!k)return toast('Type a key name first');
  const L=c.model.lines;let end=h+1;for(let i=h+1;i<L.length&&L[i].t!=='s';i++)if(L[i].t!=='b')end=i+1;
  L.splice(end,0,{t:'k',ind:'',key:k,sep:' = ',val:v,cm:''});edBody();edState();return}
 if(bt&&bt.hasAttribute('data-addsec')){const n=$('#edsecname').value.trim();if(!n)return toast('Type a section name first');
  const L=c.model.lines;if(L.length&&L[L.length-1].t!=='b')L.push({t:'b',raw:''});L.push({t:'s',ind:'',name:n,cm:'',raw:''},{t:'b',raw:''});edBody();edState();$('#edbody').scrollTop=1e9;return}
 const jl=t.closest('[data-path]');
 const jcx=t.closest('[data-jchipx]');
 if(jcx&&jl){const p=JSON.parse(jl.dataset.path),i=+jcx.closest('.chip').dataset.i;if(jEdit(c,'del',[...p,i])){keepOpen(edBody);edState()}return}
 if(bt&&bt.hasAttribute('data-jtog')&&jl){const p=JSON.parse(jl.dataset.path),cur=jget(c.obj,p),nv=typeof cur==='number'?(cur?0:1):!cur;
  if(jEdit(c,'set',p,{raw:String(nv)})){bt.classList.toggle('on',!!nv);bt.nextElementSibling.textContent=nv;edState()}return}
 if(bt&&bt.hasAttribute('data-jdel')&&jl){const p=JSON.parse(jl.dataset.path);if(p.length&&jEdit(c,'del',p)){keepOpen(edBody);edState()}return}
 if(bt&&bt.hasAttribute('data-jset')&&jl){const p=JSON.parse(jl.dataset.path);if(jEdit(c,'set',p,{raw:'""'})){keepOpen(edBody);edState()}return}
 if(bt&&bt.hasAttribute('data-jadd')){const d=bt.closest('details.jn'),p=JSON.parse(d.dataset.path),cont=jget(c.obj,p),isA=Array.isArray(cont),ty=d.querySelector(':scope>.jc>.jadd .jat').value,raw=d.querySelector(':scope>.jc>.jadd .jav').value;
  const key=isA?null:d.querySelector(':scope>.jc>.jadd .jak').value.trim();if(!isA){if(!key)return toast('Type a key name first');if(key in cont)return toast('That key already exists')}
  let rv;if(ty==='string')rv=JSON.stringify(raw);else if(ty==='number'){const s=raw.trim();if(!JNUM.test(s))return toast('Type a number');rv=s}else if(ty==='boolean')rv=/^(true|1|yes|on)$/i.test(raw.trim())?'true':'false';else if(ty==='null')rv='null';else if(ty==='object')rv='{}';else rv='[]';
  if(jEdit(c,'add',p,{key,raw:rv})){keepOpen(edBody);edState()}}});
