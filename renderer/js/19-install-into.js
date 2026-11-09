/* SA Mod Manager - 19-install-into.js: install into an existing mod folder option */
/* Classic script: loaded in order by index.html, shares globals with the other files. */
/* install into an existing mod folder */
function fillEx(){const q=($('#exq').value||'').trim().toLowerCase(),o=[];
 S.mods.slice().sort((a,b)=>a.name.localeCompare(b.name)).forEach(m=>{o.push(m.name);dirsOf(m).sort().forEach(d=>o.push(m.name+'/'+d))});
 const f=q?o.filter(v=>v.toLowerCase().includes(q)):o,keep=$('#exsel').value;
 cddOptions($('#exsel'),f.length?f.map(v=>({v,t:v.split('/').join(' / ')})):[{v:'',t:'No folder matches'}],f.includes(keep)?keep:null)}
function exUi(){const on=$('#inex').checked;if(on)fillEx();$('#exsel').hidden=$('#exnote').hidden=$('#exq').hidden=!on;
 $('#exnote').textContent=!$('#exsel').value?'Pick a folder above.':`Will be copied to modloader/${$('#exsel').value}/${$('#mname').value.trim()||'…'}/`}
$('#inex').onchange=()=>{if($('#inex').checked&&!S.mods.length){$('#inex').checked=false;toast('Scan your modloader folder first so there are mods to choose from')}exUi()};
$('#exsel').onchange=exUi;$('#exq').oninput=()=>{fillEx();exUi()};$('#mname').oninput=exUi;
