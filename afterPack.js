const path = require('path');
const fs = require('fs');

// Runs after electron-builder has laid out the app, before the portable exe is wrapped.
// Writes the icon and the Task Manager name straight into the inner exe with rcedit,
// because "signAndEditExecutable": false stops electron-builder from doing it.
exports.default = async function (context) {
  if (context.electronPlatformName !== 'win32') return;
  const m = await import('rcedit');           // works whether rcedit is ESM or CJS
  const rcedit = m.rcedit || m.default;
  const exe = path.join(context.appOutDir, context.packager.appInfo.productFilename + '.exe');
  const ico = path.join(context.packager.projectDir, 'build', 'icon.ico');
  if (!fs.existsSync(ico)) throw new Error('build/icon.ico not found: ' + ico);
  const ver = context.packager.appInfo.version;
  await rcedit(exe, {
    icon: ico,
    'file-version': ver,
    'product-version': ver,
    'version-string': {
      FileDescription: 'San Andreas Mod Manager',
      ProductName: 'San Andreas Mod Manager',
      InternalName: 'San Andreas Mod Manager',
      OriginalFilename: 'San Andreas Mod Manager.exe'
    }
  });
};
