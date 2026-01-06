# Cordoval OS

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

**A powerful desktop operating system environment built with Electron, React, and TypeScript.**

Built by **Kieren Day Studios** - Making business operations seamless.

---

## ✨ Features

- 🖥️ **Full Desktop Environment** - Complete OS-like experience
- 🪟 **Window Management** - Drag, resize, minimize, maximize, and close windows
- 🎯 **App Launcher** - Quick access to your KDS ecosystem
- 🌐 **Web Integration** - Run web apps as native applications
- 🔄 **Auto-Updates** - Seamless updates delivered automatically
- ⚡ **Lightning Fast** - Built on Electron with React for smooth performance
- 🎨 **Beautiful UI** - Modern glassmorphic design with smooth animations

---

## 🚀 Quick Start

### For End Users

**Download the latest release:**
```
https://github.com/KierenDayStudios/Cordoval-OS/releases/latest
```

Choose:
- **Setup.exe** - Full installer with auto-updates
- **Portable.exe** - No installation required

### For Developers

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build:win
```

---

## 📦 Distribution

See detailed guides:
- **[BUILD-GUIDE.md](BUILD-GUIDE.md)** - Complete build and distribution documentation
- **[RELEASE.md](RELEASE.md)** - Quick release checklist

### Quick Build

```bash
# Build Windows installer
npm run build:win

# Build and publish release
npm run release
```

---

## 🔄 Auto-Update System

Cordoval OS includes automatic update checking:
- Checks for updates on startup (after 3 seconds)
- Re-checks every 4 hours
- Downloads updates in the background
- Installs on next app restart
- Users always have the latest features!

---

## 🎮 Window Controls

- **Drag** - Click and drag titlebar to move windows
- **Resize** - Drag window edges or corners
- **Minimize** - Click `─` button
- **Maximize** - Click `□` button or double-click titlebar
- **Close** - Click `✕` button

---

## 🛠️ Tech Stack

- **Framework:** Electron
- **UI Library:** React
- **Language:** TypeScript
- **Build Tool:** electron-vite
- **Bundler:** Vite
- **Packaging:** electron-builder
- **Updates:** electron-updater

---

## 📁 Project Structure

```
cordoval-os/
├── src/
│   ├── main/          # Electron main process
│   ├── renderer/      # React UI
│   └── preload/       # Preload scripts
├── build/             # App icons and resources
├── release/           # Built installers (after build)
├── electron-builder.yml
└── package.json
```

---

## 🎨 Customization

### Change App Icon
Replace files in `build/`:
- `icon.png` (512x512 PNG)
- `icon.ico` (Windows)
- `icon.icns` (macOS)

### Update Branding
Edit `electron-builder.yml`:
```yaml
productName: Your App Name
appId: com.yourcompany.yourapp
```

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🤝 Support

Built with ❤️ by **Kieren Day Studios**

- Website: https://kierendaystudios.co.uk
- Email: hello@kierendaystudios.co.uk

---

## 🙏 Credits

- [Electron](https://www.electronjs.org/)
- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [electron-builder](https://www.electron.build/)

---

**Made for the modern business professional.**
