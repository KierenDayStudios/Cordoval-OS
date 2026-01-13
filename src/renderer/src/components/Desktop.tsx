import React, { useState, useRef, useEffect } from 'react';
import '../App.css';
import { AppStore, STORE_APPS, StoreApp } from './AppStore';
import { FileExplorer } from './FileExplorer';
import { KDSBrowser } from './KDSBrowser';
import { Settings } from './Settings';
import { useUser } from '../context/UserContext';
import { Calculator } from './Calculator';
import { CalendarApp } from './Calendar';

// --- TypeScript Definitions ---
// (We can skip global declaration if it's already in env.d.ts or similar, but let's keep it safe)
declare global {
    interface Window {
        require: any;
    }
}

// --- CONFIGURATION: KDS ECOSYSTEM ---
const KDS_APPS = [
    // Productivity
    { id: 'workspace', name: 'KDS Workspace', url: 'https://workspace.kierendaystudios.co.uk/', icon: '💼', category: 'Productivity', description: 'Docs, slides, spreadsheets, notes and project management.', color: '#3b82f6', gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)' },
    { id: 'retbuild', name: 'Retbuild', url: 'https://retbuild.co.uk/', icon: '🛠️', category: 'Productivity', description: 'Build micro apps, software prototypes and ai agents with Google\'s Gemini.', color: '#10b981', gradient: 'linear-gradient(135deg, #10b981, #059669)' },
    { id: 'founders', name: 'KDS Founders OS', url: 'https://founders.kierendaystudios.co.uk/', icon: '🚀', category: 'Productivity', description: 'Manage business projects, ideas, links, tasks, roadmaps and more.', color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
    // Development
    { id: 'code', name: 'KDS Code', url: 'https://codestudio.kierendaystudios.co.uk/', icon: '💻', category: 'Development', description: 'Modern sleek IDE for creating web based applications and platforms.', color: '#0ea5e9', gradient: 'linear-gradient(135deg, #0ea5e9, #0284c7)' },
    { id: 'academy', name: 'KDS Web Academy', url: 'https://academy.kierendaystudios.co.uk/', icon: '🎓', category: 'Development', description: 'Learn how to build websites in HTML, CSS, and JS with a built-in IDE.', color: '#ef4444', gradient: 'linear-gradient(135deg, #ef4444, #dc2626)' },
    { id: 'gamedev', name: 'Game Dev Center', url: 'https://gamedev.kierendaystudios.co.uk/#/dashboard', icon: '🕹️', category: 'Development', description: 'Micro tools and submission route for KDS gaming platform.', color: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' },
    // Creative & Resources
    { id: 'stock', name: 'KDS Stock Images', url: 'https://stock.kierendaystudios.co.uk/', icon: '📸', category: 'Resources', description: 'Commercially free to use stock images.', color: '#6b7280', gradient: 'linear-gradient(135deg, #6b7280, #4b5563)' },
    { id: 'gaming', name: 'KDS Gaming', url: 'https://gaming.kierendaystudios.co.uk/#/dashboard', icon: '🎮', category: 'Resources', description: 'Indie gaming platform by KDS.', color: '#ec4899', gradient: 'linear-gradient(135deg, #ec4899, #db2777)' },
];

// --- HELPERS ---
const getStorageKey = (userId: string, key: string) => `${key}-${userId}`;

const loadIconPositions = (userId: string) => {
    try {
        const saved = localStorage.getItem(getStorageKey(userId, 'cordoval-icon-positions'));
        return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
};

const loadInstalledApps = (userId: string): string[] => {
    try {
        const saved = localStorage.getItem(getStorageKey(userId, 'cordoval-installed-apps'));
        return saved ? JSON.parse(saved) : [];
    } catch { return []; }
};

const loadSettings = (userId: string) => {
    try {
        const saved = localStorage.getItem(getStorageKey(userId, 'cordoval-settings'));
        return saved ? JSON.parse(saved) : {
            wallpaper: "wallpapers/serene_morning.png",
            accentColor: "#d946ef",
            zoom: 1.0
        };
    } catch {
        return {
            wallpaper: "wallpapers/serene_morning.png",
            accentColor: "#d946ef",
            zoom: 1.0
        };
    }
}

// --- TYPES ---
interface WindowState {
    id: string; title: string; icon: string; component: React.ReactNode;
    x: number; y: number; width: number; height: number; zIndex: number; isMinimized: boolean;
    isMaximized: boolean;
    restoreState?: { x: number; y: number; width: number; height: number };
}

interface DesktopItem {
    id: string; title: string; icon: string; action: () => void;
}

// --- MAIN DESKTOP COMPONENT ---
export const Desktop = () => {
    const { currentUser, logout } = useUser();
    const userId = currentUser!.id;

    const [windows, setWindows] = useState<WindowState[]>([]);
    const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
    const [showStartMenu, setShowStartMenu] = useState(false);
    const [highestZ, setHighestZ] = useState(100);

    // Scoped State
    const [installedApps, setInstalledApps] = useState<string[]>(() => loadInstalledApps(userId));
    const userSettings = loadSettings(userId);
    const [wallpaper, setWallpaper] = useState(userSettings.wallpaper);
    const [accentColor, setAccentColor] = useState(userSettings.accentColor);
    const [zoom, setZoom] = useState(userSettings.zoom || 1.0);
    const [iconPositions, setIconPositions] = useState<Record<string, { x: number, y: number }>>(() => loadIconPositions(userId));

    // --- Update Manager State ---
    const [updateInfo, setUpdateInfo] = useState<{ status: string; version?: string; percent?: number; message?: string } | null>(null);
    const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);

    // --- Effects for Persistence ---
    useEffect(() => {
        document.documentElement.style.setProperty('--accent-color', accentColor);
        // Save Settings
        localStorage.setItem(getStorageKey(userId, 'cordoval-settings'), JSON.stringify({ wallpaper, accentColor, zoom }));

        // Apply Zoom factor if in Electron
        try {
            const { webFrame } = window.require('electron');
            if (webFrame) {
                webFrame.setZoomFactor(zoom);
            }
        } catch (e) {
            // Not in electron or webFrame disallowed
            document.body.style.zoom = zoom.toString();
        }
    }, [accentColor, wallpaper, zoom, userId]);

    useEffect(() => {
        localStorage.setItem(getStorageKey(userId, 'cordoval-icon-positions'), JSON.stringify(iconPositions));
    }, [iconPositions, userId]);

    useEffect(() => {
        localStorage.setItem(getStorageKey(userId, 'cordoval-installed-apps'), JSON.stringify(installedApps));
    }, [installedApps, userId]);

    // --- Update Listener ---
    useEffect(() => {
        try {
            const { ipcRenderer } = window.require('electron');
            if (!ipcRenderer) return;

            const handleUpdate = (_event: any, info: any) => {
                console.log('Update Status Received:', info);
                setUpdateInfo(info);
                if (info.status === 'available' || info.status === 'downloaded') {
                    setShowUpdatePrompt(true);
                }
            };

            ipcRenderer.on('update-status', handleUpdate);
            return () => {
                ipcRenderer.removeListener('update-status', handleUpdate);
            };
        } catch (e) {
            console.warn("Update listener failed: not in electron environment.");
            return;
        }
    }, []);

    const handleUpdateAction = async (action: 'download' | 'install' | 'check') => {
        const { ipcRenderer } = window.require('electron');
        if (action === 'download') {
            await ipcRenderer.invoke('download-update');
        } else if (action === 'install') {
            await ipcRenderer.invoke('install-update');
        } else if (action === 'check') {
            await ipcRenderer.invoke('check-for-updates');
        }
    };


    // Get installed store apps for display
    const getInstalledStoreApps = () => {
        return STORE_APPS.filter(app => installedApps.includes(app.id));
    };

    // --- App Store Actions ---
    const handleInstallApp = (app: StoreApp) => {
        if (!installedApps.includes(app.id)) {
            setInstalledApps([...installedApps, app.id]);
        }
    };

    const handleUninstallApp = (appId: string) => {
        setInstalledApps(installedApps.filter(id => id !== appId));
        closeWindow(appId);
    };

    const handleOpenStoreApp = (app: StoreApp) => {
        openApp(app.id, app.name, app.icon, <WebFrame url={app.url} />);
    };

    const openAppStore = () => {
        const existingStore = windows.find(w => w.id === 'appstore');
        if (existingStore) { focusWindow('appstore'); return; }

        openApp('appstore', 'App Store', '🏪',
            <AppStore
                installedApps={installedApps}
                onInstallApp={handleInstallApp}
                onUninstallApp={handleUninstallApp}
                onOpenApp={handleOpenStoreApp}
            />
        );
    };

    // Keep components updated with latest state
    useEffect(() => {
        setWindows(prevWindows => prevWindows.map(w => {
            if (w.id === 'appstore') {
                return {
                    ...w,
                    component: (
                        <AppStore
                            installedApps={installedApps}
                            onInstallApp={handleInstallApp}
                            onUninstallApp={handleUninstallApp}
                            onOpenApp={handleOpenStoreApp}
                        />
                    )
                };
            }
            if (w.id === 'settings') {
                return {
                    ...w,
                    component: (
                        <Settings
                            currentWallpaper={wallpaper}
                            setWallpaper={setWallpaper}
                            currentAccentColor={accentColor}
                            setAccentColor={setAccentColor}
                            currentZoom={zoom}
                            setZoom={setZoom}
                            currentUpdateStatus={updateInfo}
                            onCheckUpdate={() => handleUpdateAction('check')}
                            onDownloadUpdate={() => handleUpdateAction('download')}
                            onInstallUpdate={() => handleUpdateAction('install')}
                        />
                    )
                }
            }
            return w;
        }));
    }, [installedApps, wallpaper, accentColor, updateInfo]);

    // --- Window Actions ---
    const openApp = (appId: string, title: string, icon: string, component: React.ReactNode) => {
        setShowStartMenu(false);
        if (windows.find(w => w.id === appId)) { focusWindow(appId); return; }

        const cascadeCount = windows.length;
        const offset = (cascadeCount % 12) * 30;
        const startX = 100 + offset;
        const startY = 50 + offset;

        const newWindow: WindowState = {
            id: appId, title, icon, component,
            x: startX, y: startY,
            width: 1100, height: 750, zIndex: highestZ + 1, isMinimized: false, isMaximized: false
        };

        setHighestZ(prev => prev + 1);
        setWindows([...windows, newWindow]);
        setActiveWindowId(appId);
    };

    const openKdsApp = (app: typeof KDS_APPS[0]) => {
        openApp(app.id, app.name, app.icon, <WebFrame url={app.url} />);
    };

    const closeWindow = (id: string) => {
        setWindows(windows.filter(w => w.id !== id));
        if (activeWindowId === id) setActiveWindowId(null);
    };

    const focusWindow = (id: string) => {
        const win = windows.find(w => w.id === id);
        if (!win) return;
        const newZ = highestZ + 1;
        setHighestZ(newZ);
        setWindows(windows.map(w => w.id === id ? { ...w, zIndex: newZ, isMinimized: false } : w));
        setActiveWindowId(id);
    };

    const toggleMinimize = (id: string) => {
        setWindows(windows.map(w => w.id === id ? { ...w, isMinimized: !w.isMinimized } : w));
    };

    const toggleMaximize = (id: string) => {
        setWindows(windows.map(w => {
            if (w.id !== id) return w;
            if (w.isMaximized) {
                return {
                    ...w,
                    isMaximized: false,
                    x: w.restoreState?.x ?? w.x,
                    y: w.restoreState?.y ?? w.y,
                    width: w.restoreState?.width ?? w.width,
                    height: w.restoreState?.height ?? w.height,
                };
            } else {
                return {
                    ...w,
                    isMaximized: true,
                    restoreState: { x: w.x, y: w.y, width: w.width, height: w.height },
                    x: 0,
                    y: 0,
                    width: window.innerWidth,
                    height: window.innerHeight - 50,
                };
            }
        }));
    };

    const updateWindowBounds = (id: string, bounds: Partial<Pick<WindowState, 'x' | 'y' | 'width' | 'height'>>) => {
        setWindows(windows.map(w => w.id === id ? { ...w, ...bounds } : w));
    };

    const launchExe = (cmd: string) => {
        try { window.require('child_process').exec(cmd); setShowStartMenu(false); } catch (e) { console.error("Not running in Electron environment"); }
    };

    const openKDSBrowser = (initialUrl?: string) => {
        const browserId = 'kds-browser';
        const existingBrowser = windows.find(w => w.id === browserId);
        if (existingBrowser) { focusWindow(browserId); return; }
        openApp(browserId, 'KDS Browser', '🌐', <KDSBrowser initialUrl={initialUrl} />);
    };

    const openFileExplorer = () => {
        const explorerId = 'file-explorer';
        const existingExplorer = windows.find(w => w.id === explorerId);
        if (existingExplorer) { focusWindow(explorerId); return; }
        openApp(explorerId, 'File Explorer', '📁', <FileExplorer />);
    };

    const openCalculator = () => {
        const calcId = 'calculator';
        if (windows.find(w => w.id === calcId)) { focusWindow(calcId); return; }
        openApp(calcId, 'Calculator', '🧮', <Calculator />);
    };

    const openCalendarApp = () => {
        const calId = 'calendar-app';
        if (windows.find(w => w.id === calId)) { focusWindow(calId); return; }
        openApp(calId, 'Calendar', '📅', <CalendarApp />);
    };

    const openSettings = () => {
        const settingsId = 'settings';
        if (windows.find(w => w.id === settingsId)) { focusWindow(settingsId); return; }
        openApp(settingsId, 'Settings', '⚙️',
            <Settings
                currentWallpaper={wallpaper}
                setWallpaper={setWallpaper}
                currentAccentColor={accentColor}
                setAccentColor={setAccentColor}
                currentZoom={zoom}
                setZoom={setZoom}
                currentUpdateStatus={updateInfo}
                onCheckUpdate={() => handleUpdateAction('check')}
                onDownloadUpdate={() => handleUpdateAction('download')}
                onInstallUpdate={() => handleUpdateAction('install')}
            />
        );
    };

    const getDesktopItems = (): DesktopItem[] => {
        const items: DesktopItem[] = [
            { id: 'kds-browser', title: 'KDS Browser', icon: '🌐', action: () => openKDSBrowser() },
            { id: 'file-explorer', title: 'File Explorer', icon: '📁', action: openFileExplorer },
            { id: 'app-store', title: 'App Store', icon: '🏪', action: openAppStore },
        ];

        // Add all KDS Apps to the desktop by default as they are standard work tools
        KDS_APPS.forEach(app => {
            items.push({ id: app.id, title: app.name, icon: app.icon, action: () => openKdsApp(app), gradient: app.gradient } as any);
        });

        getInstalledStoreApps().forEach(app => {
            items.push({ id: app.id, title: app.name, icon: app.icon, action: () => handleOpenStoreApp(app) });
        });
        items.push({ id: 'settings', title: 'Settings', icon: '⚙️', action: openSettings });
        return items;
    };

    const updateIconPosition = (id: string, x: number, y: number) => {
        setIconPositions(prev => ({ ...prev, [id]: { x, y } }));
    };

    // --- HOST APP SCANNER ---
    const [hostApps, setHostApps] = useState<{ name: string, path: string }[]>([]);

    useEffect(() => {
        const scanHostApps = async () => {
            try {
                const fs = window.require('fs');
                const path = window.require('path');
                const os = window.require('os');

                const dirs = [
                    'C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs',
                    path.join(os.homedir(), 'AppData\\Roaming\\Microsoft\\Windows\\Start Menu\\Programs')
                ];

                let apps: { name: string, path: string }[] = [];

                dirs.forEach(dir => {
                    if (fs.existsSync(dir)) {
                        const files = fs.readdirSync(dir);
                        files.forEach((file: string) => {
                            if (file.endsWith('.lnk')) {
                                apps.push({ name: file.replace('.lnk', ''), path: path.join(dir, file) });
                            }
                        });
                    }
                });

                setHostApps(apps);
            } catch (e) {
                console.error("Failed to scan host apps", e);
            }
        };

        scanHostApps();
    }, []);

    const launchHostApp = (appPath: string) => {
        try {
            const { shell } = window.require('electron');
            shell.openPath(appPath);
            setShowStartMenu(false);
        } catch (e) {
            console.error(e);
        }
    };

    // --- SYSTEM TRAY STATE ---
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isMuted, setIsMuted] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        const timer = setInterval(() => setCurrentTime(new Date()), 1000);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(timer);
        };
    }, []);

    return (
        <div className="desktop" style={{ backgroundImage: `url(${wallpaper})` }} onClick={() => setShowStartMenu(false)}>
            {/* Update Manager Prompt */}
            {showUpdatePrompt && updateInfo && (
                <div style={{
                    position: 'fixed', bottom: 80, right: 30, width: 320, zIndex: 10000,
                    background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)',
                    padding: 20, borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.2)', color: '#333',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>🚀 System Update</span>
                        <button onClick={() => setShowUpdatePrompt(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', opacity: 0.5 }}>✕</button>
                    </div>

                    {updateInfo.status === 'available' && (
                        <>
                            <p style={{ fontSize: 13, marginBottom: 15 }}>A new version (v{updateInfo.version}) is available. Would you like to download it?</p>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleUpdateAction('download'); }}
                                style={{ width: '100%', padding: '8px', borderRadius: 6, background: accentColor, color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                            >
                                Download Update
                            </button>
                        </>
                    )}

                    {updateInfo.status === 'downloading' && (
                        <>
                            <p style={{ fontSize: 12, marginBottom: 10 }}>Downloading update... {Math.round(updateInfo.percent || 0)}%</p>
                            <div style={{ width: '100%', height: 6, background: '#eee', borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{ width: `${updateInfo.percent}%`, height: '100%', background: accentColor, transition: '0.3s' }} />
                            </div>
                        </>
                    )}

                    {updateInfo.status === 'downloaded' && (
                        <>
                            <p style={{ fontSize: 13, marginBottom: 15 }}>Update v{updateInfo.version} is ready to install. The system will restart.</p>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleUpdateAction('install'); }}
                                style={{ width: '100%', padding: '8px', borderRadius: 6, background: accentColor, color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                            >
                                Restart & Update
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* Desktop Content Area */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 'calc(100% - 50px)', overflow: 'hidden' }}>
                {getDesktopItems().map((item, index) => (
                    <DraggableDesktopIcon
                        key={item.id}
                        item={item}
                        index={index}
                        position={iconPositions[item.id]}
                        onUpdatePosition={updateIconPosition}
                    />
                ))}

                {/* Noah AI Assistant Widget replaces old widgets */}
                <NoahWidget
                    openAppStore={openAppStore}
                    openBrowser={openKDSBrowser}
                    openFiles={openFileExplorer}
                    openSettings={openSettings}
                    accentColor={accentColor}
                />
            </div>

            {windows.map(win => (
                <DraggableWindow key={win.id} windowState={win} isActive={activeWindowId === win.id}
                    onFocus={() => focusWindow(win.id)} onClose={() => closeWindow(win.id)}
                    onMinimize={() => toggleMinimize(win.id)} onMaximize={() => toggleMaximize(win.id)}
                    onUpdateBounds={(bounds) => updateWindowBounds(win.id, bounds)}
                />
            ))}

            {showStartMenu && (
                <div className="start-menu" onClick={(e) => e.stopPropagation()}>
                    <div className="start-menu-content">
                        <div className="start-search-container">
                            <input
                                type="text"
                                className="start-search-input"
                                placeholder="Search apps, settings, or files..."
                                autoFocus
                            />
                        </div>

                        <div className="start-menu-scroll">
                            <div className="start-apps-grid-title">Standard Tools</div>
                            <div className="start-apps-grid">
                                <StartAppItem name="App Store" icon="🏪" onClick={openAppStore} />
                                <StartAppItem name="Browser" icon="🌐" onClick={() => openKDSBrowser()} />
                                <StartAppItem name="Files" icon="📁" onClick={openFileExplorer} />
                                <StartAppItem name="Settings" icon="⚙️" onClick={openSettings} />
                            </div>

                            <div className="start-apps-grid-title" style={{ marginTop: 25 }}>KDS Ecosystem</div>
                            <div className="start-apps-grid">
                                {KDS_APPS.map(app => (
                                    <StartAppItem key={app.id} name={app.name} icon={app.icon} onClick={() => openKdsApp(app)} gradient={app.gradient} />
                                ))}
                            </div>

                            {getInstalledStoreApps().length > 0 && (
                                <>
                                    <div className="start-apps-grid-title" style={{ marginTop: 25 }}>Recently Installed</div>
                                    <div className="start-apps-grid">
                                        {getInstalledStoreApps().map(app => (
                                            <StartAppItem key={app.id} name={app.name} icon={app.icon} onClick={() => handleOpenStoreApp(app)} />
                                        ))}
                                    </div>
                                </>
                            )}

                            {hostApps.length > 0 && (
                                <>
                                    <div className="start-apps-grid-title" style={{ marginTop: 25 }}>Host Windows Apps</div>
                                    <div className="start-apps-grid">
                                        {hostApps.map(app => (
                                            <StartAppItem key={app.path} name={app.name} icon="🪟" onClick={() => launchHostApp(app.path)} />
                                        ))}
                                    </div>
                                </>
                            )}

                            <div className="start-apps-grid-title" style={{ marginTop: 25 }}>System Utilities</div>
                            <div className="start-apps-grid">
                                <StartAppItem name="Calculator" icon="🧮" onClick={openCalculator} />
                                <StartAppItem name="Calendar" icon="📅" onClick={openCalendarApp} />
                                <StartAppItem name="CMD" icon="💻" onClick={() => launchExe('start cmd.exe')} />
                            </div>
                        </div>

                        <div className="start-footer">
                            <div className="user-profile">
                                <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'linear-gradient(135deg, var(--accent-color), #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{currentUser?.avatar}</div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: 13, fontWeight: 600 }}>{currentUser?.name}</span>
                                    <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.4)' }}>Business Professional</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button className="logout-btn" onClick={logout} style={{ background: 'transparent', border: 'none', color: '#ff4757', padding: '8px', cursor: 'pointer', fontSize: 20, transition: 'transform 0.2s' }} title="Log Out">⏻</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="taskbar" onClick={(e) => e.stopPropagation()}>
                <div className={`taskbar-icon ${showStartMenu ? 'active' : ''}`} onClick={() => setShowStartMenu(!showStartMenu)}
                    style={{ fontSize: 26, color: 'white', background: '#000', borderRadius: '50%', width: 42, height: 42 }}>
                    💠
                </div>
                {windows.map(win => (
                    <div key={win.id} className={`taskbar-icon ${activeWindowId === win.id && !win.isMinimized ? 'active' : ''}`}
                        onClick={() => win.isMinimized ? focusWindow(win.id) : toggleMinimize(win.id)}>
                        <span style={{ fontSize: 22 }}>{win.icon}</span>
                    </div>
                ))}

                <div className="system-tray">
                    <span
                        title={isOnline ? "Online" : "Offline"}
                        style={{ cursor: 'help', opacity: 0.8, fontSize: 16 }}
                    >
                        {isOnline ? '📶' : '⚠️'}
                    </span>
                    <span
                        onClick={() => setIsMuted(!isMuted)}
                        style={{ cursor: 'pointer', minWidth: 20, textAlign: 'center', opacity: 0.8, fontSize: 16 }}
                        title={isMuted ? "Unmute" : "Mute"}
                    >
                        {isMuted ? '🔇' : '🔊'}
                    </span>
                    <span style={{ color: '#333', fontWeight: 600, fontSize: '13px', marginLeft: 5 }}>
                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            </div>
        </div>
    );
};

// --- SUB COMPONENTS (Re-used) ---
// DraggableWidget removed

const WebFrame = ({ url }: { url: string }) => (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'white', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#888', zIndex: 0 }}>
            Connecting to {url}...
        </div>
        {/* @ts-ignore */}
        <webview
            src={url}
            style={{ width: '100%', height: '100%', flex: 1, border: 'none', position: 'relative', zIndex: 10 }}
            allowpopups={true}
            useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        ></webview>
    </div>
);

const AppIcon = ({ icon, gradient, size = 48, className }: { icon: string, gradient?: string, size?: number, className?: string }) => (
    <div className={className} style={{
        width: size,
        height: size,
        borderRadius: Math.floor(size * 0.28),
        background: gradient || 'rgba(255,255,255,0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: Math.floor(size * 0.5),
        boxShadow: gradient ? '0 4px 15px rgba(0,0,0,0.3)' : 'none',
        border: '1px solid rgba(255,255,255,0.1)',
        flexShrink: 0,
        transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
    }}>
        <span style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>{icon}</span>
    </div>
);

function StartAppItem({ name, icon, onClick, gradient }: { name: string, icon: string, onClick: () => void, gradient?: string }) {
    return (
        <div className="start-app-item" onClick={onClick}>
            <AppIcon icon={icon} gradient={gradient} size={70} className="start-app-icon" />
            <div className="start-app-name">{name}</div>
        </div>
    );
}

const DraggableDesktopIcon = ({ item, index, position, onUpdatePosition }: any) => {
    const taskbarHeight = 50;
    const startY = 30;
    const itemHeight = 110;
    const itemWidth = 100;

    const availableHeight = window.innerHeight - taskbarHeight - startY;
    const itemsPerColumn = Math.floor(availableHeight / itemHeight) || 1;

    const colIndex = Math.floor(index / itemsPerColumn);
    const rowIndex = index % itemsPerColumn;

    const defaultX = 30 + (colIndex * itemWidth);
    const defaultY = startY + (rowIndex * itemHeight);

    const currentX = position ? position.x : defaultX;
    const currentY = position ? position.y : defaultY;

    const [isDragging, setIsDragging] = useState(false);
    const dragOffset = useRef({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsDragging(true);
        dragOffset.current = { x: e.clientX - currentX, y: e.clientY - currentY };
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            let newX = e.clientX - dragOffset.current.x;
            let newY = e.clientY - dragOffset.current.y;

            if (newX < 0) newX = 0;
            if (newX > window.innerWidth - 85) newX = window.innerWidth - 85;

            const taskbarHeight = 50;
            const iconHeight = 100;
            if (newY < 0) newY = 0;
            if (newY > window.innerHeight - taskbarHeight - iconHeight) newY = window.innerHeight - taskbarHeight - iconHeight;

            onUpdatePosition(item.id, newX, newY);
        };

        const handleMouseUp = () => {
            if (isDragging) {
                setIsDragging(false);
            }
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, item.id]);

    const handleClick = () => {
        if (!isDragging) {
            item.action();
        }
    };

    return (
        <div
            onMouseDown={handleMouseDown}
            onClick={handleClick}
            style={{
                position: 'absolute',
                left: currentX,
                top: currentY,
                width: 85,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                cursor: 'pointer', padding: 8, borderRadius: 6,
                textShadow: '0 1px 3px black',
                zIndex: isDragging ? 9999 : 1
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
            <AppIcon icon={item.icon} gradient={item.gradient} size={64} />
            <div style={{ fontSize: 12, textAlign: 'center', fontWeight: 600, lineHeight: 1.2, userSelect: 'none', pointerEvents: 'none', color: 'white' }}>{item.title}</div>
        </div>
    );
};

const DraggableWindow = ({ windowState, isActive, onFocus, onClose, onMinimize, onMaximize, onUpdateBounds }: any) => {
    const [pos, setPos] = useState({ x: windowState.x, y: windowState.y });
    const [size, setSize] = useState({ width: windowState.width, height: windowState.height });
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState<string | null>(null);
    const dragOffset = useRef({ x: 0, y: 0 });
    const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0, startX: 0, startY: 0 });

    useEffect(() => {
        setPos({ x: windowState.x, y: windowState.y });
        setSize({ width: windowState.width, height: windowState.height });
    }, [windowState.isMaximized, windowState.x, windowState.y, windowState.width, windowState.height]);

    // if (windowState.isMinimized) return null;

    const handleMouseDown = (e: React.MouseEvent) => {
        if (windowState.isMaximized) return;
        onFocus();
        setIsDragging(true);
        dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    };

    const handleResizeStart = (e: React.MouseEvent, direction: string) => {
        e.stopPropagation();
        onFocus();
        setIsResizing(direction);
        resizeStart.current = {
            x: pos.x,
            y: pos.y,
            width: size.width,
            height: size.height,
            startX: e.clientX,
            startY: e.clientY,
        };
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                let newX = e.clientX - dragOffset.current.x;
                let newY = e.clientY - dragOffset.current.y;

                const taskbarHeight = 50;

                // Vertical Constraints
                if (newY < 0) newY = 0;
                const maxY = window.innerHeight - taskbarHeight - 30;
                if (newY > maxY) newY = maxY;

                // Horizontal Constraints
                if (newX < 0) newX = 0;
                const maxX = Math.max(0, window.innerWidth - size.width);
                if (newX > maxX) newX = maxX;

                setPos({ x: newX, y: newY });
            }

            if (isResizing) {
                const deltaX = e.clientX - resizeStart.current.startX;
                const deltaY = e.clientY - resizeStart.current.startY;
                const minWidth = 300;
                const minHeight = 200;

                let newX = resizeStart.current.x;
                let newY = resizeStart.current.y;
                let newWidth = resizeStart.current.width;
                let newHeight = resizeStart.current.height;

                if (isResizing.includes('e')) {
                    newWidth = Math.max(minWidth, resizeStart.current.width + deltaX);
                }
                if (isResizing.includes('w')) {
                    const proposedWidth = resizeStart.current.width - deltaX;
                    if (proposedWidth >= minWidth) {
                        newWidth = proposedWidth;
                        newX = resizeStart.current.x + deltaX;
                    }
                }
                if (isResizing.includes('s')) {
                    newHeight = Math.max(minHeight, resizeStart.current.height + deltaY);
                }
                if (isResizing.includes('n')) {
                    const proposedHeight = resizeStart.current.height - deltaY;
                    if (proposedHeight >= minHeight) {
                        newHeight = proposedHeight;
                        newY = resizeStart.current.y + deltaY;
                    }
                }

                setPos({ x: newX, y: newY });
                setSize({ width: newWidth, height: newHeight });
            }
        };

        const handleMouseUp = () => {
            if (isDragging) {
                setIsDragging(false);
                onUpdateBounds({ x: pos.x, y: pos.y });
            }
            if (isResizing) {
                setIsResizing(null);
                onUpdateBounds({ x: pos.x, y: pos.y, width: size.width, height: size.height });
            }
        };

        if (isDragging || isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, isResizing, pos, size]);

    const resizeHandleStyle = (): React.CSSProperties => ({
        position: 'absolute',
        background: 'transparent',
        zIndex: 10,
    });

    return (
        <div className="os-window" style={{
            left: pos.x, top: pos.y, width: size.width, height: size.height, zIndex: windowState.zIndex,
            display: windowState.isMinimized ? 'none' : 'flex',
            boxShadow: isActive ? '0 25px 80px rgba(0,0,0,0.7)' : '0 10px 30px rgba(0,0,0,0.5)',
            borderColor: isActive ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'
        }} onMouseDown={onFocus}>

            {!windowState.isMaximized && (
                <>
                    <div style={{ ...resizeHandleStyle(), top: 0, left: 0, right: 0, height: 4, cursor: 'n-resize' }}
                        onMouseDown={(e) => handleResizeStart(e, 'n')} />
                    <div style={{ ...resizeHandleStyle(), bottom: 0, left: 0, right: 0, height: 4, cursor: 's-resize' }}
                        onMouseDown={(e) => handleResizeStart(e, 's')} />
                    <div style={{ ...resizeHandleStyle(), left: 0, top: 0, bottom: 0, width: 4, cursor: 'w-resize' }}
                        onMouseDown={(e) => handleResizeStart(e, 'w')} />
                    <div style={{ ...resizeHandleStyle(), right: 0, top: 0, bottom: 0, width: 4, cursor: 'e-resize' }}
                        onMouseDown={(e) => handleResizeStart(e, 'e')} />

                    <div style={{ ...resizeHandleStyle(), top: 0, left: 0, width: 8, height: 8, cursor: 'nw-resize' }}
                        onMouseDown={(e) => handleResizeStart(e, 'nw')} />
                    <div style={{ ...resizeHandleStyle(), top: 0, right: 0, width: 8, height: 8, cursor: 'ne-resize' }}
                        onMouseDown={(e) => handleResizeStart(e, 'ne')} />
                    <div style={{ ...resizeHandleStyle(), bottom: 0, left: 0, width: 8, height: 8, cursor: 'sw-resize' }}
                        onMouseDown={(e) => handleResizeStart(e, 'sw')} />
                    <div style={{ ...resizeHandleStyle(), bottom: 0, right: 0, width: 8, height: 8, cursor: 'se-resize' }}
                        onMouseDown={(e) => handleResizeStart(e, 'se')} />
                </>
            )}

            <div className="window-titlebar" onMouseDown={handleMouseDown} onDoubleClick={onMaximize}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#ddd' }}>
                    <span>{windowState.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.5 }}>{windowState.title}</span>
                </div>
                <div className="window-controls" onMouseDown={e => e.stopPropagation()}>
                    <div className="control-btn" onClick={onMinimize}>─</div>
                    <div className="control-btn" onClick={onMaximize}>{windowState.isMaximized ? '❐' : '□'}</div>
                    <div className="control-btn close" onClick={onClose}>✕</div>
                </div>
            </div>
            <div className="window-content">{windowState.component}</div>
        </div>
    );
};
const NoahWidget = ({ openAppStore, openBrowser, openFiles, openSettings, accentColor }: any) => {
    const [apiKey, setApiKey] = useState(() => localStorage.getItem('noah-api-key') || '');
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<{ role: 'user' | 'noah', content: string }[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showKeyInput, setShowKeyInput] = useState(!apiKey);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const saveApiKey = () => {
        localStorage.setItem('noah-api-key', apiKey);
        setShowKeyInput(false);
    };

    const handleSend = async () => {
        if (!input.trim() || !apiKey) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `You are Noah, the AI for Cordoval OS. Help the user. 
                            If the user wants to open an app, use these exact codes in your response: 
                            [OPEN:APPSTORE] to open the store, 
                            [OPEN:BROWSER] to open web browser, 
                            [OPEN:FILES] to open file explorer, 
                            [OPEN:SETTINGS] to open settings.
                            
                            The user can also ask you to correct spelling or rewrite things. Be concise.
                            
                            User message: ${userMsg}`
                        }]
                    }]
                })
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error.message || "API Error");
            }

            const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't process that.";

            // Handle system commands
            if (reply.includes('[OPEN:APPSTORE]')) openAppStore();
            if (reply.includes('[OPEN:BROWSER]')) openBrowser();
            if (reply.includes('[OPEN:FILES]')) openFiles();
            if (reply.includes('[OPEN:SETTINGS]')) openSettings();

            setMessages(prev => [...prev, { role: 'noah', content: reply.replace(/\[OPEN:.*\]/g, '').trim() }]);
        } catch (error: any) {
            setMessages(prev => [...prev, { role: 'noah', content: `Error: ${error.message || "Something went wrong"}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            position: 'absolute', bottom: 100, right: 30, width: 320, height: 420,
            background: 'rgba(255, 255, 255, 0.75)', backdropFilter: 'blur(40px)',
            borderRadius: 24, padding: 0, color: '#333', border: '1px solid rgba(255, 255, 255, 0.5)',
            boxShadow: '0 15px 45px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', overflow: 'hidden'
        }}>
            <div style={{ padding: '15px 20px', background: 'rgba(255,255,255,0.4)', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: accentColor }}></div>
                    <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: 0.5 }}>NOAH AI</span>
                </div>
                <button onClick={() => setShowKeyInput(!showKeyInput)} style={{ background: 'none', border: 'none', fontSize: 14, cursor: 'pointer', opacity: 0.5 }}>🔑</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '15px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {showKeyInput ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.6 }}>ENTER GEMINI API KEY</span>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="Paste key here..."
                            style={{ padding: '10px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.5)' }}
                        />
                        <button onClick={saveApiKey} style={{ padding: '10px', borderRadius: 10, background: accentColor, color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Connect Noah</button>
                        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ fontSize: 10, textAlign: 'center', color: accentColor, textDecoration: 'none' }}>Get a free key here</a>
                    </div>
                ) : (
                    <>
                        {messages.length === 0 && (
                            <div style={{ textAlign: 'center', marginTop: 100, opacity: 0.3 }}>
                                <div style={{ fontSize: 40, marginBottom: 10 }}>🤖</div>
                                <div style={{ fontSize: 13, fontWeight: 600 }}>How can I help you today?</div>
                            </div>
                        )}
                        {messages.map((msg, i) => (
                            <div key={i} style={{
                                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                maxWidth: '85%',
                                padding: '10px 14px',
                                borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                background: msg.role === 'user' ? accentColor : 'rgba(255,255,255,0.8)',
                                color: msg.role === 'user' ? 'white' : '#333',
                                fontSize: 12,
                                fontWeight: 500,
                                boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                            }}>
                                {msg.content}
                            </div>
                        ))}
                        {isLoading && <div style={{ fontSize: 11, opacity: 0.5 }}>Noah is thinking...</div>}
                        <div ref={chatEndRef} />
                    </>
                )}
            </div>

            {!showKeyInput && (
                <div style={{ padding: '15px', display: 'flex', gap: 10 }}>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type a request..."
                        style={{ flex: 1, padding: '10px 15px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.05)', background: 'rgba(255,255,255,0.8)', outline: 'none', fontSize: 12 }}
                    />
                    <button
                        onClick={handleSend}
                        style={{ width: 36, height: 36, borderRadius: 12, background: accentColor, color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        🚀
                    </button>
                </div>
            )}
        </div>
    );
};

