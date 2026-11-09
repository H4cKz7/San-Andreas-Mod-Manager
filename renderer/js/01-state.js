/* SA Mod Manager - 01-state.js: global state S, profiles and inheritance, glob matching, small helpers */
/* Classic script: loaded in order by index.html, shares globals with the other files. */
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const TYPES={dff:'Models',txd:'Textures',col:'Collision',ifp:'Animations',ide:'Definitions',ipl:'Placement',dat:'Data',cfg:'Config',cs:'CLEO',cm:'CLEO',csa:'CLEO',asi:'Plugin',dll:'Plugin',cleo:'CLEO',wav:'Audio',mp3:'Audio',ogg:'Audio',img:'Archive',gxt:'Text',fxt:'Text',ini:'Config',fxp:'Effects',scm:'Script'};
const typesOf=m=>[...new Set(m.files.map(f=>TYPES[f.split('.').pop().toLowerCase()]).filter(Boolean))].slice(0,4);
const blobs=new Map();
let S={active:'Default',profiles:{Default:{pr:{},im:[],ex:[],ig:[]}},mods:[]};
try{const s=localStorage.getItem('samm');if(s)S=JSON.parse(s)}catch(e){}
const fx=n=>{const p=S.profiles[n];p.pr=p.pr||{};['im','ex','ig','inc','par','cx'].forEach(k=>p[k]=p[k]||[]);if(Array.isArray(p.um))p.um=p.um.join(', ');p.um=p.um||'';if(p.ia===undefined)p.ia=null;if(p.ea===undefined)p.ea=null;return p};
const P=()=>fx(S.active);
S.main=S.main||'modloader.ini';S.topSecs=S.topSecs||[];S.mods=S.mods||[];S.exes=S.exes||[];S.exe=S.exe||'';S.gpathAuto=S.gpathAuto||'';S.gpathUser=S.gpathUser||'';S.gname=S.gname||'';S.installs=S.installs||[];S.sort=S.sort||'name';S.curInst=S.curInst||'';S.bcFrom=S.bcFrom||'none';S.bc=S.bc||bcDef();S.bcRaw=S.bcRaw||'';S.panels=S.panels||{};S.bcx=S.bcx||[];S.bcTop=S.bcTop||[];S.pp=S.pp||{};S.ppTop=S.ppTop||[];S.plugins=S.plugins||[];S.fcl=S.fcl||[];S.cur=S.cur||'Default';if(S.pl===undefined)S.pl=null;S.autoBk=S.autoBk||{};S.essIgn=S.essIgn||[];
function setPr(p,name,v){for(const k of Object.keys(p.pr))if(k.toLowerCase()===name.toLowerCase())delete p.pr[k];if(v!==50)p.pr[name]=v}
function rawParents(n){const out=[];for(const a of fx(n).par){const l=a.toLowerCase();if(l==='$none')return[];
 let r=null;if(l==='$current')r=S.cur===n?null:S.cur;else r=Object.keys(S.profiles).find(k=>k.toLowerCase()===l)||null;
 if(r&&r!==n&&!out.includes(r))out.push(r)}return out}
function reach(a,b,seen=[]){if(seen.includes(a))return false;return rawParents(a).some(p=>p===b||reach(p,b,[...seen,a]))}
const parentsOf=n=>rawParents(n).filter(r=>!reach(r,n));
function inheritedFrom(a,b,seen=[]){if(seen.includes(a))return false;return parentsOf(a).some(p=>p===b||inheritedFrom(p,b,[...seen,a]))}
const hier=n=>[n,...parentsOf(n)];
function flag(n,k,seen=[]){const p=fx(n);if(p[k]!=null)return p[k];if(seen.includes(n))return false;return parentsOf(n).some(x=>flag(x,k,[...seen,n]))}
function eff(){const A=S.active,e={pr:{},im:{},ig:{},inc:{},ex:{},exo:[],ia:flag(A,'ia'),ea:flag(A,'ea')};
 hier(A).forEach(x=>{const p=fx(x);for(const[k,v]of Object.entries(p.pr)){const l=k.toLowerCase();if(!(l in e.pr))e.pr[l]=[v,x]}
  p.im.forEach(m=>{if(!(m in e.im))e.im[m]=x});p.ig.forEach(m=>{if(!(m in e.ig))e.ig[m]=x});p.inc.forEach(m=>{if(!(m in e.inc))e.inc[m]=x})});
 fx(A).ex.forEach(m=>e.ex[m]=A);
 Object.keys(S.profiles).forEach(q=>{if(q===A||inheritedFrom(A,q))return;fx(q).ex.forEach(m=>e.exo.push([m,q]))});
 return e}
let E={pr:{},im:{},ig:{},inc:{},ex:{},exo:[],ia:false,ea:false};
function mw(pat,str,pi=0,si=0){let had=false;
 for(;;){const c=pat[pi++];
  if(c===undefined){const r=str[si];return r===undefined||((r==='/'||r==='\\')&&si+1===str.length)}
  if(c==='/'||c==='\\'){const r=str[si];if(r!=='/'&&r!=='\\'){if(r===undefined&&pi>=pat.length)continue;return false}si++;had=true;continue}
  if(c==='*'){const allow=!had||pat[pi]==='*';while(pat[pi]==='*')pi++;if(pi>=pat.length)return true;
   for(;si<str.length;si++){if(mw(pat,str,pi,si))return true;const r=str[si];if((r==='/'||r==='\\')&&!allow)return false}return false}
  if(c==='?'){const r=str[si];if(r===undefined||r==='/'||r==='\\')return false;si++;continue}
  const r=str[si];if(r===undefined||r.toLowerCase()!==c.toLowerCase())return false;si++}}
const hit=(o,n)=>{for(const p of Object.keys(o))if(mw(p,n))return o[p];return null};
const swOn=n=>E.ia?false:E.ea?!!hit(E.inc,n):!hit(E.im,n);
const exOther=n=>{if(hit(E.ex,n))return null;for(const[p,q]of E.exo)if(mw(p,n))return q;return null};
const inh=n=>{const o=[],pe=E.pr[n.toLowerCase()],a=hit(E.im,n),c=hit(E.inc,n);
 if(pe&&pe[1]!==S.active)o.push(['priority',pe[1]]);if(a&&a!==S.active)o.push(['ignored',a]);if(c&&c!==S.active)o.push(['included',c]);
 return o.map(x=>`<span class="tag" title="Inherited from ${esc(x[1])}">${x[0]} from ${esc(x[1])}</span>`).join('')};
var _st;const saveNow=()=>{try{localStorage.setItem('samm',JSON.stringify(S,(k,v)=>k==='mods'?undefined:v))}catch(e){}};
const save=()=>{clearTimeout(_st);_st=setTimeout(saveNow,300)};
addEventListener('beforeunload',saveNow);
var SAVEHOLD=false; /* while true, render() leaves the Save button alone (avoids a flash during an instant write) */
const toast=(t,act)=>{const e=$('#toast'),fn=typeof act==='function';
 e.textContent=t;e.classList.toggle('act',fn);
 if(fn){const b=document.createElement('button');b.type='button';b.textContent='Undo';
  b.onclick=()=>{clearTimeout(toast.t);e.classList.remove('show');try{e.hidePopover()}catch(x){}act()};e.appendChild(b)}
 clearTimeout(toast.t);clearTimeout(toast.h);
 try{if(e.matches(':popover-open'))e.hidePopover();e.showPopover()}catch(x){}
 e.classList.remove('show');void e.offsetWidth;e.classList.add('show');
 toast.t=setTimeout(()=>{e.classList.remove('show');toast.h=setTimeout(()=>{try{e.hidePopover()}catch(x){}},260)},fn?7000:2400)};
const prio=n=>{const pe=E.pr[n.toLowerCase()],v=pe?pe[0]:50;return S.pl!=null?Math.min(v,S.pl):v};
const pat2re=p=>new RegExp('^'+p.replace(/[.+^${}()|[\]\\]/g,'\\$&').replace(/\*/g,'.*').replace(/\?/g,'.')+'$','i');
const fileIgnored=(m,f)=>{const b=f.split('/').pop();return Object.keys(E.ig).some(p=>mw(p,f)||mw(p,b))};
