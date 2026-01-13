# 🌐 Website Release Guide - Cordoval OS

You have configured Cordoval OS to receive updates from your website:  
**`https://kierendaystudios.co.uk/downloads/cordoval-os/`**

## 1. Build the Release
Run the following command to build the Windows installer and update files:

```bash
npm run build:win
```

## 2. Locate Artifacts
After the build completes, look in the `release/{version}` folder (e.g., `release/1.0.0/`).
You will see several files, but you need these two:

1.  **`CordovalOS Setup 1.0.0.exe`** (The installer)
2.  **`latest.yml`** (The update manifest)

*(Note: `CordovalOS Setup 1.0.0.exe.blockmap` is also useful for differential updates but not strictly required if you just want it to work)*

## 3. Upload to Your Website
Upload **both files** to the exact URL path you configured.

Local File | URL on Server (Example)
--- | ---
`CordovalOS Setup 1.0.0.exe` | `https://kierendaystudios.co.uk/downloads/cordoval-os/CordovalOS%20Setup%201.0.0.exe`
`latest.yml` | `https://kierendaystudios.co.uk/downloads/cordoval-os/latest.yml`

## 4. Test It
1.  Install the app using the new `Setup.exe`.
2.  Increment version in `package.json` (e.g., `1.0.1`).
3.  Run `npm run build:win` again.
4.  Upload the new artifacts (`Setup 1.0.1.exe` and updated `latest.yml`).
5.  Open the installed app (v1.0.0). It should detect the update and download it.

## Troubleshooting
-   **App not updating?**
    -   Verify you can download `latest.yml` by visiting the URL in your browser.
    -   Check the app logs (Ctrl+Shift+I -> Console) for "update-not-available" or error messages.
    -   Ensure `latest.yml` contains the correct filename for the new `.exe`.
