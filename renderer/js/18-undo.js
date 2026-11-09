/* SA Mod Manager - 18-undo.js: undo / redo of unsaved profile changes (header buttons) */
/* Classic script: loaded in order by index.html, shares globals with the other files. */
/* undo / redo for changes that are not saved yet */
const UNDO={stack:[],redo:[],last:null,busy:false};
const snapState=()=>{Object.keys(S.profiles).forEach(fx);return JSON.stringify({profiles:S.profiles,cur:S.cur,pl:S.pl,fcl:S.fcl,bc:S.bc,bcDirty:S.bcDirty,pp:S.pp,ppDirty:S.ppDirty,def:S.defInFile})};
function undoTrack(){if(UNDO.busy)return;const x=snapState();if(UNDO.last===null){UNDO.last=x;return}
 if(x!==UNDO.last){UNDO.stack.push(UNDO.last);if(UNDO.stack.length>80)UNDO.stack.shift();UNDO.redo=[];UNDO.last=x}}
function undoReset(){UNDO.stack=[];UNDO.redo=[];UNDO.last=snapState()}
function undoApply(x){const o=JSON.parse(x),pc=S.cur;UNDO.busy=true;
 S.profiles=o.profiles;S.cur=o.cur;S.pl=o.pl;S.fcl=o.fcl;S.bc=o.bc;S.bcDirty=o.bcDirty;S.pp=o.pp;S.ppDirty=o.ppDirty;S.defInFile=o.def;
 if(!S.profiles[S.active])S.active=S.cur;UNDO.last=x;UNDO.busy=false;if(S.cur!==pc)SAVEHOLD=true;render();if(S.cur!==pc)syncCur()}
function doUndo(){if(!UNDO.stack.length)return;UNDO.redo.push(snapState());undoApply(UNDO.stack.pop())}
function doRedo(){if(!UNDO.redo.length)return;UNDO.stack.push(snapState());undoApply(UNDO.redo.pop())}
function doUndoAll(){if(!UNDO.stack.length)return;const st=UNDO.stack,first=st[0];UNDO.redo.push(snapState(),...st.slice(1).reverse());UNDO.stack=[];undoApply(first)}
function doRedoAll(){if(!UNDO.redo.length)return;const r=UNDO.redo,last=r[0];UNDO.stack.push(snapState(),...r.slice(1).reverse());UNDO.redo=[];undoApply(last)}
$('#undo').onclick=doUndo;$('#redo').onclick=doRedo;
const SPL=[['#undomore','#undom'],['#redomore','#redom']];
const splClose=()=>SPL.forEach(([b,m])=>{$(m).hidden=true;$(b).setAttribute('aria-expanded','false')});
SPL.forEach(([b,m])=>{$(b).onclick=()=>{const o=$(m).hidden;splClose();$(m).hidden=!o;$(b).setAttribute('aria-expanded',String(o))}});
document.addEventListener('click',e=>{if(!e.target.closest('#undod,#redod'))splClose()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')splClose()});
$('#undoall').onclick=()=>{splClose();doUndoAll()};$('#redoall').onclick=()=>{splClose();doRedoAll()};
document.addEventListener('keydown',e=>{if(!(e.ctrlKey||e.metaKey)||document.querySelector('dialog[open]'))return;
 const t=e.target;if(t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.isContentEditable))return;const k=e.key.toLowerCase();
 if(k==='z'&&!e.shiftKey){e.preventDefault();doUndo()}else if(k==='y'||(k==='z'&&e.shiftKey)){e.preventDefault();doRedo()}});
