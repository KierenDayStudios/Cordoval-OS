# 🚀 Quick Release Guide - Cordoval OS

## First Time Setup (5 minutes)

### 1. Create GitHub Repository
```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial release"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/cordoval-os.git
git push -u origin main
```

### 2. Get GitHub Token
1. Visit: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scope: `repo` (all)
4. Copy the token

### 3. Set Token (Do this before EVERY release)
**PowerShell:**
```powershell
$env:GH_TOKEN="ghp_your_token_here"
```

**CMD:**
```cmd
set GH_TOKEN=ghp_your_token_here
```

### 4. Update Configuration
Edit `electron-builder.yml` line 77-79:
```yaml
publish:
  provider: github
  owner: YOUR_GITHUB_USERNAME  # <- CHANGE THIS!
  repo: cordoval-os
```

---

## Every Release (2 commands)

### 1. Update Version
Edit `package.json`:
```json
"version": "1.0.1"  // Increment this number
```

### 2. Release
```bash
# Set token (if not already set this session)
$env:GH_TOKEN="your_token"

# Build and release
npm run release
```

**That's it!** Users will auto-update! ✨

---

## Local Testing Only

Build without publishing:
```bash
npm run build:win
```

Find installers in: `release/1.0.0/`

---

## File Sizes (Approximate)
- **Setup.exe**: ~150-250 MB (full installer)
- **Portable.exe**: ~150-250 MB (no installation needed)

---

## Sharing with Users

After release, share:
```
https://github.com/YOUR_USERNAME/cordoval-os/releases/latest
```

---

## Troubleshooting

**"GH_TOKEN is not set"**
→ Run: `$env:GH_TOKEN="your_token"`

**"Repository not found"**
→ Check GitHub username in `electron-builder.yml`

**Build fails**
→ Try: `npm install` then `npm run build:win`

---

## Quick Commands Reference

| Command | What it does |
|---------|-------------|
| `npm run dev` | Development mode |
| `npm run build:win` | Build locally (no publish) |
| `npm run release` | Build + Upload to GitHub |
| `npm run release:draft` | Build without publishing |

---

**Need full docs?** See `BUILD-GUIDE.md`
