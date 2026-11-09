/* SA Mod Manager - 05-shortcut.js: save-as helper and the game shortcut (.lnk / .bat) dialog */
/* Classic script: loaded in order by index.html, shares globals with the other files. */
/* saving files */
async function saveAs(name,data){return await window.__native.saveFile(name,data)}
$('#dl').onclick=async()=>{const f=curFile();try{const p=await saveAs(f[0].split('/').pop(),f[1],'INI file');if(p)toast('Saved '+p)}catch(e){toast('Saving failed: '+e.message)}};
/* game shortcut: -modprof name, -mod name[=priority], -nomods */
const CUT={mode:'prof',fmt:'lnk'};
const cutTarget=()=>{const gp=($('#cutpath').value.trim()||gpath()).replace(/[\\/]+$/,''),exe=$('#cutexe').value||'gta_sa.exe';return{gp,exe,full:gp?gp+'\\'+exe:exe}};
function cutArgs(){const a=[],q=v=>/[\s"]/.test(v)?`"${v.replace(/"/g,'\\"')}"`:v;
 if(CUT.mode==='prof')a.push('-modprof',q($('#cutpsel').value));
 else if(CUT.mode==='none')a.push('-nomods');
 else if(CUT.mode==='mods')document.querySelectorAll('#cutlist [data-cm]:checked').forEach(c=>{const pr=c.closest('.cutrow').querySelector('input[type=number]').value.trim();a.push('-mod',q(c.dataset.cm+(pr!==''?'='+pr:'')))});
 const x=$('#cutextra').value.trim();if(x)a.push(x);return a.join(' ')}
function cutUi(){
 document.querySelectorAll('#cutmode button').forEach(b=>b.classList.toggle('on',b.dataset.m===CUT.mode));
 document.querySelectorAll('#cutfmt button').forEach(b=>b.classList.toggle('on',b.dataset.f===CUT.fmt));
 $('#cutprof').hidden=CUT.mode!=='prof';$('#cutmods').hidden=CUT.mode!=='mods';
 const t=cutTarget(),a=cutArgs(),nat=true;$('#cutprev').textContent=`"${t.full}"${a?' '+a:''}`;
 $('#cutsave').hidden=!game||(CUT.fmt==='lnk'&&nat);
 $('#cutnote').textContent=CUT.fmt==='lnk'?(nat?'Creates a real Windows shortcut with the target, arguments and icon filled in.':'Browsers can’t write a .lnk directly. Run this file once and it creates the shortcut on your Desktop.'):'Double-click it to start the game with these options.';
 {const v=$('#cutpath').value.trim();$('#cuthint').textContent=!v?(S.gpathAuto?'Empty: the detected path will be used.':'Not detected: type the folder that contains gta_sa.exe.'):v===S.gpathAuto?'Detected automatically.':'Custom path. Clear the box to use the detected one.'}
 $('#cutwarn').textContent=(CUT.fmt==='lnk'&&nat&&!t.gp)?'The shortcut needs the full GTA folder path above.':(!t.gp&&!nat)?'No GTA path set: save the file inside your GTA folder before running it.':CUT.mode==='mods'&&!document.querySelector('#cutlist [data-cm]:checked')?'Tick at least one mod.':''}
function cutBuild(){const t=cutTarget(),a=cutArgs(),nm=($('#cutname').value.replace(/[\\/:*?"<>|]/g,'').trim()||'GTA SA'),nat=true;
 if(CUT.fmt==='lnk'&&nat){if(!t.gp){toast('Enter the GTA folder path first');return null}return{native:true,name:nm+'.lnk',opts:{target:t.full,args:a,cwd:t.gp,description:nm,icon:t.full,iconIndex:0}}}
 return{name:nm+'.bat',data:`@echo off\r\ncd /d "${t.gp||'%~dp0'}"\r\nstart "" "${t.exe}"${a?' '+a:''}\r\n`}}
$('#mkcut').onclick=()=>{
 cddOptions($('#cutexe'),S.exes.map(x=>({v:x,t:x})),S.exe);
 cddOptions($('#cutpsel'),Object.keys(S.profiles).map(n=>({v:n,t:n})),S.cur);
 $('#cutlist').innerHTML=S.mods.map(m=>`<label class="cutrow"><input type="checkbox" data-cm="${esc(m.name)}"><span class="nm">${esc(m.name)}</span><input type="number" min="0" placeholder="prio"></label>`).join('')||'<div class="stats" style="padding:8px 10px">No mods</div>';
 
 $('#cutpath').value=gpath();$('#cutextra').value='';CUT.mode='prof';$('#cutname').value=`GTA SA - ${S.cur}`;cutUi();$('#cutd').showModal()};
$('#cutd').addEventListener('input',cutUi);$('#cutd').addEventListener('change',cutUi);
$('#cutpath').onchange=()=>{const v=$('#cutpath').value.trim();S.gpathUser=v&&v!==S.gpathAuto?v:'';const ci=curInst();if(ci)ci.gpathUser=S.gpathUser;save();cutUi()};
$('#cutexe').addEventListener('change',()=>{S.exe=$('#cutexe').value});
$('#cutmode').onclick=e=>{const b=e.target.closest('button');if(b){CUT.mode=b.dataset.m;cutUi()}};
$('#cutfmt').onclick=e=>{const b=e.target.closest('button');if(b){CUT.fmt=b.dataset.f;cutUi()}};
$('#cutx').onclick=()=>$('#cutd').close();
$('#cutdl').onclick=async()=>{const f=cutBuild();if(!f)return;
 try{if(f.native){const p=await window.__native.saveShortcut(f.name,f.opts);if(p)toast('Saved '+p);else if(p===false)toast('Couldn’t create the shortcut')}
  else{const p=await saveAs(f.name,f.data,'Batch file');if(p)toast('Saved '+p)}}catch(e){toast('Saving failed: '+e.message)}};
$('#cutsave').onclick=async()=>{const f=cutBuild();if(!f||f.native)return;try{await writeFile(f.name,f.data,game);toast(`Saved ${f.name} in the GTA folder`)}catch(e){toast('Saving failed: '+e.message)}};
