/* SA Mod Manager - 32-editor-memory.js: the config editor reopens the last file, view and scroll position (per installation) */
/* Classic script: loaded in order by index.html, shares globals with the other files. */
const EM={get:()=>(S.edMem&&S.edMem[S.curInst])||null,
 set(v){S.edMem=S.edMem||{};if(v)S.edMem[S.curInst]=v;else delete S.edMem[S.curInst];save()}};
/* remember what is open right now: file, Form/Raw view, scroll, collapsed sections / open tree nodes */
function emCapture(){const c=ED.cur;if(!c)return;
 const b=$('#edbody'),l=$('#edlist'),ta=c.view==='raw'?$('#edraw'):null;
 const m={abs:c.abs,view:c.view,sc:b?Math.round(b.scrollTop):0,ls:l?Math.round(l.scrollTop):0,f:ED.filter,go:Object.assign({},ED.open)};
 if(ta){m.rs=Math.round(ta.scrollTop);m.cs=ta.selectionStart||0}
 if(c.kind==='ini')m.col=[...c.col];
 else if(c.view!=='raw'&&b){const jo={};b.querySelectorAll('details.jn').forEach(d=>{const p=d.dataset.path;if(d.open!==(p==='[]'))jo[p]=d.open});m.jo=jo}
 else m.jo=c.jo||{};
 EM.set(m)}
/* open the remembered file again; returns the memory entry that was used, or null */
async function emRestore(){const m=EM.get();
 if(!m||ED.cur||!m.abs)return null;
 const a=edAnchor();
 if(!a||m.abs.toLowerCase().indexOf(a.toLowerCase())!==0||!fsN.existsSync(m.abs))return null;
 if(m.f){ED.filter=m.f;document.querySelectorAll('#edf button').forEach(x=>x.classList.toggle('on',x.dataset.f===ED.filter))}
 if(m.go)Object.assign(ED.open,m.go);
 await edOpen(m.abs,true);
 const c=ED.cur;if(!c||c.abs!==m.abs)return null;
 if(c.kind==='ini'&&m.col)c.col=new Set(m.col);
 if(c.kind==='json'&&m.jo)c.jo=m.jo;
 if(m.view==='raw'&&c.view!=='raw'){c.text=c.orig;c.view='raw'}
 edRight();
 const ta=$('#edraw'),b=$('#edbody');
 if(c.view==='raw'&&ta){ta.scrollTop=m.rs||0;try{ta.setSelectionRange(m.cs||0,m.cs||0)}catch(e){}}
 else if(b)b.scrollTop=m.sc||0;
 return m}
/* called by the Config editor button (replaces the old "scan, then show the empty state") */
async function edLaunch(){
 try{
  let scan=null;
  if(ED.inst!==S.curInst||!ED.files.length)scan=edScan();else edList();
  edRight();
  const m=await emRestore();
  if(scan)await scan;
  if(m){const l=$('#edlist');if(l)l.scrollTop=m.ls||0}
 }catch(e){}}
/* closing the window with the editor open keeps its place too */
addEventListener('beforeunload',()=>{try{if(ED.cur&&$('#edd').open){emCapture();saveNow()}}catch(e){}});
