# San Andreas Mod Manager

A lightweight desktop application designed to manage mods and configurations for multiple installations for **Grand Theft Auto: San Andreas**.

---

## Features

* **Multi-Installation Support:** Track and switch between multiple GTA San Andreas game folders.
* **Config Editor:** Built-in editor for `.ini`, `.json` and `.jsonc` configuration files with safety backups.
* **Mod Loader Integration:** Works seamlessly alongside Mod Loader.
* **Automatic Backups:** Automatically saves original and previous versions of edited config files so you can easily roll back changes.

---

## Getting Started
### Prerequisites
* [Node.js](https://nodejs.org/) installed on your system.
* **Mod Loader** must already be installed in your target GTA San Andreas directory.

### Running from Source

1. Clone or download this repository.
2. Run the startup script for your operating system:
   * **Windows:** Double-click `Start.bat`
   * **macOS / Linux:** Run `./start.sh` in your terminal
   
   *(Note: The first launch will automatically run `npm install` before opening the application).*
3. **First Launch Setup:** 
   * When prompted, select your GTA San Andreas folder (the directory containing `gta_sa.exe`). 
   * The app will remember this path. You can scan and manage additional folders at any time.

---

## Building from Source

If you want to package the app into a standalone executable:

### Standard Package (Recommended)
Creates a packaged folder containing the `.exe` and its dependencies (keep the entire folder together):

    npm install
    npm run pack

* **Output:** `dist\SA Mod Manager-win32-x64\SA Mod Manager.exe`

### Single Portable `.exe` (Optional)
Generates a single packed executable file:

    npm run build

---

## Backups & Safety

Before the manager modifies any `.ini` or `.json` configuration file, it automatically creates a backup stored locally in your data folder:
`%APPDATA%\sa-mod-manager\backups`

You can restore previous versions at any time directly within the app via **Config editor > Backups**.
