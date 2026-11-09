/* SA Mod Manager - 14-editor-backups.js: config editor backup / delete-backups dialogs, first-scan auto backup */
/* Classic script: loaded in order by index.html, shares globals with the other files. */
/* ===== back up every config / delete backups (a searchable list with select-all) ===== */
const extOfRel=r=>/\.jsonc$/i.test(r)?'jsonc':/\.json$/i.test(r)?'json':'ini';
const BKD={mode:'make',items:[],sel:new Set(),has:new Set(),q:'',f:'all',busy:false};
async function cfgList(){
 if(ED.scanning)await new Promise(r=>{const t=setInterval(()=>{if(!ED.scanning){clearInterval(t);r()}},120)});
 else if(ED.inst!==S.curInst||!ED.files.length)await edScan();
 return ED.files}
async function bkdOpen(mode){if(BKD.busy||$('#bkd').open)return;
 Object.assign(BKD,{mode,items:[],sel:new Set(),q:'',f:'all'});$('#bkq').value='';document.querySelectorAll('#bkf button').forEach(b=>b.classList.toggle('on',b.dataset.f==='all'));
 const mk=mode==='make';
 $('#bkdt').textContent=mk?'Back up configs':'Delete backups';
 $('#bkdp').textContent=mk?'Choose the .ini, .json and .jsonc files to save a backup of right now. A file whose newest backup is already identical is skipped.':'Choose the files whose backups should be deleted. Every saved version of a chosen file is removed. The files in your game folder are not touched.';
 $('#bkgo').classList.toggle('del',!mk);
 $('#bklist').innerHTML='<div class="stats" style="padding:12px">Looking for config files…</div>';bkdStat();$('#bkd').showModal();
 if(mk){const fl=await cfgList();BKD.has=new Set(BK.all().map(x=>x.abs.toLowerCase()));BKD.items=fl.map(f=>({abs:f.abs,rel:f.rel,ext:f.ext,size:f.size}));BKD.sel=new Set(BKD.items.map(x=>x.abs))}
 else BKD.items=BK.all().map(x=>({abs:x.abs,dir:x.dir,rel:x.rel,ext:extOfRel(x.rel),count:x.count,missing:x.missing}));
 bkdList()}
const bkdView=()=>{const q=BKD.q.trim().toLowerCase();return BKD.items.filter(x=>(BKD.f==='all'||x.ext===BKD.f)&&(!q||x.rel.toLowerCase().includes(q)))};
function bkdList(){const v=bkdView(),cap=1500,mk=BKD.mode==='make';
 const info=x=>mk?(BKD.has.has(x.abs.toLowerCase())?'<small class="bkh">has backups</small>':'')+`<small>${fmtSize(x.size)}</small>`:(x.missing?'<small style="color:var(--bad)">file deleted</small>':'')+`<small>${x.count} version${x.count===1?'':'s'}</small>`;
 $('#bklist').innerHTML=v.length?v.slice(0,cap).map(x=>`<label class="bkr"><input type="checkbox" data-abs="${esc(x.abs)}" ${BKD.sel.has(x.abs)?'checked':''}><span class="ext ${x.ext}">${x.ext}</span><span class="nm" title="${esc(x.rel)}">${esc(x.rel)}</span>${info(x)}</label>`).join('')+(v.length>cap?`<div class="stats" style="padding:8px 12px">…and ${v.length-cap} more. Narrow the search to see them. “Select all” includes them.</div>`:''):`<div class="stats" style="padding:12px">${BKD.items.length?'Nothing matches this search or filter.':mk?'No config files found.':'There are no backups to delete.'}</div>`;
 bkdStat()}
function bkdStat(){const v=bkdView(),n=v.filter(x=>BKD.sel.has(x.abs)).length,a=$('#bkall'),mk=BKD.mode==='make',t=BKD.sel.size;
 a.checked=v.length>0&&n===v.length;a.indeterminate=n>0&&n<v.length;a.disabled=!v.length;
 $('#bkcnt').textContent=`${t} of ${BKD.items.length} selected`+(v.length!==BKD.items.length?` · ${v.length} shown`:'');
 const g=$('#bkgo');g.disabled=BKD.busy||!t;g.textContent=mk?(t?`Back up ${t} file${t===1?'':'s'}`:'Back up'):(t?`Delete ${t} backup${t===1?'':'s'}`:'Delete backups')}
$('#bkq').oninput=e=>{BKD.q=e.target.value;bkdList()};
$('#bkf').onclick=e=>{const b=e.target.closest('button');if(!b)return;BKD.f=b.dataset.f;document.querySelectorAll('#bkf button').forEach(x=>x.classList.toggle('on',x===b));bkdList()};
$('#bkall').onchange=e=>{const on=e.target.checked;bkdView().forEach(x=>on?BKD.sel.add(x.abs):BKD.sel.delete(x.abs));$('#bklist').querySelectorAll('input[data-abs]').forEach(i=>i.checked=BKD.sel.has(i.dataset.abs));bkdStat()};
$('#bklist').onchange=e=>{const i=e.target.closest('input[data-abs]');if(!i)return;i.checked?BKD.sel.add(i.dataset.abs):BKD.sel.delete(i.dataset.abs);bkdStat()};
$('#bkx').onclick=()=>{if(!BKD.busy)$('#bkd').close()};
$('#bkd').addEventListener('cancel',e=>{if(BKD.busy)e.preventDefault()});
$('#bkgo').onclick=async()=>{if(BKD.busy||!BKD.sel.size)return;const items=BKD.items.filter(x=>BKD.sel.has(x.abs));
 if(BKD.mode==='del'){
  if(!await ask({title:`Delete the backups of ${items.length} file${items.length===1?'':'s'}?`,text:'Every saved version of the chosen files is removed for good. The files in your game folder are not touched.',ok:'Delete',danger:true}))return;
  let n=0;for(const x of items){try{fsN.rmSync(x.dir,{recursive:true,force:true});n++}catch(e){}}
  $('#bkd').close();edList();toast(`Deleted the backups of ${n} file${n===1?'':'s'}`);return}
 BKD.busy=true;bkdStat();const b=$('#bkgo');let added=0,same=0,fail=0,i=0;
 for(const x of items){try{BK.save(x.abs,fsN.readFileSync(x.abs,'utf8'))==='same'?same++:added++}catch(e){fail++}
  if(++i%40===0){b.textContent=`Backing up… ${i}/${items.length}`;await new Promise(r=>setTimeout(r))}}
 BKD.busy=false;$('#bkd').close();edList();
 toast(`Backed up ${added} file${added===1?'':'s'}`+(same?`, ${same} already up to date`:'')+(fail?`, ${fail} failed`:''))};
$('#bkmake').onclick=()=>bkdOpen('make');$('#bkdel').onclick=()=>bkdOpen('del');
/* first scan of a game: save one backup of every config. It runs a few seconds after the scan, off the UI thread:
   async file copies (no reading into JS), 4 at a time, yielding between batches, so the window never stutters. */
let bkAutoRun=false;
const scheduleAutoBackup=()=>setTimeout(autoBackup,2500);
async function autoBackup(){const id=S.curInst,base=edAnchor();if(bkAutoRun||!root||!id||!base||S.autoBk[id])return;bkAutoRun=true;
 try{const list=await cfgWalk(base,[],()=>new Promise(r=>setTimeout(r,2)));if(S.curInst!==id)return;
  let n=0,i=0;const work=async()=>{while(i<list.length){if(S.curInst!==id)return;const f=list[i++];
   try{if(await BK.firstAsync(f.abs))n++}catch(e){}
   if(i%16===0)await new Promise(r=>setTimeout(r,6))}};
  await Promise.all([work(),work(),work(),work()]);
  if(S.curInst!==id)return;S.autoBk[id]=true;save();if(n)toast(`Saved a first backup of ${n} config file${n===1?'':'s'}`)}
 catch(e){}finally{bkAutoRun=false}}
