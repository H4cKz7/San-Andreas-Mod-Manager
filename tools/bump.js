#!/usr/bin/env node
/*
 * SA Mod Manager: version bumper.  Put this file in  tools/bump.js
 *
 *   node tools/bump.js                 show every version number it knows about (and whether they agree)
 *   node tools/bump.js 1.2.7           set that exact version everywhere
 *   node tools/bump.js patch           1.2.6 -> 1.2.7   (also: minor, major)
 *   node tools/bump.js 1.2.7 --dry     show what would change, write nothing
 *   node tools/bump.js --find          list every other line in the project that mentions the current version
 *   node tools/bump.js --setup         one-time: add an "npm run bump" script and a line in AI_GUIDE.md
 *
 * Places it updates (edit TARGETS below to add more):
 *   package.json              "version"
 *   package-lock.json         top-level "version" and packages[""].version (if the file exists)
 *   index.html                titlebar badge  <span class="tb-v">v1.2.5</span>
 *   index.html                <title> (only if the title already contains a version)
 *
 * Only the version text itself is replaced; line endings and formatting are left alone.
 * Nothing is written unless every required place was found.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const V = '\\d+\\.\\d+\\.\\d+(?:-[0-9A-Za-z.-]+)?';
const SEMVER = new RegExp('^' + V + '$');

/* Each regex needs exactly two groups: (text before the version)(text after it). Only the first match is replaced. */
const TARGETS = [
  { file: 'package.json', label: 'package.json version', required: true,
    re: new RegExp('("version"\\s*:\\s*")' + V + '(")') },
  { file: 'package-lock.json', label: 'package-lock.json version',
    re: new RegExp('("version"\\s*:\\s*")' + V + '(")') },
  { file: 'package-lock.json', label: 'package-lock.json packages[""]',
    re: new RegExp('("packages"\\s*:\\s*\\{\\s*""\\s*:\\s*\\{[\\s\\S]*?"version"\\s*:\\s*")' + V + '(")') },
  { file: 'index.html', label: 'index.html titlebar badge', required: true,
    re: new RegExp('(<span class="tb-v">v?)' + V + '(</span>)') },
  { file: 'index.html', label: 'index.html <title>',
    re: new RegExp('(<title>[^<]*?)' + V + '([^<]*</title>)') },
];

const p = f => path.join(ROOT, f);
const read = f => (fs.existsSync(p(f)) ? fs.readFileSync(p(f), 'utf8') : null);
const die = m => { console.error('\n' + m); process.exit(1); };

function found(t, text) {
  const m = text && text.match(t.re);
  return m ? m[0].match(new RegExp(V))[0] : null;
}

function currentVersion() {
  const pj = read('package.json');
  if (!pj) die('package.json not found in ' + ROOT);
  const v = JSON.parse(pj).version;
  if (!SEMVER.test(String(v))) die('package.json has no valid "version" (got ' + v + ').');
  return v;
}

function nextVersion(cur, arg) {
  if (/^v?\d/.test(arg)) {
    const v = arg.replace(/^v/, '');
    if (!SEMVER.test(v)) die('"' + arg + '" is not a valid version (use x.y.z).');
    return v;
  }
  const n = cur.split('-')[0].split('.').map(Number);
  if (arg === 'major') return (n[0] + 1) + '.0.0';
  if (arg === 'minor') return n[0] + '.' + (n[1] + 1) + '.0';
  if (arg === 'patch') return n[0] + '.' + n[1] + '.' + (n[2] + 1);
  die('Unknown argument "' + arg + '". Use x.y.z, patch, minor or major.');
}

/* ---- report ------------------------------------------------------------------------- */
function report() {
  const cur = currentVersion();
  const cache = {};
  let bad = false;
  console.log('Project version (package.json): ' + cur + '\n');
  TARGETS.forEach(t => {
    const text = cache[t.file] !== undefined ? cache[t.file] : (cache[t.file] = read(t.file));
    const v = found(t, text);
    let state;
    if (text === null) state = t.required ? 'FILE MISSING' : '(no file, skipped)';
    else if (v === null) state = t.required ? 'NOT FOUND' : '(no version here, skipped)';
    else state = v + (v === cur ? '' : '   <-- differs from package.json');
    if ((text === null || v === null) && t.required) bad = true;
    if (v !== null && v !== cur) bad = true;
    console.log('  ' + t.label.padEnd(34) + state);
  });
  console.log(bad ? '\nSome places are out of sync. Run: node tools/bump.js ' + cur + '  to line them all up.'
                  : '\nAll in sync.');
  return bad;
}

/* ---- bump --------------------------------------------------------------------------- */
function bump(arg, dry) {
  const cur = currentVersion();
  const next = nextVersion(cur, arg);
  const texts = {}, changes = [];
  let missing = false;

  TARGETS.forEach(t => {
    if (texts[t.file] === undefined) texts[t.file] = read(t.file);
    const text = texts[t.file];
    const old = found(t, text);
    if (text === null || old === null) {
      if (t.required) { missing = true; console.log('  ! ' + t.label + ': ' + (text === null ? 'file missing' : 'version not found')); }
      else console.log('  - ' + t.label + ': skipped');
      return;
    }
    texts[t.file] = text.replace(t.re, (m, a, b) => a + next + b);
    changes.push([t.label, old]);
  });

  if (missing) die('Nothing written: a required place was not found (see above).');

  changes.forEach(c => console.log('  ' + c[0].padEnd(34) + c[1] + '  ->  ' + next));
  if (dry) { console.log('\nDry run, nothing written.'); return; }

  Object.keys(texts).forEach(f => { if (texts[f] !== null) fs.writeFileSync(p(f), texts[f]); });
  console.log('\nVersion is now ' + next + (cur !== next ? ' (was ' + cur + ')' : '') + '.');
}

/* ---- find other mentions ------------------------------------------------------------ */
function find() {
  const cur = currentVersion();
  const skipDir = new Set(['node_modules', '.git', 'dist', 'release', 'out']);
  const exts = new Set(['.js', '.json', '.html', '.css', '.md', '.txt', '.yml', '.yaml', '.nsh', '.cjs', '.mjs']);
  const needle = new RegExp('(?<![\\d.])' + cur.replace(/\./g, '\\.') + '(?![\\d])');
  let n = 0;
  (function walk(dir) {
    fs.readdirSync(dir, { withFileTypes: true }).forEach(e => {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) { if (!skipDir.has(e.name)) walk(full); return; }
      if (!exts.has(path.extname(e.name).toLowerCase()) || e.name === 'package-lock.json') return;
      fs.readFileSync(full, 'utf8').split(/\r?\n/).forEach((line, i) => {
        if (needle.test(line)) {
          n++;
          console.log(path.relative(ROOT, full) + ':' + (i + 1) + ': ' + line.trim().slice(0, 140));
        }
      });
    });
  })(ROOT);
  console.log('\n' + n + ' line(s) mention ' + cur + '. Anything that should follow the version can be added to TARGETS in tools/bump.js.');
}

/* ---- one-time setup ----------------------------------------------------------------- */
function setup() {
  const pj = read('package.json');
  if (!pj) die('package.json not found.');
  if (/"bump"\s*:/.test(pj)) console.log('package.json already has a "bump" script.');
  else {
    const o = JSON.parse(pj);
    const ind = (pj.match(/^([ \t]+)"/m) || [null, '  '])[1];
    const crlf = pj.includes('\r\n');
    o.scripts = o.scripts || {};
    o.scripts.bump = 'node tools/bump.js';
    let out = JSON.stringify(o, null, ind);
    if (crlf) out = out.replace(/\n/g, '\r\n');
    if (/\n$/.test(pj)) out += crlf ? '\r\n' : '\n';
    fs.writeFileSync(p('package.json'), out);
    console.log('Added npm script: npm run bump -- patch   (or minor / major / 1.2.7)');
  }
  const g = read('AI_GUIDE.md');
  if (g !== null && !g.includes('tools/bump.js')) {
    const nl = g.includes('\r\n') ? '\r\n' : '\n';
    const line = '- Version: change it only with `node tools/bump.js <x.y.z|patch|minor|major>`. It updates package.json, the lockfile and index.html (titlebar badge and title).';
    fs.writeFileSync(p('AI_GUIDE.md'), g.replace(/\s*$/, '') + nl + line + nl);
    console.log('Added a version line to AI_GUIDE.md.');
  }
}

/* ---- main --------------------------------------------------------------------------- */
const args = process.argv.slice(2);
const dry = args.includes('--dry');
const rest = args.filter(a => !a.startsWith('--'));

if (args.includes('--setup')) setup();
else if (args.includes('--find')) find();
else if (!rest.length) process.exit(report() ? 1 : 0);
else bump(rest[0], dry);
