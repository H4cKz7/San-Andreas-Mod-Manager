/* SA Mod Manager - 54-exit-guard.js: asks before the app closes while profile, Modloader or plugin changes are not saved (loaded in order by index.html) */
/* Classic script: loaded in order by index.html, shares globals with the other files. */
/* main.js sends 'close-request' before every close (X button, Alt+F4, taskbar); the answer goes back through window.__native.closeReply(true|false). */
/* "Pending" = the same test as the Save button in 02-modlist.js: a file whose text differs from what was last written (files() vs written). The config editor has its own discard dialog and is not checked here. */
const exitLeft = () => { try { return !!root && files().some(([p, t]) => written[p] !== t) } catch (e) { return false } };
/* what is pending, in words. Aggregated across all changed files so the list stays short however many profile files changed: edited / new / deleted profiles, current profile, priority limit, other settings, Modloader settings, plugin settings (at most nine lines) */
const exitItems = () => {
  const cut = a => a.length > 4 ? a.slice(0, 4).join(', ') + ' and ' + (a.length - 4) + ' more' : a.join(', ');
  const names = s => new Set([...String(s || '').matchAll(/^\s*\[Profiles\.([^.\]]+)\./gm)].map(m => m[1]));
  /* the lines of every section whose name passes keep() */
  const part = (s, keep) => { let r = '', on = false; for (const l of String(s || '').split(/\r?\n/)) { const m = /^\s*\[([^\]]*)\]/.exec(l); if (m) on = keep(m[1]); if (on) r += l + '\n' } return r };
  const mine = n => k => k.startsWith('Profiles.' + n + '.'), other = k => !k.startsWith('Profiles.');
  const strip = s => part(s, other).replace(/^\s*(Profile|PriorityLimit)\s*=.*$/gm, '');
  const val = (s, key) => (new RegExp('^\\s*' + key + '\\s*=\\s*(.*?)\\s*$', 'm').exec(part(s, other)) || [])[1];
  const edited = new Set(), added = new Set(), gone = new Set(), odd = [], elsewhere = [];
  let cfg = false, plg = false, limit = false, cur = '';
  for (const [p, t] of files()) {
    const w = written[p];
    if (w === t) continue;
    if (p === '.data/config.ini') { cfg = true; continue }
    if (p === '.data/plugins/plugins.ini') { plg = true; continue }
    const was = names(w), now = names(t);
    let hit = false;
    now.forEach(n => { if (!was.has(n)) { added.add(n); hit = true } else if (part(w, mine(n)) !== part(t, mine(n))) { edited.add(n); hit = true } });
    was.forEach(n => { if (!now.has(n)) { gone.add(n); hit = true } });
    const c0 = val(w, 'Profile'), c1 = val(t, 'Profile');
    if (c0 !== c1) { if (!cur) cur = (c0 || 'none') + ' → ' + (c1 || 'none'); hit = true }
    if (val(w, 'PriorityLimit') !== val(t, 'PriorityLimit')) { limit = true; hit = true }
    if (strip(w) !== strip(t)) { elsewhere.push(p); hit = true }
    if (!hit) odd.push(p);
  }
  [...added].forEach(n => { if (gone.has(n)) { added.delete(n); gone.delete(n); edited.add(n) } }); /* moved to another file */
  const out = [], list = (a, one, many) => { if (a.length) out.push((a.length > 1 ? many : one) + cut(a)) };
  list([...edited], 'Edited profile: ', 'Edited profiles: ');
  list([...added], 'New profile: ', 'New profiles: ');
  list([...gone], 'Deleted profile: ', 'Deleted profiles: ');
  if (cur) out.push('Current profile: ' + cur);
  if (limit) out.push('Priority limit');
  if (elsewhere.length) out.push('Other settings in ' + cut(elsewhere));
  if (cfg) out.push('Modloader settings (.data/config.ini)');
  if (plg) out.push('Plugin settings (.data/plugins/plugins.ini)');
  if (odd.length) out.push('Changes to ' + cut(odd));
  return out;
};
const exitPending = () => { const prof = exitLeft(); return { prof, items: prof ? exitItems() : [] } };
/* Save and exit: runs the header Save handler (it greys the button at once, so wait for it to finish and re-check the files). false = something failed, the app stays open. */
async function exitSave() {
  try {
    const b = $('#save');
    if (b && !b.disabled && b.onclick) await b.onclick();
    for (let i = 0; i < 100 && exitLeft(); i++) await new Promise(r => setTimeout(r, 150));
    if (exitLeft()) { toast('Couldn’t confirm that the changes were saved, so the app stays open'); return false }
    return true;
  } catch (e) { console.error(e); toast('Saving failed: ' + ((e && e.message) || e)); return false }
}
if (window.__native && window.__native.onCloseRequest) window.__native.onCloseRequest(async () => {
  const N = window.__native;
  N.closeAck(false);
  try {
    const p = exitPending();
    if (!p.prof) return N.closeReply(true);
    if ($('#askd').open) return N.closeReply(false);
    N.closeAck(true);
    const r = await ask({ title: 'Unsaved changes', text: 'These changes have not been saved:\n' + (p.items.length ? p.items : ['Changes in your profiles']).map(x => '• ' + x).join('\n') + '\n\nSave them before closing?', ok: 'Save and exit', alt: 'Exit without saving' });
    if (r === 'alt') return N.closeReply(true);
    if (r !== true) return N.closeReply(false);
    N.closeReply(await exitSave());
  } catch (e) { console.error(e); N.closeReply(true) }
});
