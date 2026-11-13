/* SA Mod Manager - 50-multi-stage.js: keep adding archives and folders to the Install dialog, then install them together */
/* Classic script: loaded in order by index.html, shares globals with the other files. */
/* SAMM-MULTI-STACK. The first package opens as usual. Picking or dropping another one while a package is open (or a batch list is
   showing) turns the dialog into a batch list; everything added later goes on the list. "Install all" / "Review each" hand it to the queue
   in 49-multi-install.js. Remove entries down to one and that one opens normally again. */
QS.stage=[];QS.cur=null;QS.pending=null; /* cur = where the package open in the dialog came from; pending = what qGo is opening right now */
function qLoaded(){if(!QS.on){QS.cur=QS.pending;QS.pending=null}} /* called by loadPackage when a package opened */
function qStageClear(){QS.stage=[];QS.cur=null;QS.pending=null;qStageDraw()}
function qStageDraw(){const s=QS.stage,box=$('#qstage');if(!box)return;box.hidden=!s.length;if(!s.length)return;
 $('#qstt').textContent=s.length+' mods in the batch. Drop or choose more to add them';
 $('#qstl').innerHTML=s.map((x,i)=>'<div class="qsr"><span class="nm" title="'+esc(x.p)+'">'+esc(pathN.basename(x.p))+'</span><span class="pkn">'+(x.kind==='dir'?'folder':'archive')+'</span><button type="button" class="btn sm" data-qr="'+i+'" title="Remove from the batch" aria-label="Remove">×</button></div>').join('');
 $('#qstall').disabled=$('#qstrev').disabled=s.length<2}
const qMerge=(a,b)=>{const seen=new Set(),out=[];a.concat(b).forEach(x=>{const k=x.p.toLowerCase();if(!seen.has(k)){seen.add(k);out.push(x)}});return out};
function qStageSet(all,added){
 if(!QS.stage.length){PLAN=null;pend=null;QS.cur=null;clearTmps();rdReset(); /* the package that was open is on the list now */
  ['#asum','#destbox','#hrow','#erow','#ibusy','#pickbox'].forEach(x=>$(x).hidden=true);$('#plist').textContent='';$('#ok').disabled=true}
 QS.stage=all;qStageDraw();toast(added?'Added '+added+' to the batch ('+all.length+' in total)':'Already in the batch')}
/* called by qGo before anything is opened. true = the items went on the batch list */
function qStaging(list){
 if(QS.on||baseInstall)return false;
 const open=QS.cur&&PLAN?[QS.cur]:[],base=QS.stage.length?QS.stage:open,all=qMerge(base,list);
 if(!QS.stage.length&&all.length<2)return false; /* nothing else to batch with: open it as usual */
 qStageSet(all,all.length-base.length);return true}
/* "Choose folder" gives the files of the folder, not the folder: work the folder path out from the first file */
function qFolderOf(f){const p=f.length?pathOf(f[0]):'',rel=f.length&&f[0].webkitRelativePath||'';
 if(!p||!rel.includes('/'))return null;const top=rel.split('/')[0];return p.slice(0,p.length-(rel.length-top.length))}
function qStageGo(mode){if(QS.stage.length<2||QS.on)return;
 if(!root)return toast('Mod Loader isn’t installed yet. Use “Set up Mod Loader…” in the Version & Essentials card');
 queueStart(QS.stage.slice(),mode)}
$('#qstl').addEventListener('click',e=>{const b=e.target.closest('[data-qr]');if(!b)return;QS.stage.splice(+b.dataset.qr,1);
 if(QS.stage.length===1){const it=QS.stage.splice(0)[0];qStageDraw();qGo([it]);return} /* one left: open it the normal way */
 qStageDraw()});
$('#qstclr').onclick=qStageClear;
$('#qstall').onclick=()=>qStageGo('auto');$('#qstrev').onclick=()=>qStageGo('review');
dlg.addEventListener('close',qStageClear);
