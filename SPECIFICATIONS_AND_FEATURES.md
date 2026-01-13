# Cordoval OS - Specifications & Features

Welcome to the official documentation for **Cordoval OS**, a modern, web-based operating system environment built for productivity and business management. This document outlines the platform's capabilities, core features, and user guide.

## 1. Platform Overview
Cordoval OS is a simulated desktop environment built on web technologies (Electron/React). It provides a familiar, window-based interface designed to unify the KDS (Kieren Day Studios) ecosystem of tools into a single, cohesive workstation. It bridges the gap between web applications and native desktop experiences.

## 2. Core Features

### 🖥️ Desktop Experience
*   **Draggable Icons**: Users can fully customize their workspace by dragging desktop icons to any position.
    *   *Smart Positioning*: Icons automatically arrange themselves in a grid to avoid overlapping with the taskbar on startup.
    *   *Persistent Layout*: Icon positions are saved automatically; your layout remains intact between restarts.
*   **Dynamic Backgrounds**: Support for high-resolution web wallpapers and custom image URLs.

### 🪟 Advanced Window Management
*   **Multitasking**: Open multiple apps simultaneously in floating windows.
*   **Window Controls**: Minimize, Maximize, and Close standard controls.
*   **Intelligent Cascading**: New windows open in a cascading offset pattern to keep the workspace organized and prevent stacking.
*   **Boundary Protection**: built-in "Snap Protection" prevents windows from being dragged behind the taskbar or off-screen, ensuring apps are always accessible.
*   **Z-Index Management**: Clicking a window brings it to the front immediately.
*   **State Persistence**: Windows minimized to the taskbar are kept active in the background, preserving unsaved data, scroll positions, and running processes (like video playback).

### 🎨 Personalization
*   **Settings App**: A dedicated control panel for system customization.
*   **Accent Colors**: Choose from a palette of vibrant colors (Magenta, Purple, Blue, Teal, etc.) that theme the System Tray, Taskbar highlights, and Window accents instantly.
*   **Custom Wallpapers**: Paste any image URL to set it as your desktop background, or choose from curated presets.

### 🚀 Taskbar & Start Menu
*   **Glassmorphism Utility Bar**: A bottom taskbar featuring a Start button, open app indicators, and a system tray with clock/status.
*   **Smart Start Menu**: Categorized menu accessing "Productivity", "Development", "System", and "Store" apps.
*   **Minimize/Restore**: distinct interactions for minimizing windows to the taskbar and restoring them with a click.

## 3. Included Applications

### System Apps
1.  **File Explorer**: A virtual file system viewer allowing for file navigation and organization within the OS sandbox.
2.  **KDS Browser**: A native-feel web browser featuring:
    *   **Tabbed Browsing**: Open multiple sites in parallel.
    *   **History & Bookmarks**: Track your browsing and save favorites locally.
    *   **Navigation**: Full Back/Forward/Refresh controls and Search integration.
3.  **App Store**: A marketplace interface to "install" and "uninstall" web apps to your Start Menu and Desktop.
4.  **Settings**: Configuration hub for the OS.
5.  **Terminal / Calculator**: Access to system utilities (simulated or pass-through).

### KDS Ecosystem (Pre-installed)
*   **KDS Workspace**: Business productivity suite.
*   **KDS Founders OS**: Management dashboard.
*   **KDS Code**: Development environment.
*   **KDS Academy**: Educational resources.

## 4. How to Use Cordoval OS

### Organizing Your Desktop
*   **Move Icons**: Click and drag any icon. It will stick where you drop it.
*   **Reset**: If icons look cluttered, a system restart will re-align them into neat columns if they were overlapping critical areas.

### Customizing the Look
1.  Open the **Settings** app from the Desktop or Start Menu.
2.  Under **Personalization**, select a preset Wallpaper or paste a link to an image.
3.  Select an **Accent Color** to change the vibe of the OS.

### Installing New Apps
1.  Open the **App Store**.
2.  Browse categories like "Social", "Dev", or "Entertainment".
3.  Click **"Install"** on an app.
4.  The app will appear in your **Start Menu -> My Apps** section and on your desktop for quick access.

### Managing Windows
*   **Maximize**: Double-click the title bar or hit the square icon to go full screen.
*   **Move**: Drag by the title bar. The system will prevent you from losing the window behind the taskbar.
*   **Resize**: Grab any edge or corner of a window (when not maximized) to resize it.

## 5. Technical Specifications

*   **Core Engine**: Electron (Chromium + Node.js)
*   **Frontend Framework**: React 18 + TypeScript
*   **Build Tooling**: Vite (Fast HMR and bundling)
*   **Styling**: Vanilla CSS with CSS Variables for dynamic theming.
*   **Persistence**: `localStorage` backend for retaining user preferences, window states, and installed applications.
*   **Security**: Context isolation enabled; external content loaded via secure `<webview>` tags.
