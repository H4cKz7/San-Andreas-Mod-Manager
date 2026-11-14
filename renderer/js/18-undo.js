/* SA Mod Manager - 18-undo.js: undo / redo of unsaved profile changes (header buttons) */
/* Classic script: loaded in order by index.html, shares globals with the other files. */
/* undo / redo for changes that are not saved yet */
const UNDO={stack:[],redo:[],last:null,busy:false};
const snapState=()=>{Object.keys(S.profiles).forEach(fx);return JSON.stringify({profiles:S.profiles,cur:S.cur,pl:S.pl,fcl:S.fcl,bc:S.bc,bcDirty:S.bcDirty,pp:S.pp,ppDirty:S.ppDirty,def:S.defInFile})};
function undoTrack(){if(UNDO.busy)return;const x=snapState();if(UNDO.last===null){UNDO.last=x;return}
 if(x!==UNDO.last){UNDO.stack.push(UNDO.last);if(UNDO.stack.length>80)UNDO.stack.shift();UNDO.redo=[];UNDO.last=x}}
function undoReset(){/* SAMM-PATCH-UNDO-FILES: file copy / move entries of this installation survive */const k=e=>!!e&&e.fs===true&&e.root===fsRootKey();UNDO.stack=UNDO.stack.filter(k);UNDO.redo=UNDO.redo.filter(k);UNDO.last=snapState()}
function undoApply(x){const o=JSON.parse(x),pc=S.cur;UNDO.busy=true;
 S.profiles=o.profiles;S.cur=o.cur;S.pl=o.pl;S.fcl=o.fcl;S.bc=o.bc;S.bcDirty=o.bcDirty;S.pp=o.pp;S.ppDirty=o.ppDirty;S.defInFile=o.def;
 if(!S.profiles[S.active])S.active=S.cur;UNDO.last=x;UNDO.busy=false;if(S.cur!==pc)SAVEHOLD=true;render();if(S.cur!==pc)syncCur()}
function doUndo(){if(!UNDO.stack.length)return;{const t=UNDO.stack[UNDO.stack.length-1];if(t&&t.fs)return fsHistStep(true)}UNDO.redo.push(snapState());undoApply(UNDO.stack.pop())}
function doRedo(){if(!UNDO.redo.length)return;{const t=UNDO.redo[UNDO.redo.length-1];if(t&&t.fs)return fsHistStep(false)}UNDO.stack.push(snapState());undoApply(UNDO.redo.pop())}
function doUndoAll(){if(!UNDO.stack.length)return;if(UNDO.stack.some(e=>e&&e.fs))return fsHistAll(true);const st=UNDO.stack,first=st[0];UNDO.redo.push(snapState(),...st.slice(1).reverse());UNDO.stack=[];undoApply(first)}
function doRedoAll(){if(!UNDO.redo.length)return;if(UNDO.redo.some(e=>e&&e.fs))return fsHistAll(false);const r=UNDO.redo,last=r[0];UNDO.stack.push(snapState(),...r.slice(1).reverse());UNDO.redo=[];undoApply(last)}
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
/* SAMM-PATCH-UNDO-FILES: copy / move history. Drag & drop, Ctrl+C / Ctrl+V and Ctrl+X in the mod list and the game root panel
   (26-dnd.js transfer()) add an entry to UNDO.stack, so the header Undo / Redo buttons and Ctrl+Z / Ctrl+Y reverse them in time order,
   mixed with the unsaved profile changes. An entry is { fs:true, root, copy, label, jobs:[{src,dst,isDir,rep,cp,u}] }:
   src / dst are absolute paths, rep is the Trash id of an item the operation replaced, cp the Trash id of a copy that Undo removed,
   u is true while the job is undone. Undo of a copy sends the copy to the Trash (nothing is deleted for good); undo of a move moves it back;
   anything that was replaced comes back out of the Trash. Nothing is ever overwritten: if the disk changed in the meantime the step is refused. */
const fsRootKey = () => (typeof root !== 'undefined' && root && root._path) || '';
function fsHistPush(e) {
  e.fs = true; e.root = fsRootKey(); e.jobs.forEach(j => { j.u = false });
  UNDO.stack.push(e); if (UNDO.stack.length > 80) UNDO.stack.shift();
  UNDO.redo = []; return e }
/* a folder was renamed: paths inside it move with it */
function fsHistRemap(a, b, skip) {
  const lo = a.toLowerCase(), fix = p => { if (typeof p !== 'string') return p; const l = p.toLowerCase(); return (l === lo || l.startsWith(lo + pathN.sep)) ? b + p.slice(a.length) : p };
  [...UNDO.stack, ...UNDO.redo].forEach(e => { if (e && e.fs && e !== skip) e.jobs.forEach(j => { j.src = fix(j.src); j.dst = fix(j.dst) }) }) }
const fsMiKey = p => { const l = locOf(p); return l && l.mod && !l.mod.startsWith('::') ? l.mod + (l.rel ? '/' + l.rel : '') : '' };
function fsHistTidy(src) { /* same tidy-up as transfer(): remove the folders a moved item left empty, up to its mod folder */
  const l = locOf(src); if (!l || !l.mod || l.mod.startsWith('::')) return;
  const mr = pathN.join(root._path, l.mod); let d = pathN.dirname(src);
  while (d.toLowerCase() !== mr.toLowerCase() && within(d, mr)) { try { fsN.rmdirSync(d) } catch (x) { break } d = pathN.dirname(d) } }
async function fsHistTrashBack(id, dst) { /* move a Trash item to dst; false if it is gone or dst is taken */
  const it = TR.list().find(x => x.id === id), from = pathN.join(TR.dir(), id, 'payload');
  if (!it || !fsN.existsSync(from) || fsN.existsSync(dst)) return false;
  await TR.move(from, dst);
  await fsN.promises.rm(pathN.join(TR.dir(), id), { recursive: true, force: true });
  TR.save(TR.list().filter(x => x.id !== id)); return true }
async function fsHistToTrash(p, isDir) {
  const l = locOf(p); return trashPut(l.mod, l.rel, isDir, isDir ? listFiles(p).length : 1) }
/* returns '' when the step can run, otherwise why not */
function fsHistCheck(e, todo, undo) {
  const nm = p => '“' + pathN.basename(p) + '”';
  if (e.kind === 'rename') { /* SAMM-PATCH-UNDO-RENAME */
    const j = todo[0]; if (!j) return '';
    const a = undo ? j.dst : j.src, b = undo ? j.src : j.dst;
    if (!fsN.existsSync(a)) return nm(a) + ' is no longer there under that name.';
    if (a.toLowerCase() !== b.toLowerCase() && fsN.existsSync(b)) return 'A folder called ' + nm(b) + ' already exists there.';
    return '' }
  for (const j of todo) {
    if (undo) {
      if (!fsN.existsSync(j.dst)) return nm(j.dst) + ' is no longer where it was put.';
      if (!e.copy && fsN.existsSync(j.src)) return 'Something is already at the original place of ' + nm(j.src) + '.';
    } else if (!fsN.existsSync(j.src) && !(e.copy && j.cp && fsN.existsSync(pathN.join(TR.dir(), j.cp, 'payload')))) return nm(j.src) + ' is no longer at its original place.' }
  return '' }
async function fsHistRun(e, undo) {
  const todo = e.jobs.filter(j => j.u === !undo), ord = undo ? [...todo].reverse() : todo, why = fsHistCheck(e, todo, undo);
  if (why) return { why };
  if (e.kind === 'rename') return fsHistRename(e, todo[0], undo);
  const flipped = [];let err = '', lost = 0;
  for (const j of ord) {
    try {
      if (undo) {
        if (e.copy) j.cp = (await fsHistToTrash(j.dst, j.isDir)).id; else await TR.move(j.dst, j.src);
        if (j.rep) { if (!await fsHistTrashBack(j.rep, j.dst)) lost++; j.rep = null }
        if (!e.copy && j.isDir && typeof miMoved === 'function') { const a = fsMiKey(j.src), b = fsMiKey(j.dst); if (a && b) miMoved(b, a, false) }
        j.u = true
      } else {
        if (fsN.existsSync(j.dst)) j.rep = (await fsHistToTrash(j.dst, fsN.statSync(j.dst).isDirectory())).id; else j.rep = null;
        if (e.copy) { if (!(j.cp && await fsHistTrashBack(j.cp, j.dst))) await fsN.promises.cp(j.src, j.dst, { recursive: true }); j.cp = null }
        else { await TR.move(j.src, j.dst); fsHistTidy(j.src) }
        if (j.isDir && typeof miMoved === 'function') { const a = fsMiKey(j.src), b = fsMiKey(j.dst); if (a && b) miMoved(a, b, e.copy) }
        j.u = false }
      flipped.push(j)
    } catch (x) { err = x.message; break } }
  return { flipped, err, lost, done: e.jobs.every(j => j.u === undo) } }
let FSHBUSY = false;
async function fsHistStep(undo) {
  const from = undo ? UNDO.stack : UNDO.redo, to = undo ? UNDO.redo : UNDO.stack, e = from[from.length - 1];
  if (!e || !e.fs) return;
  if (DNDBUSY || FSHBUSY) return toast('Wait for the current file action to finish');
  if (e.root !== fsRootKey()) { from.pop(); render(); return toast('Skipped a file action from another installation') }
  DNDBUSY = true; FSHBUSY = true;
  try {
    const r = await fsHistRun(e, undo);
    if (r.why) {
      DNDBUSY = false;
      const skip = await ask({ title: 'Can’t ' + (undo ? 'undo' : 'redo') + ' “' + e.label + '”', text: r.why + '\n\nNothing was changed. Skip this step and continue with the older ones?', ok: 'Skip step' });
      DNDBUSY = true;
      if (skip) { from.pop(); render() } return }
    const touched = new Set(), res = [], locs = [];
    r.flipped.forEach(j => {
      [j.src, j.dst].forEach(p => { const l = locOf(p); if (l) { touched.add(l.mod); locs.push({ mod: l.mod, rel: l.rel, dir: j.isDir }) } });
      const p = undo ? (e.copy ? null : j.src) : j.dst, l = p && locOf(p); if (l) res.push({ mod: l.mod, rel: l.rel, dir: j.isDir }) });
    touched.forEach(nm => { if (nm && !nm.startsWith('.') && !nm.startsWith('::')) refreshMod(nm) });
    res.forEach(q => { const m = S.mods.find(x => x.name === q.mod); if (m && e.kind !== 'rename' /* SAMM-PATCH-UNDO-RENAME-NOEXPAND */) { m._o = true; m._x = m._x || {}; [q.mod, ...(q.rel ? q.rel.split('/') : [])].slice(1, -1).reduce((a, x) => { const c = a ? a + '/' + x : x; m._x[c] = true; return c }, '') } });
    SEL.clear(); res.forEach(q => { if (q.rel || S.mods.some(m => m.name === q.mod)) SEL.set(selKey(q.mod, q.rel), q) }); SELA = res.length ? res[res.length - 1] : null;
    if (r.done) { from.pop(); to.push(e) }
    render(); runChecks(); landed(res); if (typeof rvAfter === 'function') rvAfter(locs);
    if (r.err) notice('Couldn’t finish ' + (undo ? 'the undo' : 'the redo'), r.err + '\n\nThe steps that worked are done. Press ' + (undo ? 'Undo' : 'Redo') + ' again to retry the rest.');
    else toast((undo ? 'Undid: ' : 'Redid: ') + e.label + (r.note || '') + (r.lost ? '. ' + r.lost + ' replaced item' + (r.lost > 1 ? 's' : '') + ' could not be restored from the Trash' : ''))
  } catch (x) { notice('Something went wrong', x.message) }
  finally { DNDBUSY = false; FSHBUSY = false } }
async function fsHistAll(undo) {
  for (;;) {
    const from = undo ? UNDO.stack : UNDO.redo, n = from.length; if (!n) break;
    await (undo ? doUndo() : doRedo());
    if ((undo ? UNDO.stack : UNDO.redo).length >= n) break } }
/* the Undo button of the "Moved / Copied" toast: only if nothing else happened since */
function fsHistToast(e) {
  if (UNDO.stack[UNDO.stack.length - 1] === e && !e.jobs.some(j => j.u)) return doUndo();
  toast('Something else happened since. Use Undo in the header to go back step by step') }

/* SAMM-PATCH-UNDO-RENAME-2: renaming a mod folder (or a folder inside one) is a history step too. The entry has one job {src: old path, dst: new path}.
   Undo / redo renames the folder on disk and repeats the bookkeeping of renameItem() in 51-rename.js: profile entries (priority, ignore, include, exclusive),
   mod info, the Trash index, the clipboard, the open rows. Profile entries changing is part of the step, not a separate history entry. */
function fsProfRefs() { /* the profile lists a mod rename touches, exactly as they are (key order and letter case included) */
  return JSON.stringify(Object.keys(S.profiles).map(n => { const p = fx(n); return [n, p.pr, p.im, p.inc, p.ex] })) }
function fsProfApply(s) {
  JSON.parse(s).forEach(([n, pr, im, inc, ex]) => { const p = S.profiles[n]; if (!p) return; p.pr = pr; p.im = im; p.inc = inc; p.ex = ex }) }
function fsRenameBook(mod, rel, nn, top, prof) { /* mod / rel = where the folder is NOW, nn = the name it gets */
  const nrel = top ? '' : (rel.includes('/') ? rel.slice(0, rel.lastIndexOf('/') + 1) : '') + nn, m = S.mods.find(x => x.name === mod), inRel = r => !top && r && (r === rel || r.startsWith(rel + '/'));
  let ref = 0, trCh = false; const tl = TR.list();
  if (top) {
    if (prof) { fsProfApply(prof.s); ref = prof.changed ? 1 : 0 } else ref = rnRefs(mod, nn);
    if (typeof miMoved === 'function') miMoved(mod, nn, false);
    if (m) { m.name = nn; S.mods.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })) }
    if (blobs.has(mod)) { blobs.set(nn, blobs.get(mod)); blobs.delete(mod) }
    tl.forEach(it => { if (it.mod === mod) { it.mod = nn; trCh = true } });
    if (CLIP) CLIP.items.forEach(i => { if (i.mod === mod) i.mod = nn })
  } else {
    if (typeof miMoved === 'function') miMoved(mod + '/' + rel, mod + '/' + nrel, false);
    if (m && m._x) { const nx = {}; Object.keys(m._x).forEach(k => { nx[k === rel || k.startsWith(rel + '/') ? nrel + k.slice(rel.length) : k] = m._x[k] }); m._x = nx }
    tl.forEach(it => { if (it.mod === mod && inRel(it.rel)) { it.rel = nrel + it.rel.slice(rel.length); trCh = true } });
    if (CLIP) CLIP.items.forEach(i => { if (i.mod === mod && inRel(i.rel)) i.rel = nrel + i.rel.slice(rel.length) });
    refreshMod(mod) }
  if (trCh) TR.save(tl);
  return { ref } }
async function fsHistRename(e, j, undo) {
  const none = err => ({ flipped: [], err, lost: 0, done: false });
  if (!j) return { flipped: [], err: '', lost: 0, done: true };
  const from = undo ? j.dst : j.src, to = undo ? j.src : j.dst, lc = locOf(from);
  if (!lc || lc.mod.startsWith('::')) return none('That folder is not inside the modloader folder any more.');
  try { await fsN.promises.rename(from, to) }
  catch (x) { return none((/^(EBUSY|EPERM|EACCES)$/.test(x.code) ? 'Windows says the folder is in use. Close the game, Explorer windows or any program that has it open, then try again.\n\n' : '') + x.message) }
  const b = fsRenameBook(lc.mod, lc.rel, pathN.basename(to), !lc.rel, e.prof ? { s: undo ? e.prof.before : e.prof.after, changed: e.prof.before !== e.prof.after } : null);
  fsHistRemap(from, to, e);
  j.u = undo;
  UNDO.last = snapState(); /* the profile entries followed the rename: that is part of this step */
  return { flipped: [j], err: '', lost: 0, done: true, note: b.ref ? '. Profile entries updated' : '' } }
