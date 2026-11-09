/* SA Mod Manager - 11-editor.js: config editor core: INI parsing, file list, open / save / restore */
/* Classic script: loaded in order by index.html, shares globals with the other files. */
/* ===== config editor (.ini, .json and .jsonc anywhere in the game folder) ===== */
const ED={files:[],filter:'all',q:'',tab:'files',cur:null,open:{},scanning:false,inst:null,touchedML:false,fq:'',fopen:false};
const _ic=d=>`<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICO={pen:_ic('<path d="M3 13l.6-2.9 7.2-7.2a1.4 1.4 0 0 1 2 2L5.9 12.4 3 13z"/><path d="M9.6 4.1l2.3 2.3"/>'),
 tog:_ic('<rect x="1.5" y="4.5" width="13" height="7" rx="3.5"/><circle cx="11" cy="8" r="1.7" fill="currentColor" stroke="none"/>'),
 find:_ic('<circle cx="7" cy="7" r="4.4"/><path d="M10.4 10.4 14 14"/>'),
 up:_ic('<path d="M4 10l4-4 4 4"/>'),down:_ic('<path d="M4 6l4 4 4-4"/>')};
const edAnchor=()=>{const a=game||root;return a&&a._path?a._path:''};
function parseIniEd(t){const eol=t.includes('\r\n')?'\r\n':'\n';
 const lines=t.split(/\r?\n/).map(raw=>{if(/^\s*$/.test(raw))return{t:'b',raw};if(/^\s*[;#]/.test(raw))return{t:'c',raw};
  let m=raw.match(/^(\s*)\[([^\]]*)\](\s*[;#].*|\s*)$/);if(m)return{t:'s',ind:m[1],name:m[2],cm:m[3]||'',raw};
  m=raw.match(/^(\s*)([^=;#\[][^=]*?)(\s*=\s*)("[^"]*")(\s*[;#].*|\s*)$/)||raw.match(/^(\s*)([^=;#\[][^=]*?)(\s*=\s*)(.*?)(\s+[;#].*)?$/);
  if(m)return{t:'k',ind:m[1],key:m[2],sep:m[3],val:m[4],cm:m[5]||'',raw};
  return{t:'e',raw}});return{eol,lines}}
const iniText=m=>m.lines.map(l=>l.t==='s'?l.ind+'['+l.name+']'+l.cm:l.t==='k'?l.ind+l.key+l.sep+l.val+l.cm:l.raw).join(m.eol);
const detectIndent=t=>{const m=t.match(/^([ \t]+)"/m);return m?(m[1][0]==='\t'?'\t':m[1].length):2};
