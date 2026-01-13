import React, { useState, useRef, useEffect } from 'react';
import '../App.css';
import { AppStore, STORE_APPS, StoreApp } from './AppStore';
import { FileExplorer } from './FileExplorer';
import { KDSBrowser } from './KDSBrowser';
import { Settings } from './Settings';
import { useUser } from '../context/UserContext';
import { Calculator } from './Calculator';
import { CalendarApp } from './Calendar';
import { ModernIcon } from './ModernIcon';
import { NoahAssistant } from './NoahAssistant';


// --- TypeScript Definitions ---
declare global {
    interface Window {
        require: any;
    }
}

// --- CONFIGURATION: KDS ECOSYSTEM ---
const KDS_APPS = [
    { id: 'workspace', name: 'KDS Workspace', url: 'https://workspace.kierendaystudios.co.uk/', icon: 'workspace', category: 'Productivity', description: 'Docs, slides, spreadsheets, notes and project management.', color: '#3b82f6', gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)' },
    { id: 'retbuild', name: 'Retbuild', url: 'https://retbuild.co.uk/', icon: 'retbuild', category: 'Productivity', description: 'Build micro apps, software prototypes and ai agents with Google\'s Gemini.', color: '#10b981', gradient: 'linear-gradient(135deg, #10b981, #059669)' },
    { id: 'founders', name: 'KDS Founders OS', url: 'https://founders.kierendaystudios.co.uk/', icon: 'founders', category: 'Productivity', description: 'Manage business projects, ideas, links, tasks, roadmaps and more.', color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
    { id: 'code', name: 'KDS Code', url: 'https://codestudio.kierendaystudios.co.uk/', icon: 'code', category: 'Development', description: 'Modern sleek IDE for creating web based applications and platforms.', color: '#0ea5e9', gradient: 'linear-gradient(135deg, #0ea5e9, #0284c7)' },
    { id: 'academy', name: 'KDS Web Academy', url: 'https://academy.kierendaystudios.co.uk/', icon: 'academy', category: 'Development', description: 'Learn how to build websites in HTML, CSS, and JS with a built-in IDE.', color: '#ef4444', gradient: 'linear-gradient(135deg, #ef4444, #dc2626)' },
    { id: 'gamedev', name: 'Game Dev Center', url: 'https://gamedev.kierendaystudios.co.uk/#/dashboard', icon: 'gamedev', category: 'Development', description: 'Indie gaming platform by KDS.', color: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' },
    { id: 'stock', name: 'KDS Stock Images', url: 'https://stock.kierendaystudios.co.uk/', icon: 'stock', category: 'Resources', description: 'Commercially free to use stock images.', color: '#6b7280', gradient: 'linear-gradient(135deg, #6b7280, #4b5563)' },
    { id: 'gaming', name: 'KDS Gaming', url: 'https://gaming.kierendaystudios.co.uk/#/dashboard', icon: 'gaming', category: 'Resources', description: 'Indie gaming platform by KDS.', color: '#ec4899', gradient: 'linear-gradient(135deg, #ec4899, #db2777)' },
];

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

const loadHiddenApps = (userId: string): string[] => {
    try {
        const saved = localStorage.getItem(getStorageKey(userId, 'cordoval-hidden-apps'));
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

interface WindowState {
    id: string; title: string; icon: string; component: React.ReactNode;
    x: number; y: number; width: number; height: number; zIndex: number; isMinimized: boolean;
    isMaximized: boolean;
    restoreState?: { x: number; y: number; width: number; height: number };
}

interface DesktopItem {
    id: string; title: string; icon: string; action: () => void;
}

export const Desktop = () => {
    const { currentUser, logout } = useUser();
    const userId = currentUser!.id;

    const [windows, setWindows] = useState<WindowState[]>([]);
    const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
    const [showStartMenu, setShowStartMenu] = useState(false);
    const [highestZ, setHighestZ] = useState(100);

    const [installedApps, setInstalledApps] = useState<string[]>(() => loadInstalledApps(userId));
    const userSettings = loadSettings(userId);
    const [wallpaper, setWallpaper] = useState(userSettings.wallpaper);
    const [accentColor, setAccentColor] = useState(userSettings.accentColor);
    const [zoom, setZoom] = useState(userSettings.zoom || 1.0);
    const [iconPositions, setIconPositions] = useState<Record<string, { x: number, y: number }>>(() => loadIconPositions(userId));
    const [hiddenApps, setHiddenApps] = useState<string[]>(() => loadHiddenApps(userId));
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, itemId: string } | null>(null);
    const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);

    const [updateInfo, setUpdateInfo] = useState<{ status: string; version?: string; percent?: number; message?: string } | null>(null);
    const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);

    useEffect(() => {
        document.documentElement.style.setProperty('--accent-color', accentColor);
        localStorage.setItem(getStorageKey(userId, 'cordoval-settings'), JSON.stringify({ wallpaper, accentColor, zoom }));
        try {
            const { webFrame } = window.require('electron');
            if (webFrame) { webFrame.setZoomFactor(zoom); }
        } catch (e) {
            document.body.style.zoom = zoom.toString();
        }
    }, [accentColor, wallpaper, zoom, userId]);

    useEffect(() => {
        localStorage.setItem(getStorageKey(userId, 'cordoval-icon-positions'), JSON.stringify(iconPositions));
    }, [iconPositions, userId]);

    useEffect(() => {
        localStorage.setItem(getStorageKey(userId, 'cordoval-installed-apps'), JSON.stringify(installedApps));
    }, [installedApps, userId]);

    useEffect(() => {
        localStorage.setItem(getStorageKey(userId, 'cordoval-hidden-apps'), JSON.stringify(hiddenApps));
    }, [hiddenApps, userId]);

    useEffect(() => {
        try {
            const { ipcRenderer } = window.require('electron');
            if (!ipcRenderer) return;
            const handleUpdate = (_event: any, info: any) => {
                setUpdateInfo(info);
                if (info.status === 'available' || info.status === 'downloaded') { setShowUpdatePrompt(true); }
            };
            ipcRenderer.on('update-status', handleUpdate);
            return () => { ipcRenderer.removeListener('update-status', handleUpdate); };
        } catch (e) { return; }
    }, []);

    const handleUpdateAction = async (action: 'download' | 'install' | 'check') => {
        const { ipcRenderer } = window.require('electron');
        if (action === 'download') { await ipcRenderer.invoke('download-update'); }
        else if (action === 'install') { await ipcRenderer.invoke('install-update'); }
        else if (action === 'check') { await ipcRenderer.invoke('check-for-updates'); }
    };

    const getInstalledStoreApps = () => STORE_APPS.filter(app => installedApps.includes(app.id));

    const handleInstallApp = (app: StoreApp) => {
        if (!installedApps.includes(app.id)) { setInstalledApps([...installedApps, app.id]); }
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

    const openKdsApp = (app: typeof KDS_APPS[0]) => { openApp(app.id, app.name, app.icon, <WebFrame url={app.url} />); };

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
        if (windows.find(w => w.id === browserId)) { focusWindow(browserId); return; }
        openApp(browserId, 'KDS Browser', 'kds-browser', <KDSBrowser initialUrl={initialUrl} />);
    };

    const openFileExplorer = () => {
        const explorerId = 'file-explorer';
        if (windows.find(w => w.id === explorerId)) { focusWindow(explorerId); return; }
        openApp(explorerId, 'File Explorer', 'file-explorer', <FileExplorer />);
    };

    const openCalculator = () => {
        const calcId = 'calculator';
        if (windows.find(w => w.id === calcId)) { focusWindow(calcId); return; }
        openApp(calcId, 'Calculator', 'calculator', <Calculator />);
    };

    const openCalendarApp = () => {
        const calId = 'calendar-app';
        if (windows.find(w => w.id === calId)) { focusWindow(calId); return; }
        openApp(calId, 'Calendar', 'calendar', <CalendarApp />);
    };

    const openSettings = () => {
        const settingsId = 'settings';
        if (windows.find(w => w.id === settingsId)) { focusWindow(settingsId); return; }
        openApp(settingsId, 'Settings', 'settings',
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
        const allItems: DesktopItem[] = [
            { id: 'kds-browser', title: 'KDS Browser', icon: 'kds-browser', action: () => openKDSBrowser() },
            { id: 'file-explorer', title: 'File Explorer', icon: 'file-explorer', action: openFileExplorer },
            { id: 'app-store', title: 'App Store', icon: 'app-store', action: openAppStore },
        ];
        KDS_APPS.forEach(app => { allItems.push({ id: app.id, title: app.name, icon: app.icon, action: () => openKdsApp(app), gradient: app.gradient } as any); });
        getInstalledStoreApps().forEach(app => { allItems.push({ id: app.id, title: app.name, icon: app.icon, action: () => handleOpenStoreApp(app) }); });
        allItems.push({ id: 'settings', title: 'Settings', icon: 'settings', action: openSettings });

        return allItems.filter(item => !hiddenApps.includes(item.id));
    };

    const handleRemoveFromDesktop = (id: string) => {
        setHiddenApps(prev => [...prev, id]);
        setContextMenu(null);
    };

    const handleDesktopContextMenu = (e: React.MouseEvent, itemId: string) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY, itemId });
    };

    const updateIconPosition = (id: string, x: number, y: number) => { setIconPositions(prev => ({ ...prev, [id]: { x, y } })); };

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
                            if (file.endsWith('.lnk')) { apps.push({ name: file.replace('.lnk', ''), path: path.join(dir, file) }); }
                        });
                    }
                });
                setHostApps(apps);
            } catch (e) { console.error("Failed to scan host apps", e); }
        };
        scanHostApps();
    }, []);

    const launchHostApp = (appPath: string) => {
        try {
            const { shell } = window.require('electron');
            shell.openPath(appPath);
            setShowStartMenu(false);
        } catch (e) { console.error(e); }
    };

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
        <div className="desktop" style={{ backgroundImage: `url(${wallpaper})` }} onClick={() => { setShowStartMenu(false); setContextMenu(null); }}>
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
                            <button onClick={(e) => { e.stopPropagation(); handleUpdateAction('download'); }} style={{ width: '100%', padding: '8px', borderRadius: 6, background: accentColor, color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Download Update</button>
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
                            <button onClick={(e) => { e.stopPropagation(); handleUpdateAction('install'); }} style={{ width: '100%', padding: '8px', borderRadius: 6, background: accentColor, color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Restart & Update</button>
                        </>
                    )}
                </div>
            )}

            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden' }}>
                {getDesktopItems().map((item, index) => (
                    <DraggableDesktopIcon
                        key={item.id}
                        item={item}
                        index={index}
                        position={iconPositions[item.id]}
                        onUpdatePosition={updateIconPosition}
                        onContextMenu={(e: React.MouseEvent) => handleDesktopContextMenu(e, item.id)}
                    />
                ))}
                {isAIAssistantOpen ? (
                    <NoahAssistant
                        userId={currentUser?.id || 'default'}
                        isOpen={isAIAssistantOpen}
                        onClose={() => setIsAIAssistantOpen(false)}
                    />
                ) : (
                    <>
                        <NotesWidget />
                        <CalendarWidget />
                    </>
                )}

                {contextMenu && (
                    <div className="context-menu" style={{ left: contextMenu.x, top: contextMenu.y }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => {
                            const item = getDesktopItems().find(i => i.id === contextMenu.itemId);
                            if (item) item.action();
                            setContextMenu(null);
                        }}>Open</button>
                        <button onClick={() => handleRemoveFromDesktop(contextMenu.itemId)}>Remove from Desktop</button>
                    </div>
                )}
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
                            <input type="text" className="start-search-input" placeholder="Search apps, settings, or files..." autoFocus />
                        </div>
                        <div className="start-menu-scroll">
                            <div className="start-apps-grid-title">Standard Tools</div>
                            <div className="start-apps-grid">
                                <StartAppItem name="App Store" icon="app-store" onClick={openAppStore} />
                                <StartAppItem name="Browser" icon="kds-browser" onClick={() => openKDSBrowser()} />
                                <StartAppItem name="Files" icon="file-explorer" onClick={openFileExplorer} />
                                <StartAppItem name="Settings" icon="settings" onClick={openSettings} />
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
                <div className={`taskbar-icon start-btn ${showStartMenu ? 'active' : ''}`} onClick={() => setShowStartMenu(!showStartMenu)}>
                    <ModernIcon iconName="LayoutGrid" size={38} gradient="linear-gradient(135deg, #000, #333)" />
                </div>
                <div
                    className={`taskbar-icon ${isAIAssistantOpen ? 'active' : ''}`}
                    onClick={() => setIsAIAssistantOpen(!isAIAssistantOpen)}
                    style={{ marginLeft: -5 }}
                    title="Noah AI"
                >
                    <ModernIcon iconName="Sparkles" size={30} gradient={isAIAssistantOpen ? "linear-gradient(135deg, #8b5cf6, #d946ef)" : "linear-gradient(135deg, #6366f1, #a855f7)"} />
                </div>
                {windows.map(win => (
                    <div key={win.id} className={`taskbar-icon ${activeWindowId === win.id && !win.isMinimized ? 'active' : ''}`} onClick={() => win.isMinimized ? focusWindow(win.id) : toggleMinimize(win.id)}>
                        <ModernIcon iconName={win.icon} size={36} />
                    </div>
                ))}
                <div className="system-tray">
                    <span title={isOnline ? "Online" : "Offline"} style={{ cursor: 'help', opacity: 0.8, display: 'flex', alignItems: 'center' }}>
                        <ModernIcon iconName={isOnline ? "Wifi" : "WifiOff"} size={22} gradient="transparent" />
                    </span>
                    <span onClick={() => setIsMuted(!isMuted)} style={{ cursor: 'pointer', opacity: 0.8, display: 'flex', alignItems: 'center' }} title={isMuted ? "Unmute" : "Mute"}>
                        <ModernIcon iconName={isMuted ? "VolumeX" : "Volume2"} size={22} gradient="transparent" />
                    </span>
                    <span style={{ color: '#333', fontWeight: 600, fontSize: '13px', marginLeft: 5 }}>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            </div>
        </div>
    );
};

const WebFrame = ({ url }: { url: string }) => (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'white', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#888', zIndex: 0 }}>Connecting to {url}...</div>
        {/* @ts-ignore */}
        <webview src={url} style={{ width: '100%', height: '100%', flex: 1, border: 'none', position: 'relative', zIndex: 10 }} allowpopups={true} useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"></webview>
    </div>
);

const AppIcon = ({ icon, gradient, size = 48, className }: { icon: string, gradient?: string, size?: number, className?: string }) => (
    <ModernIcon iconName={icon} size={size} gradient={gradient} className={className} />
);

function StartAppItem({ name, icon, onClick, gradient }: { name: string, icon: string, onClick: () => void, gradient?: string }) {
    return (
        <div className="start-app-item" onClick={onClick}>
            <AppIcon icon={icon} gradient={gradient} size={70} className="start-app-icon" />
            <div className="start-app-name">{name}</div>
        </div>
    );
}

const DraggableDesktopIcon = ({ item, index, position, onUpdatePosition, onContextMenu }: any) => {
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
    const handleMouseDown = (e: React.MouseEvent) => { e.stopPropagation(); setIsDragging(true); dragOffset.current = { x: e.clientX - currentX, y: e.clientY - currentY }; };
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            let newX = e.clientX - dragOffset.current.x;
            let newY = e.clientY - dragOffset.current.y;
            if (newX < 0) newX = 0;
            if (newX > window.innerWidth - 85) newX = window.innerWidth - 85;
            if (newY < 0) newY = 0;
            if (newY > window.innerHeight - 50 - 100) newY = window.innerHeight - 50 - 100;
            onUpdatePosition(item.id, newX, newY);
        };
        const handleMouseUp = () => { if (isDragging) setIsDragging(false); };
        if (isDragging) { window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp); }
        return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
    }, [isDragging, item.id]);
    const handleClick = () => { if (!isDragging) item.action(); };
    return (
        <div onMouseDown={handleMouseDown} onClick={handleClick} onContextMenu={onContextMenu} style={{ position: 'absolute', left: currentX, top: currentY, width: 85, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', padding: 8, borderRadius: 6, textShadow: '0 1px 3px black', zIndex: isDragging ? 9999 : 1 }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
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
    useEffect(() => { setPos({ x: windowState.x, y: windowState.y }); setSize({ width: windowState.width, height: windowState.height }); }, [windowState.isMaximized, windowState.x, windowState.y, windowState.width, windowState.height]);
    const handleMouseDown = (e: React.MouseEvent) => { if (windowState.isMaximized) return; onFocus(); setIsDragging(true); dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }; };
    const handleResizeStart = (e: React.MouseEvent, direction: string) => { e.stopPropagation(); onFocus(); setIsResizing(direction); resizeStart.current = { x: pos.x, y: pos.y, width: size.width, height: size.height, startX: e.clientX, startY: e.clientY }; };
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                let newX = e.clientX - dragOffset.current.x;
                let newY = e.clientY - dragOffset.current.y;
                if (newY < 0) newY = 0;
                if (newY > window.innerHeight - 50 - 30) newY = window.innerHeight - 50 - 30;
                if (newX < 0) newX = 0;
                if (newX > window.innerWidth - size.width) newX = window.innerWidth - size.width;
                setPos({ x: newX, y: newY });
            }
            if (isResizing) {
                const deltaX = e.clientX - resizeStart.current.startX;
                const deltaY = e.clientY - resizeStart.current.startY;
                const minWidth = 300; const minHeight = 200;
                let newX = resizeStart.current.x; let newY = resizeStart.current.y;
                let newWidth = resizeStart.current.width; let newHeight = resizeStart.current.height;
                if (isResizing.includes('e')) newWidth = Math.max(minWidth, resizeStart.current.width + deltaX);
                if (isResizing.includes('w')) { const proposedWidth = resizeStart.current.width - deltaX; if (proposedWidth >= minWidth) { newWidth = proposedWidth; newX = resizeStart.current.x + deltaX; } }
                if (isResizing.includes('s')) newHeight = Math.max(minHeight, resizeStart.current.height + deltaY);
                if (isResizing.includes('n')) { const proposedHeight = resizeStart.current.height - deltaY; if (proposedHeight >= minHeight) { newHeight = proposedHeight; newY = resizeStart.current.y + deltaY; } }
                setPos({ x: newX, y: newY }); setSize({ width: newWidth, height: newHeight });
            }
        };
        const handleMouseUp = () => {
            if (isDragging) { setIsDragging(false); onUpdateBounds({ x: pos.x, y: pos.y }); }
            if (isResizing) { setIsResizing(null); onUpdateBounds({ x: pos.x, y: pos.y, width: size.width, height: size.height }); }
        };
        if (isDragging || isResizing) { window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp); }
        return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
    }, [isDragging, isResizing, pos, size]);

    const resizeHandleStyle = (): React.CSSProperties => ({ position: 'absolute', background: 'transparent', zIndex: 10 });
    return (
        <div className="os-window" style={{ left: pos.x, top: pos.y, width: size.width, height: size.height, zIndex: windowState.zIndex, display: windowState.isMinimized ? 'none' : 'flex', boxShadow: isActive ? '0 25px 80px rgba(0,0,0,0.7)' : '0 10px 30px rgba(0,0,0,0.5)', borderColor: isActive ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)' }} onMouseDown={onFocus}>
            {!windowState.isMaximized && (
                <>
                    <div style={{ ...resizeHandleStyle(), top: 0, left: 0, right: 0, height: 4, cursor: 'n-resize' }} onMouseDown={(e) => handleResizeStart(e, 'n')} />
                    <div style={{ ...resizeHandleStyle(), bottom: 0, left: 0, right: 0, height: 4, cursor: 's-resize' }} onMouseDown={(e) => handleResizeStart(e, 's')} />
                    <div style={{ ...resizeHandleStyle(), left: 0, top: 0, bottom: 0, width: 4, cursor: 'w-resize' }} onMouseDown={(e) => handleResizeStart(e, 'w')} />
                    <div style={{ ...resizeHandleStyle(), right: 0, top: 0, bottom: 0, width: 4, cursor: 'e-resize' }} onMouseDown={(e) => handleResizeStart(e, 'e')} />
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

const CalendarWidget = () => {
    const now = new Date();
    const dayNumeric = now.getDate();
    const monthYear = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    return (
        <div style={{ position: 'absolute', bottom: 100, right: 30, width: 260, background: 'rgba(255, 255, 255, 0.75)', backdropFilter: 'blur(30px)', borderRadius: 24, padding: 20, color: '#333', border: '1px solid rgba(255, 255, 255, 0.5)', boxShadow: '0 15px 45px rgba(0,0,0,0.1)' }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{now.toLocaleDateString('en-US', { weekday: 'long' })},</h2>
            <h2 style={{ margin: '0 0 15px 0', fontSize: 18, fontWeight: 800 }}>{dayNumeric} {now.toLocaleDateString('en-US', { month: 'long' })} {now.getFullYear()}</h2>
            <div style={{ opacity: 0.6, fontSize: 12, fontWeight: 700, marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}><span>{monthYear}</span><span>▲ ▼</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5, textAlign: 'center', fontSize: 10, fontWeight: 700 }}>
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d} style={{ color: 'rgba(0,0,0,0.3)' }}>{d}</div>)}
                {Array.from({ length: 31 }, (_, i) => (<div key={i} style={{ padding: '4px 0', borderRadius: 8, background: (i + 1) === dayNumeric ? 'var(--accent-color)' : 'transparent', color: (i + 1) === dayNumeric ? 'white' : 'inherit' }}>{i + 1}</div>))}
            </div>
            <div style={{ marginTop: 15, paddingTop: 15, borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(0,0,0,0.4)', marginBottom: 8 }}>TODAY</div>
                <div style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.03)', borderRadius: 10, fontSize: 11, display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 4, height: 14, background: 'var(--accent-color)', borderRadius: 2 }} />No events scheduled</div>
            </div>
        </div>
    );
};

const NotesWidget = () => {
    const [notes, setNotes] = useState(() => localStorage.getItem('kds-notes') || '');

    const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setNotes(val);
        localStorage.setItem('kds-notes', val);
    };

    return (
        <div style={{
            position: 'absolute', bottom: 420, right: 30, width: 260, height: 220,
            background: 'rgba(255, 255, 255, 0.75)', backdropFilter: 'blur(30px)',
            borderRadius: 24, padding: 20, color: '#333', border: '1px solid rgba(255, 255, 255, 0.5)',
            boxShadow: '0 15px 45px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: 10
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>📝</span>
                <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: 0.5, opacity: 0.6 }}>QUICK NOTES</span>
            </div>
            <textarea
                value={notes}
                onChange={handleNotesChange}
                placeholder="Type your notes here..."
                style={{
                    flex: 1, background: 'transparent', border: 'none', outline: 'none',
                    fontSize: 12, fontWeight: 500, color: '#333', resize: 'none',
                    fontFamily: 'inherit', lineHeight: 1.5
                }}
            />
        </div>
    );
};

