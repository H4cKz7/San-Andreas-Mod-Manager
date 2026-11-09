# Working on SA Mod Manager (read this first)

Electron app. Do **not** read whole files you don't need. The code is split on purpose.

1. Open `renderer/MAP.md`. It lists every file with a description and its top-level functions.
2. Open only the file(s) you need. Biggest JS file is about 28 KB.
3. Edit with small targeted changes (str_replace style), not whole-file rewrites.

## Layout
- `main.js` Electron main process (window, dialogs, archive extraction). `fsshim.js` Node bridge for the page.
- `index.html` markup only (header, sidebar cards, dialogs) + `<link>`/`<script>` tags.
- `renderer/js/NN-name.js` classic scripts, **loaded in numeric order** by `index.html`, sharing one global scope.
  No `import`/`export`, no bundler. A function can call anything defined in any file, as long as the call
  happens after all files have loaded (i.e. inside a handler or function, not at load time).
- `renderer/css/NN-name.css` loaded in order, later files override earlier ones.

## Rules
- Code that runs **at load time** (top-level statements) may only use things from the same or an earlier file,
  or `function` declarations in `00-hoisted.js`. A top-level call into a later file fails with "X is not defined".
- New file: create `renderer/js/NN-name.js`, add its `<script src>` to `index.html` at the right position.
  (`renderer/**` is already packaged by electron-builder.)
- Moved or added functions: run `node tools/map.js` to refresh `renderer/MAP.md`.
- Settings are saved in `localStorage` (key `samm`); `S.mods` is never persisted.
- Dialogs: `ask({...})` / `notice(title,text)`. Toasts: `toast(text, undoFn?)`. Drop-downs: `cddOptions(el, opts, val)`.
