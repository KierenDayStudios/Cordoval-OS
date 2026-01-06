# Cordoval OS - Build & Release Guide

## 🚀 Quick Start - Building for Distribution

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Windows 10/11 (for building Windows installers)

### Installation
```bash
npm install
```

---

## 📦 Building the Application

### Development Mode
```bash
npm run dev
```
This starts the app in development mode with hot-reload.

### Production Build (Local Testing)
```bash
npm run build:win
```
This creates a Windows installer in `release/[version]/` directory.

**Output files:**
- `Cordoval OS-1.0.0-Setup.exe` - Full installer
- `Cordoval OS-1.0.0-Portable.exe` - Portable version (no install required)

---

## 🔄 Auto-Updates Setup

### Option 1: GitHub Releases (Recommended - FREE)

1. **Create a GitHub Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/KierenDayStudios/Cordoval-OS.git
   git push -u origin main
   ```

2. **Update `electron-builder.yml`**
   Replace these lines:
   ```yaml
   publish:
     provider: github
     owner: KierenDayStudios
     repo: cordoval-os
   ```

3. **Create a GitHub Personal Access Token**
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Check: `repo` (all sub-options)
   - Copy the token

4. **Set Environment Variable**
   
   **Windows PowerShell:**
   ```powershell
   $env:GH_TOKEN="your_github_token_here"
   ```
   
   **Windows CMD:**
   ```cmd
   set GH_TOKEN=your_github_token_here
   ```

5. **Release a New Version**
   ```bash
   npm run release
   ```
   
   This will:
   - Build the app
   - Create installers
   - Upload to GitHub Releases
   - Make it available for auto-updates!

### Option 2: Custom Server Hosting

If you want to host updates on your own server:

1. **Update `electron-builder.yml`** - Comment out GitHub, uncomment custom:
   ```yaml
   # publish:
   #   provider: github
   #   owner: KierenDayStudios
   #   repo: cordoval-os
   
   publish:
     provider: generic
     url: https://your-domain.com/releases/
     channel: latest
   ```

2. **Build and Upload**
   ```bash
   npm run build:win
   ```

3. **Upload these files to your server:**
   - `Cordoval OS-1.0.0-Setup.exe`
   - `latest.yml` (auto-generated - contains version info)

---

## 📝 Version Management

### Update Version Number

1. **Edit `package.json`:**
   ```json
   {
     "version": "1.0.1"  // Increment this
   }
   ```

2. **Build new release:**
   ```bash
   npm run release
   ```

### Versioning Best Practices
- **Patch** (1.0.0 → 1.0.1): Bug fixes
- **Minor** (1.0.0 → 1.1.0): New features
- **Major** (1.0.0 → 2.0.0): Breaking changes

---

## 🎯 Release Workflow

### For Production Release
```bash
npm run release
```
This publishes the update to GitHub/your server and users will auto-update.

### For Testing (Draft Release)
```bash
npm run release:draft
```
This builds installers but doesn't publish them.

---

## 📁 Build Output

After building, find your files in:
```
release/
  └── 1.0.0/
      ├── Cordoval OS-1.0.0-Setup.exe       (Installer)
      ├── Cordoval OS-1.0.0-Portable.exe    (Portable)
      ├── latest.yml                         (Update manifest)
      └── builder-effective-config.yaml      (Build config)
```

---

## 🔧 Troubleshooting

### Build Fails
```bash
# Clear cache and rebuild
rm -rf node_modules out release
npm install
npm run build:win
```

### Auto-Update Not Working
1. Check `electron-builder.yml` has correct GitHub username
2. Verify `GH_TOKEN` environment variable is set
3. Make sure version number in `package.json` is higher than current release
4. Check GitHub releases page for your uploaded files

### Icon Not Showing
Place your app icon at: `build/icon.png` (at least 512x512px)

---

## 🎨 Customization

### Change App Icon
Replace `build/icon.png` with your icon (512x512 PNG recommended)

### Change App Name
Edit `electron-builder.yml`:
```yaml
productName: Your App Name
appId: com.yourcompany.yourapp
```

### Disable Auto-Updates
In `src/main/index.ts`, comment out:
```typescript
// autoUpdater.checkForUpdates()
```

---

## 📊 Distribution Checklist

- [ ] Update version in `package.json`
- [ ] Test app in development mode (`npm run dev`)
- [ ] Build production version (`npm run build:win`)
- [ ] Test installer on clean Windows machine
- [ ] Update GitHub repository
- [ ] Set `GH_TOKEN` environment variable
- [ ] Run `npm run release`
- [ ] Verify release on GitHub
- [ ] Test auto-update on previous version
- [ ] Share download link with users!

---

## 🌐 Sharing Your App

After releasing to GitHub, share this link:
```
https://github.com/KierenDayStudios/Cordoval-OS/releases/latest
```

Users can download:
- **Installer:** `Cordoval OS-X.X.X-Setup.exe`
- **Portable:** `Cordoval OS-X.X.X-Portable.exe`

---

## 🎉 Need Help?

- Electron Builder Docs: https://www.electron.build/
- Electron Updater: https://www.electron.build/auto-update
- GitHub Releases: https://docs.github.com/en/repositories/releasing-projects-on-github

---

**Built with ❤️ by Kieren Day Studios**
