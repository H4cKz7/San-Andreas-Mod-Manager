/* SA Mod Manager - 08-theme.js: light/dark theme and the Appearance (custom colours) dialog */
/* Classic script: loaded in order by index.html, shares globals with the other files. */
/* light / dark theme */
WI.sun='<circle cx="8" cy="8" r="2.7"/><path d="M8 1.6v1.5M8 12.9v1.5M1.6 8h1.5M12.9 8h1.5M3.5 3.5l1.1 1.1M11.4 11.4l1.1 1.1M12.5 3.5l-1.1 1.1M4.6 11.4l-1.1 1.1"/>';
WI.moon='<path d="M13.3 9.4A5.5 5.5 0 0 1 6.6 2.7a5.6 5.6 0 1 0 6.7 6.7z"/>';
/* ===== custom colours (Appearance dialog) ===== */
const TH_VARS=[
 ['Surfaces',[['bg','Background','Window and page'],['panel','Panels','Header, cards and dialogs'],['panel2','Fields and raised','Inputs, buttons and drop-downs']]],
 ['Content',[['tx','Text','Main text'],['mut','Muted text','Hints and labels'],['line','Borders','Outlines and dividers']]],
 ['Accent',[['acc','Accent','Switches, sliders, primary buttons'],['accbg','Accent tint','Soft accent backgrounds'],['ink','Text on accent','Label on accent buttons']]],
 ['Status',[['warn','Warning','Warnings and the star'],['bad','Danger','Errors and delete actions']]],
 ['Icons',[['folder','Folder icons','Folders in a mod’s file list'],['fileic','File icons','Files in a mod’s file list']]]];
const TH_KEYS=TH_VARS.flatMap(g=>g[1].map(r=>r[0]));
/* SAMM-PATCH-LIGHT-THEME: default light = light twin of the Icon-match dark theme; the old green light theme is the "Classic" light preset */
/* SAMM-PATCH-THEME-CSS: the default dark theme is the Icon-match colours (also set in 01-base.css); the old green default is the "Classic" preset below */
const TH_DEF={dark:{bg:'#0d0e11',panel:'#14161b',panel2:'#1c1f26',line:'#2c303b',tx:'#cfd3dc',mut:'#9ea5b4',acc:'#f5bc42',accbg:'#332711',warn:'#d97736',bad:'#cf4848',ink:'#060708',folder:'#f5bc42',fileic:'#9ea5b4'},
 light:{bg:'#eceef2',panel:'#ffffff',panel2:'#f4f5f8',line:'#d8dce5',tx:'#16181d',mut:'#5c6475',acc:'#dd9a14',accbg:'#fbebc8',warn:'#c9651f',bad:'#c94a3d',ink:'#1a1203',folder:'#dd9a14',fileic:'#5c6475'}};
const TH_PRE=[
 {name:'Default',base:'dark',vars:{}},
 {name:'Default',base:'light',vars:{}},
 {name:'Classic',base:'dark',vars:{bg:'#101311',panel:'#181c19',panel2:'#1e231f',line:'#2a312b',tx:'#e6eae4',mut:'#8b948a',acc:'#4cc468',accbg:'#18301e',warn:'#e8963f',bad:'#e5695c',ink:'#07120a',folder:'#4cc468',fileic:'#8b948a'}},
 {name:'Classic',base:'light',vars:{bg:'#eef0ec',panel:'#ffffff',panel2:'#f5f6f3',line:'#dcdfd8',tx:'#1b1f1a',mut:'#6b7268',acc:'#2f9e44',accbg:'#e1f3e4',warn:'#d9822b',bad:'#c94a3d',ink:'#ffffff',folder:'#2f9e44',fileic:'#6b7268'}},
 {name:'Midnight',base:'dark',vars:{bg:'#0d1117',panel:'#151b23',panel2:'#1c2430',line:'#2b3544',tx:'#e6edf3',mut:'#8b98a9',acc:'#58a6ff',accbg:'#14283f',warn:'#e8a33f',bad:'#f0716a',ink:'#06121f'}},
 {name:'Amethyst',base:'dark',vars:{bg:'#14111a',panel:'#1c1824',panel2:'#241f2e',line:'#342d42',tx:'#ece8f3',mut:'#9a92a8',acc:'#b18cff',accbg:'#2a2040',warn:'#e8a33f',bad:'#ef6b7b',ink:'#140a26'}},
 {name:'Crimson',base:'dark',vars:{bg:'#140f10',panel:'#1d1516',panel2:'#261b1d',line:'#3a2a2c',tx:'#f0e8e8',mut:'#a08f90',acc:'#ff5c64',accbg:'#3a1a1d',warn:'#e8b53f',bad:'#ff8f6b',ink:'#200608'}},
 {name:'Amber',base:'dark',vars:{bg:'#15110c',panel:'#1e1812',panel2:'#271f17',line:'#3a2f22',tx:'#f1e9dd',mut:'#a39580',acc:'#f0a030',accbg:'#3a2a10',warn:'#e3d04a',bad:'#e5695c',ink:'#1c1000'}},
 {name:'Ocean',base:'dark',vars:{bg:'#0c1415',panel:'#121d1f',panel2:'#182527',line:'#25383a',tx:'#e2eeee',mut:'#86a0a1',acc:'#2fc4b2',accbg:'#123430',warn:'#e8963f',bad:'#e5695c',ink:'#04120f'}},
 {name:'Graphite',base:'dark',vars:{bg:'#121212',panel:'#1b1b1b',panel2:'#232323',line:'#333333',tx:'#ececec',mut:'#8f8f8f',acc:'#e6e6e6',accbg:'#2e2e2e',warn:'#e8963f',bad:'#e5695c',ink:'#111111'}},
 {name:'Paper',base:'light',vars:{bg:'#f4efe6',panel:'#fffdf8',panel2:'#f8f3ea',line:'#e2d9c8',tx:'#2a2418',mut:'#7a6f5c',acc:'#c2571a',accbg:'#f8e3d3',warn:'#b7791f',bad:'#c0392b',ink:'#ffffff'}},
 {name:'Sky',base:'light',vars:{bg:'#eef3f8',panel:'#ffffff',panel2:'#f4f7fb',line:'#d7e0ea',tx:'#162030',mut:'#62718a',acc:'#2563eb',accbg:'#dde8fd',warn:'#d9822b',bad:'#c94a3d',ink:'#ffffff'}}];
const TC={c:{dark:{},light:{}}};
try{const r=JSON.parse(localStorage.getItem('samm-colors')||'{}');for(const m of['dark','light'])if(r[m])for(const k of TH_KEYS)if(/^#[0-9a-f]{6}$/i.test(r[m][k]||''))TC.c[m][k]=r[m][k].toLowerCase()}catch(e){}
const thRgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const thHex=a=>'#'+a.map(x=>('0'+Math.round(x).toString(16)).slice(-2)).join('');
const thMix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
const thLum=h=>{const[r,g,b]=thRgb(h).map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*r+.7152*g+.0722*b};
const thNorm=s=>{s=s.trim().replace(/^#/,'');if(/^[0-9a-f]{3}$/i.test(s))s=s.replace(/./g,'$&$&');return/^[0-9a-f]{6}$/i.test(s)?'#'+s.toLowerCase():''};
/* the accent tint and the text on accent follow the accent unless you set them yourself */
const thEff=(m,o)=>{o=o||TC.c[m]||{};const e={...TH_DEF[m],...o};
 if(o.acc){if(!o.accbg)e.accbg=thHex(thMix(thRgb(e.panel),thRgb(e.acc),m==='light'?.16:.2));if(!o.ink)e.ink=thLum(e.acc)>.4?'#07120a':'#ffffff';if(!o.folder)e.folder=e.acc}if(o.mut&&!o.fileic)e.fileic=e.mut;return e};
function thSave(){try{const eff={};for(const m of['dark','light'])if(Object.keys(TC.c[m]).length)eff[m]=thEff(m);
 localStorage.setItem('samm-colors',JSON.stringify(TC.c));localStorage.setItem('samm-colors-eff',JSON.stringify(eff))}catch(e){}}
function thApply(skip){const m=THEME.cur(),has=Object.keys(TC.c[m]||{}).length,e=thEff(m),st=document.documentElement.style;
 TH_KEYS.forEach(k=>has?st.setProperty('--'+k,e[k]):st.removeProperty('--'+k));
 try{window.__native.setTheme&&window.__native.setTheme(e.bg)}catch(x){}
 if($('#themed').open)thSync(skip)}
function thSync(skip){const m=THEME.cur(),o=TC.c[m]||{},e=thEff(m);
 document.querySelectorAll('#thmode button').forEach(b=>b.classList.toggle('on',b.dataset.m===m));
 const pi=TH_PRE.findIndex(p=>p.base===m&&TH_KEYS.every(k=>thEff(m,p.vars)[k]===e[k]));
 cddOptions($('#thpre'),[...(pi<0?[{v:'custom',t:'Custom'}]:[]),...TH_PRE.map((p,i)=>({v:String(i),t:p.name+' · '+p.base}))],pi<0?'custom':String(pi));
 document.querySelectorAll('#throws .thr').forEach(r=>{const k=r.dataset.k,auto=!o[k]&&((o.acc&&(k==='accbg'||k==='ink'||k==='folder'))||(o.mut&&k==='fileic')),h=r.querySelector('.thh');
  r.querySelector('.thsw').style.background=e[k];if(h!==skip){h.value=e[k];h.classList.remove('bad')}
  r.querySelector('[data-reset]').disabled=!(k in o);r.querySelector('.thd').textContent=r.dataset.d+(auto?' · follows the accent':'')});
 $('#threset').disabled=!Object.keys(o).length;$('#thexp').disabled=!(Object.keys(TC.c.dark).length||Object.keys(TC.c.light).length)}
let thBuilt=false;
function thBuild(){if(thBuilt)return;thBuilt=true;
 $('#throws').innerHTML=TH_VARS.map(([g,rs])=>`<div class="thg">${g}</div>`+rs.map(([k,n,d])=>`<div class="thr" data-k="${k}" data-d="${d}"><button type="button" class="thsw cpick" aria-label="Pick ${n}" title="Pick a colour"></button><div class="thl"><div class="thn">${n}</div><div class="thd"></div></div><input type="text" class="thh" maxlength="7" spellcheck="false" aria-label="${n} hex colour"><button class="btn sm" data-reset>Reset</button></div>`).join('')).join('')}
function thSet(k,hex,skip){const m=THEME.cur();(TC.c[m]=TC.c[m]||{})[k]=hex;thSave();thApply(skip)}
/* the colour picker, opened on a plain swatch instead of a JSON colour */
function cpOpenFree(btn,hex,title,cb){if(CP.open&&CP.anchor===btn){cpClose();return}
 const el=CP.el||cpBuild(),host=btn.closest('dialog')||document.body;if(el.parentNode!==host)host.appendChild(el);
 CP.c=null;CP.p=null;CP.cb=cb;CP.anchor=btn;CP.hasA=false;CP.a=255;
 const rgb=thRgb(hex),hv=cpHsv(rgb[0],rgb[1],rgb[2]);CP.h=hv[0];CP.s=hv[1];CP.v=hv[2];
 el.querySelector('.cp-t').textContent=title;cpSync();placeMenu(el,btn);CP.open=true}
$('#wpal').innerHTML=wi('<path d="M8 1.8a6.2 6.2 0 1 0 0 12.4c1 0 1.5-.7 1.5-1.4 0-.9-.7-1.1-.7-1.9 0-.7.6-1.2 1.4-1.2h1.4A2.4 2.4 0 0 0 14 7.3C14 4.2 11.3 1.8 8 1.8z"/><circle cx="4.9" cy="7.3" r=".7" fill="currentColor" stroke="none"/><circle cx="7.4" cy="4.7" r=".7" fill="currentColor" stroke="none"/><circle cx="10.5" cy="5.2" r=".7" fill="currentColor" stroke="none"/>');
$('#wpal').onclick=()=>{thBuild();thSync();$('#themed').showModal()};
$('#thx').onclick=()=>$('#themed').close();
$('#themed').addEventListener('close',()=>cpClose());
$('#thmode').onclick=e=>{const b=e.target.closest('button');if(!b||b.dataset.m===THEME.cur())return;cpClose();THEME.set(b.dataset.m)};
$('#thpre').onchange=e=>{const p=TH_PRE[+e.target.value];if(!p)return;cpClose();
 document.documentElement.dataset.theme=p.base;try{localStorage.setItem('samm-theme',p.base)}catch(x){}
 TC.c[p.base]={...p.vars};thSave();THEME.ui();thApply()};
$('#threset').onclick=()=>{cpClose();TC.c[THEME.cur()]={};thSave();thApply();toast('Colors reset')};
/* export / import a theme as a .json file (only the colors you changed, for dark and light) */
function thParse(t){let o;try{o=JSON.parse(t)}catch(e){return null}
 if(!o||typeof o!=='object'||Array.isArray(o))return null;
 const pick=c=>{const r={};if(c&&typeof c==='object')for(const k of TH_KEYS){const v=typeof c[k]==='string'?thNorm(c[k]):'';if(v)r[k]=v}return r};
 const c=o.colors&&typeof o.colors==='object'?o.colors:o,out={};
 if(c.dark||c.light){for(const m of['dark','light']){const r=pick(c[m]);if(Object.keys(r).length)out[m]=r}}
 else{const r=pick(c);if(Object.keys(r).length)out[o.mode==='light'?'light':'dark']=r}
 return Object.keys(out).length?{colors:out,mode:o.mode==='light'||o.mode==='dark'?o.mode:null}:null}
$('#thexp').onclick=async()=>{const colors={};for(const m of['dark','light'])if(Object.keys(TC.c[m]).length)colors[m]={...TC.c[m]};
 if(!Object.keys(colors).length)return toast('Nothing to export yet. Change a color or pick a preset first');
 const out={format:'samm-theme',version:1,mode:colors[THEME.cur()]?THEME.cur():Object.keys(colors)[0],colors};
 try{const p=await saveAs('SAMM theme.json',JSON.stringify(out,null,2));if(p)toast('Saved '+p)}catch(e){toast('Saving failed: '+e.message)}};
$('#thimp').onclick=()=>{const i=document.createElement('input');i.type='file';i.accept='.json,application/json';
 i.onchange=async()=>{const fl=i.files[0];if(!fl)return;let t='';try{t=await fl.text()}catch(e){return toast('Couldn’t read that file')}
  const p=thParse(t);if(!p)return toast('That isn’t a valid theme file');
  cpClose();for(const m of Object.keys(p.colors))TC.c[m]={...p.colors[m]};
  const want=p.mode&&p.colors[p.mode]?p.mode:(p.colors[THEME.cur()]?THEME.cur():Object.keys(p.colors)[0]);
  thSave();if(want!==THEME.cur())THEME.set(want);else thApply();toast('Theme imported')};i.click()};
$('#throws').addEventListener('click',e=>{const sw=e.target.closest('.thsw'),rs=e.target.closest('[data-reset]');
 if(sw){const r=sw.closest('.thr'),k=r.dataset.k;cpOpenFree(sw,thEff(THEME.cur())[k],r.querySelector('.thn').textContent,hex=>thSet(k,hex))}
 else if(rs){const k=rs.closest('.thr').dataset.k,m=THEME.cur();if(TC.c[m])delete TC.c[m][k];thSave();thApply()}});
$('#throws').addEventListener('input',e=>{const t=e.target;if(!t.classList.contains('thh'))return;const v=thNorm(t.value);t.classList.toggle('bad',!v);if(v)thSet(t.closest('.thr').dataset.k,v,t)});
$('#throws').addEventListener('focusin',e=>{if(e.target.classList.contains('thh'))cpClose()});
$('#throws').addEventListener('focusout',e=>{if(e.target.classList.contains('thh'))thSync()});
const THEME={cur:()=>document.documentElement.dataset.theme==='light'?'light':'dark',
 ui(){const l=this.cur()==='light',b=$('#wtheme'),s=l?'Switch to dark mode':'Switch to light mode';b.innerHTML=wi(l?WI.moon:WI.sun);b.title=s;b.setAttribute('aria-label',s)},
 set(t){document.documentElement.dataset.theme=t;try{localStorage.setItem('samm-theme',t)}catch(e){}this.ui();thApply()}};
$('#wtheme').onclick=()=>THEME.set(THEME.cur()==='light'?'dark':'light');THEME.ui();thApply();
