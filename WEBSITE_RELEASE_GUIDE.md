# 🌐 Website Release & Update Guide - Cordoval OS

Cordoval OS is configured to receive updates directly from your website:
**`https://kierendaystudios.co.uk/downloads/cordoval-os/`**

## 1. Build the Release
Run the following command to generate the installer and update manifest:

```bash
npm run build:win
```

## 2. Locate Artifacts
After the build, check the `release/${version}` folder. You need these files:

1.  **`Cordoval OS Setup X.X.X.exe`**: The main installer.
2.  **`latest.yml`**: The critical update manifest file.

## 3. Upload to Your Server
Upload **both files** to your hosting at the path:
`/downloads/cordoval-os/`

| File | URL Location |
| --- | --- |
| `Cordoval OS Setup X.X.X.exe` | `https://kierendaystudios.co.uk/downloads/cordoval-os/Cordoval OS Setup X.X.X.exe` |
| `latest.yml` | `https://kierendaystudios.co.uk/downloads/cordoval-os/latest.yml` |

## 4. How the Update Works
1.  **Check**: Every time a user opens Cordoval OS, it checks `latest.yml` on your server.
2.  **Download**: If the version in `latest.yml` is higher than the installed version, it downloads the new `.exe` in the background.
3.  **UI Notification**: A "🚀 System Update" notification appears on the Cordoval Desktop.
4.  **Install**: When the user clicks "Restart & Update", the system installs the new version, keeping all user files intact.

## 5. Testing
1. Install an older version.
2. Upload a newer version + `latest.yml` to your site.
3. Open the old version; it should notify you of the update within seconds.
