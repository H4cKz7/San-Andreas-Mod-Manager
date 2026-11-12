/* SA Mod Manager - 38-install-backups.js: install backups (manifest, Restore install dialog) and auto-delete of old backups */
/* Classic script: loaded in order by index.html, shares globals with the other files. */
/* ===== install backups: every install keeps a manifest.json next to its backed-up files, so it can be restored later ===== */
if(S.ibDays===undefined)S.ibDays=30; /* install backups: delete after N days, 0 = never */
if(S.cbDays===undefined)S.cbDays=0;  /* config backups: delete old versions after N days, 0 = never (default) */
const DAY_MS=864e5,DAY_OPTS=[0,7,14,30,60,90,180];
const IB={q:'',
 base(){return pathN.join(window.__native.userData,'install-backups')},
 dir(){return pathN.join(this.base(),S.curInst||'default')},
 stampMs(s){const n=parseInt(s,36);return isFinite(n)?n:0},
 size(d){let t=0;try{for(const n of fsN.readdirSync(d)){try{t+=fsN.statSync(pathN.join(d,n)).size}catch(e){}}}catch(e){}return t},
 readM(p){try{return JSON.parse(fsN.readFileSync(pathN.join(p,'manifest.json'),'utf8'))}catch(e){return null}},
 list(){const d=this.dir(),out=[];let names=[];try{names=fsN.readdirSync(d)}catch(e){return out}
  for(const s of names){const p=pathN.join(d,s);let st;try{st=fsN.statSync(p);if(!st.isDirectory())continue}catch(e){continue}
   const m=this.readM(p);out.push({stamp:s,dir:p,m,at:(m&&m.at)||this.stampMs(s)||st.mtimeMs,size:this.size(p)})}
  return out.sort((a,b)=>b.at-a.at)}};
async function ibWriteManifest(J,bdir){await fsN.promises.mkdir(bdir,{recursive:true});
 const m={v:1,name:J.name,at:Date.now(),mlTop:J.mlTop||'',created:J.created.map(c=>({abs:c.abs,stop:c.stop})),replaced:J.replaced.map(r=>({abs:r.abs,bk:pathN.basename(r.bk)}))};
 await fsN.promises.writeFile(pathN.join(bdir,'manifest.json'),JSON.stringify(m))}
function ibMarkRestored(bdir){try{const m=IB.readM(bdir);if(!m)return;m.restoredAt=Date.now();fsN.writeFileSync(pathN.join(bdir,'manifest.json'),JSON.stringify(m))}catch(e){}}
function ibShown(){const q=IB.q.trim().toLowerCase(),all=IB.list();return{all,l:q?all.filter(x=>(x.m?x.m.name:'unknown install (no manifest)').toLowerCase().includes(q)):all,q}}
function ibDraw(){const{all,l,q}=ibShown(),box=$('#iblist'),tot=all.reduce((a,x)=>a+x.size,0);
 $('#ibinfo').textContent=all.length?(q?l.length+' of ':'')+all.length+' install'+(all.length===1?'':'s')+' · '+fmtSize(tot):'';$('#ibdelall').disabled=!l.length;$('#ibdelall').textContent=q?'Delete shown':'Delete all';
 box.innerHTML=l.length?l.map(x=>{const m=x.m,nm=m?m.name:'Unknown install (no manifest)',sub=[new Date(x.at).toLocaleString()];
  if(m)sub.push(m.replaced.length+' replaced',m.created.length+' created');sub.push(fmtSize(x.size));if(m&&m.restoredAt)sub.push('restored');
  return '<div class="trr"><div class="trn"><div class="nm" title="'+esc(nm)+'">'+esc(nm)+'</div><small>'+esc(sub.join(' · '))+'</small></div><button class="btn sm" data-r="'+esc(x.stamp)+'"'+(m&&!m.restoredAt?'':' disabled')+'>Restore</button><button class="btn sm del" data-d="'+esc(x.stamp)+'">Delete</button></div>'}).join(''):'<span class="stats">'+(all.length?'No installs match this search.':'No install backups for this installation.')+'</span>'}
async function ibRestore(stamp){const it=IB.list().find(x=>x.stamp===stamp);if(!it||!it.m)return;const m=it.m;
 if(m.mlTop&&!root)return toast('Scan your modloader folder first');
 const lost=m.replaced.filter(r=>!fsN.existsSync(pathN.join(it.dir,r.bk))).length;
 if(!await ask({title:'Restore the install of “'+m.name+'”?',text:'The '+m.created.length+' file'+(m.created.length===1?'':'s')+' this install added '+(m.created.length===1?'is':'are')+' removed and the '+m.replaced.length+' file'+(m.replaced.length===1?'':'s')+' it replaced '+(m.replaced.length===1?'is':'are')+' put back from the backup. Changes you made to those files since then are lost.'+(lost?'\n'+lost+' backed-up file'+(lost===1?' is':'s are')+' missing and cannot be put back.':''),ok:'Restore',danger:true}))return;
 const J={name:m.name,mlTop:m.mlTop||'',created:m.created,replaced:m.replaced.map(r=>({abs:r.abs,bk:pathN.join(it.dir,r.bk)}))};
 try{await undoInstall(J);ibMarkRestored(it.dir)}catch(e){return notice('Couldn’t restore it',e.message)}
 ibDraw()}
const ibRm=p=>fsN.promises.rm(p,{recursive:true,force:true});
const dayOpts=()=>DAY_OPTS.map(n=>({v:String(n),t:n?n+' days':'Never'}));
/* auto-delete: install backups older than S.ibDays (whole folders), config backup versions older than S.cbDays
   (original.bak and the newest version of every file are always kept) */
async function ibCleanup(){const yld=()=>new Promise(r=>setTimeout(r,4)),ib=+S.ibDays||0,cb=+S.cbDays||0,now=Date.now();let n=0,c=0;
 if(ib>0){const cut=now-ib*DAY_MS,b=IB.base();let insts=[];try{insts=fsN.readdirSync(b)}catch(e){}
  for(const i of insts){let st=[];try{st=fsN.readdirSync(pathN.join(b,i))}catch(e){continue}
   for(const s of st){const p=pathN.join(b,i,s),m=IB.readM(p);let at=(m&&m.at)||IB.stampMs(s);if(!at){try{at=fsN.statSync(p).mtimeMs}catch(e){continue}}
    if(at<cut){try{await ibRm(p);n++}catch(e){}}await yld()}}}
 if(cb>0){const cut=now-cb*DAY_MS,b=BK.base();let insts=[];try{insts=fsN.readdirSync(b)}catch(e){}
  for(const i of insts){let hs=[];try{hs=fsN.readdirSync(pathN.join(b,i))}catch(e){continue}
   for(const h of hs){const d=pathN.join(b,i,h);let fl=[];try{fl=fsN.readdirSync(d)}catch(e){continue}
    const vs=fl.filter(f=>/^\d+\.bak$/.test(f)).sort((x,y)=>parseInt(y)-parseInt(x)).slice(1);
    for(const f of vs){if(parseInt(f)>=cut)continue;try{fsN.unlinkSync(pathN.join(d,f));c++}catch(e){}}await yld()}}}
 return{n,c}}
$('#ibb').onclick=()=>{IB.q='';$('#ibq').value='';ibDraw();$('#ibd').showModal()};
$('#ibq').oninput=e=>{IB.q=e.target.value;ibDraw()};
$('#ibx').onclick=()=>$('#ibd').close();
$('#iblist').onclick=async e=>{const r=e.target.closest('[data-r]'),d=e.target.closest('[data-d]');
 if(r)return ibRestore(r.dataset.r);
 if(d){const it=IB.list().find(x=>x.stamp===d.dataset.d);if(!it)return;
  if(await ask({title:'Delete this install backup?',text:'The backed-up files of “'+(it.m?it.m.name:'this install')+'” are deleted for good. It can no longer be restored.',ok:'Delete',danger:true}))try{await ibRm(it.dir);ibDraw();toast('Backup deleted')}catch(err){notice('Couldn’t delete it',err.message)}}};
$('#ibdelall').onclick=async()=>{const{l,q}=ibShown();if(!l.length)return;
 if(await ask({title:'Delete '+(q?'the '+l.length+' shown':'all '+l.length)+' install backup'+(l.length===1?'':'s')+'?',text:'The backed-up files of '+(q?'these installs are':'every install of this installation is')+' deleted for good. None of them can be restored afterwards.',ok:'Delete all',danger:true}))try{for(const x of l)await ibRm(x.dir);ibDraw();toast('Install backups deleted')}catch(err){notice('Couldn’t delete them',err.message)}};
$('#ibdays').addEventListener('change',async e=>{S.ibDays=+e.currentTarget._v;save();const r=await ibCleanup();ibDraw();toast(S.ibDays?'Install backups are deleted after '+S.ibDays+' days'+(r.n?' ('+r.n+' removed now)':''):'Install backups are kept until you delete them')});
cddOptions($('#ibdays'),dayOpts(),String(S.ibDays));cddOptions($('#cbdays'),dayOpts(),String(S.cbDays));
$('#cbdays').addEventListener('change',async e=>{S.cbDays=+e.currentTarget._v;save();const r=await ibCleanup();if(typeof edList==='function')edList();toast(S.cbDays?'Old config backups are deleted after '+S.cbDays+' days'+(r.c?' ('+r.c+' removed now)':''):'Config backups are kept')});
setTimeout(()=>{ibCleanup().catch(()=>{})},5000); /* startup cleanup, a few seconds after launch */
