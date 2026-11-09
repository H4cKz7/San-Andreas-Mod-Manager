/* SA Mod Manager - 20-installer-pure.js: PURE install logic: classify(), scanLines(), pickLines() (no DOM) */
/* Classic script: loaded in order by index.html, shares globals with the other files. */
/* install: archives (.zip .rar .7z, password aware), folders and loose files, with smart placement */
/*PURE-START*/
const JUNK=/(^|\/)(thumbs\.db|desktop\.ini|\.ds_store|__macosx|\.git)(\/|$)|(^|\/)~\$/i;
const DOC_EXT=/\.(rtf|pdf|html?|docx?|url|nfo|diz|md|website)$/i;
const DOC_NAME=/^(read[ _.-]?me|leia[ _.-]?me|lisez[ _.-]?moi|install(ation)?|instructions?|how[ _-]?to|changelog|change[ _-]?log|credits?|licen[cs]e|manual|notes?|info|help|terms|permissions?|usage|tutorial)/i;
const isDoc=p=>{const n=p.split('/').pop();return DOC_EXT.test(n)||(/\.txt$/i.test(n)&&DOC_NAME.test(n))};
const PROG=/\.(exe|bat|cmd|msi|com|scr|vbs|ps1|lnk)$/i,ARCH_RE=/\.(zip|rar|7z|001|tar|gz|tgz|bz2|xz)$/i;
/* files that only work in the GTA folder itself (ASI loaders, graphics wrappers, CLEO, ENB ...) */
const ROOT_RE=/^(d3d8|d3d9|dxgi|dinput8|ddraw|dsound|opengl32|vorbisfile|vorbishooked|ogg|eax|binkw32|reshade|dxvk)\.(dll|ini)$|^(cleo|modloader)\.asi$|^cleo\.ini$|^\$?fastman92|^enb\w*\.(ini|dll|fx)$/i;
const ROOTDIR=/^(enbseries|reshade-shaders)$/i;
const KEEPDIR=/^(modloader|cleo|cleo_text|cleo_modules|cleo_saves|scripts|plugins|enbseries|reshade-shaders|models|data|anim|audio|text|movies|txd|stream|pics|fonts|shaders|textures)$/i;
const GENERIC=/^(gta[ _-]?(sa|san andreas|3|vc)?|san andreas|game|games|install|installation|files?|mod|mods|content|main|copy.*|drag.*|userfiles|archive|download|root)$/i,GENERIC2=/\.img$|^\d+\s*[-–.)_]\s*|^(import|install|copy|drag|replace|put|extract)\b/i;
const NUMRE=/^-?(\d+\.?\d*|\.\d+)$/,ORIG=/orig|default|stock|\bold\b|before|backup|vanilla/i;
const IDERE=/^(\d{3,4})\s*,\s*[A-Za-z0-9_]{1,23}\s*,\s*[A-Za-z0-9_]{1,23}\s*,\s*(car|mtruck|quad|heli|plane|boat|train|bike|bmx|trailer)\s*,/i;
/* some extractors lose the folder separator: "01 - Import to gta3.img/rhino.txd" comes out as "01 - Import to gta3.imgrhino.txd". Put the real file name back. */
const FLATFIX=/^((?:\d+\s*[-–.)_]\s*|(?:import|install|copy|drag|replace|put|extract)\b)[^\\/]*?\.img)(?=[^\s.\\/])(.+\.[a-z0-9]{2,4})$/i;
/* characters that must never end up in an installed file or folder name:
   control chars, zero-width / direction marks, BOM, private-use chars (7-Zip's stand-ins for illegal characters) and quotes */
const BADCH=/[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2060\ufeff\ue000-\uf8ff"]/g;
function cleanPath(p){return p.replace(/\\/g,'/').split('/')
 .map(s=>s.replace(BADCH,'').replace(/[. ]+$/,'').trim())
 .filter(Boolean).join('/')}
function fixName(p){p=cleanPath(p);const i=p.lastIndexOf('/'),m=p.slice(i+1).match(FLATFIX);return m?p.slice(0,i+1)+m[2]:p}
/* a mod usually sits in one or more wrapper folders ("Mod/Mod v2/...", "GTA San Andreas/..."): peel them off */
function stripWrap(L,names){
 for(let g=0;g<8;g++){
  const real=L.filter(f=>!(isDoc(f.r)&&!f.r.includes('/')));
  if(!real.length||real.some(f=>!f.r.includes('/')))break;
  const tops=new Set(real.map(f=>f.r.split('/')[0]));
  if(tops.size!==1)break;const t=[...tops][0];
  if(KEEPDIR.test(t))break;
  names.push(t);L.forEach(f=>{if(f.r.startsWith(t+'/'))f.r=f.r.slice(t.length+1)})}
 return L}
/* decide, for every file, where it belongs: c = ml | cleo | scripts | root | doc ; r = path inside the package ; d = path inside the target folder */
function classify(items,fb){
 const names=[];
 let L=items.map(i=>({...i,r:fixName(i.rel.replace(/\\/g,'/').replace(/^\/+/,''))})).filter(f=>f.r&&!JUNK.test(f.r));
 stripWrap(L,names);
 const inner=L.filter(f=>/^modloader\/./i.test(f.r));
 if(inner.length){L=L.filter(f=>!/^modloader\/./i.test(f.r));inner.forEach(f=>{f.r0=f.r;f.r=f.r.slice(10)});stripWrap(inner,names);inner.forEach(f=>{f.c='ml';f.d=f.r})}
 const out=[],skip=[];
 L.forEach(f=>{const s=f.r.split('/'),b=s[s.length-1],top=s[0],deep=s.length>1;let c='ml',d=f.r;
  if(/^gta[_-]?sa\.exe$/i.test(b)){f.c='root';f.d=b;f.exe=true;out.push(f);return}
  if(PROG.test(b)){skip.push({...f,c:'skip',why:'program'});return}
  if(ARCH_RE.test(b)){skip.push({...f,c:'skip',why:'archive'});return}
  if(deep&&ROOTDIR.test(top)){c='root'}
  else if(isDoc(f.r))c='doc';
  else if(ROOT_RE.test(b)){c='root';d=b}
  f.c=c;f.d=d;out.push(f)});
 /* a CLEO install itself (cleo.asi + its folders) belongs in the game folder */
 if(out.some(f=>f.c==='root'&&/^cleo\.asi$/i.test(f.r.split('/').pop())))out.forEach(f=>{if(f.c==='ml'&&/^(cleo|cleo_text|cleo_modules|cleo_saves)\//i.test(f.r)){f.c='root';f.d=f.r}});
 const files=[...out,...inner];
 const name=[...names].reverse().find(n=>!GENERIC.test(n.trim())&&!GENERIC2.test(n.trim()))||(fb&&fb.trim())||'New mod';
 /*SAMM-ESS*/
 const ESS_MARK=/^(cleo\.asi|modloader\.asi|_nodep\.asi|crashinfo\.sa\.asi|crashinfo\.ini|vorbishooked\.dll)$/i;
 const isEssDoc=r=>/^\(?essentials[ _-]?readme\)?\//i.test(r)||(!r.includes('/')&&(/\.url$/i.test(r)||(/(read[ _.-]?me|leiame)/i.test(r)&&/\.(txt|rtf|pdf|html?|md)$/i.test(r))||isDoc(r)));
 const ess=files.some(f=>f.exe&&!f.r.includes('/'))&&files.filter(f=>!f.r.includes('/')&&ESS_MARK.test(f.r)).length>=2;
 if(ess)files.forEach(f=>{f.c=(f.r0&&/^modloader\//i.test(f.r0))?'ml_ess':'root';f.d=f.r0||f.r;if(isEssDoc(f.r0||f.r))f.eDoc=true});
 const auto={root:files.some(f=>f.c==='root'||f.c==='ml_ess'),scripts:false,cleo:false};
 return{files,skip,names,name:ess?'Essentials Pack':name,auto,ess}}
/* find vehicle lines in readme text: handling.cfg lines (36 fields) and vehicles.ide lines */
function scanLines(text){const hand=[],ide=[],ls=text.split(/\r?\n/);
 ls.forEach((raw,i)=>{const l=raw.replace(/[\u00a0\t]+/g,' ').trim();if(l.length<20||l.length>700)return;
  const tk=l.split(/\s+/),ctx=(()=>{for(let j=i-1;j>=0&&j>=i-3;j--)if(ls[j].trim()&&!/^\S+(\s+\S+){30,}$/.test(ls[j].trim()))return ls[j];return''})();
  if(tk.length>=34&&tk.length<=42&&/^[A-Za-z][A-Za-z0-9_]{1,15}$/.test(tk[0])&&tk.slice(1,15).every(x=>NUMRE.test(x))&&/^[FR4]$/i.test(tk[15])&&/^[PDEI]$/i.test(tk[16]))
   hand.push({name:tk[0].toUpperCase(),line:[tk[0].toUpperCase(),...tk.slice(1)].join(' '),orig:ORIG.test(ctx),i});
  else{const m=l.match(IDERE);if(m&&l.split(',').length>=11)ide.push({id:+m[1],line:l.replace(/\s*,\s*/g,', '),orig:ORIG.test(ctx),i})}});
 return{hand,ide}}
/* one line per vehicle: skip lines introduced as "original/default/stock", keep the last remaining one */
function pickLines(all){
 const by=(a,key)=>{const m=new Map();a.forEach(x=>{const k=x[key];(m.get(k)||m.set(k,[]).get(k)).push(x)});
  return[...m.values()].map(g=>{const ok=g.filter(x=>!x.orig);return ok.length?ok[ok.length-1]:null}).filter(Boolean)};
 return{hand:by(all.hand,'name'),ide:by(all.ide,'id').filter(x=>x.id>=400)}}
/*PURE-END*/
