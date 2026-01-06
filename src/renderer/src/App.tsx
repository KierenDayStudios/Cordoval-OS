import React, { useState, useRef, useEffect } from 'react';
import './App.css';

// --- TypeScript Definitions ---
declare global {
  interface Window {
    require: any;
  }
  namespace JSX {
    interface IntrinsicElements {
      webview: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        src?: string;
        allowpopups?: any; // Fixed type error
        useragent?: string;
        partition?: string;
      }, HTMLElement>;
    }
  }
}

// --- CONFIGURATION: KDS ECOSYSTEM ---
const KDS_APPS = [
  // Productivity
  { id: 'workspace', name: 'KDS Workspace', url: 'https://workspace.kierendaystudios.co.uk/', icon: '💼', category: 'Productivity' },
  { id: 'founders', name: 'KDS Founders OS', url: 'https://founders.kierendaystudios.co.uk/', icon: '🚀', category: 'Productivity' },
  { id: 'builder', name: 'AI Business Builder', url: 'https://builder.kierendaystudios.co.uk/', icon: '🤖', category: 'Productivity' },
  // Development
  { id: 'code', name: 'KDS Code', url: 'https://codestudio.kierendaystudios.co.uk/', icon: '💻', category: 'Development' },
  { id: 'academy', name: 'KDS Web Academy', url: 'https://academy.kierendaystudios.co.uk/', icon: '🎓', category: 'Development' },
  { id: 'gamedev', name: 'Game Dev Center', url: 'https://gamedev.kierendaystudios.co.uk/', icon: '🕹️', category: 'Development' },
  // Creative & Resources
  { id: 'stock', name: 'KDS Stock Images', url: 'https://stock.kierendaystudios.co.uk/', icon: '📸', category: 'Resources' },
  { id: 'gaming', name: 'KDS Gaming', url: 'https://gaming.kierendaystudios.co.uk/', icon: '🎮', category: 'Resources' },
];

const WALLPAPER = "https://storage.cloud.google.com/randingstorage/blue-abstract-5120x5120-25023.jpg";

// --- TYPES ---
interface WindowState {
  id: string; title: string; icon: string; component: React.ReactNode;
  x: number; y: number; width: number; height: number; zIndex: number; isMinimized: boolean;
  isMaximized: boolean;
  // Store pre-maximized state for restoration
  restoreState?: { x: number; y: number; width: number; height: number };
}

// --- MAIN APP COMPONENT ---
function App() {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [showStartMenu, setShowStartMenu] = useState(false);
  const [highestZ, setHighestZ] = useState(100);

  // --- Actions ---
  const openApp = (appId: string, title: string, icon: string, component: React.ReactNode) => {
    setShowStartMenu(false);
    if (windows.find(w => w.id === appId)) { focusWindow(appId); return; }

    const newWindow: WindowState = {
      id: appId, title, icon, component,
      x: 100 + (windows.length * 30), y: 50 + (windows.length * 30),
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
        // Restore to previous size
        return {
          ...w,
          isMaximized: false,
          x: w.restoreState?.x ?? w.x,
          y: w.restoreState?.y ?? w.y,
          width: w.restoreState?.width ?? w.width,
          height: w.restoreState?.height ?? w.height,
        };
      } else {
        // Maximize
        return {
          ...w,
          isMaximized: true,
          restoreState: { x: w.x, y: w.y, width: w.width, height: w.height },
          x: 0,
          y: 0,
          width: window.innerWidth,
          height: window.innerHeight - 50, // Account for taskbar
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

  // --- RENDER ---
  return (
    <div className="desktop" style={{ backgroundImage: `url(${WALLPAPER})` }} onClick={() => setShowStartMenu(false)}>

      {/* 1. Desktop Widget */}
      <div className="desktop-widget">
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>KDS Workstation</h2>
        <p style={{ color: '#aaa', margin: '5px 0 20px 0' }}>System Online.</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ flex: 1, padding: 10, background: '#d946ef', border: 'none', borderRadius: 4, color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
            onClick={() => openKdsApp(KDS_APPS[0])}>
            Open Workspace
          </button>
        </div>
      </div>

      {/* 2. Desktop Icons */}
      <div style={{ padding: 30, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {KDS_APPS.filter(app => ['workspace', 'code', 'founders'].includes(app.id)).map(app => (
          <DesktopIcon key={app.id} title={app.name} icon={app.icon} onClick={() => openKdsApp(app)} />
        ))}
        <DesktopIcon title="Explorer" icon="📁" onClick={() => launchExe('explorer')} />
        <DesktopIcon title="Settings" icon="⚙️" onClick={() => launchExe('start ms-settings:')} />
      </div>

      {/* 3. Window Manager Layer */}
      {windows.map(win => (
        <DraggableWindow key={win.id} windowState={win} isActive={activeWindowId === win.id}
          onFocus={() => focusWindow(win.id)} onClose={() => closeWindow(win.id)}
          onMinimize={() => toggleMinimize(win.id)} onMaximize={() => toggleMaximize(win.id)}
          onUpdateBounds={(bounds) => updateWindowBounds(win.id, bounds)}
        />
      ))}

      {/* 4. Start Menu */}
      {showStartMenu && (
        <div className="start-menu" onClick={(e) => e.stopPropagation()}>
          <div style={{ marginBottom: 20 }}>
            <input type="text" placeholder="Search KDS Ecosystem..." style={{ width: '100%', padding: '12px 15px', borderRadius: 6, border: '1px solid #444', background: '#222', color: 'white', outline: 'none' }} />
          </div>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', gap: 30 }}>
            <div style={{ flex: 1 }}>
              <MenuSection title="Productivity">
                {KDS_APPS.filter(a => a.category === 'Productivity').map(app => <StartMenuRow key={app.id} app={app} onClick={() => openKdsApp(app)} />)}
              </MenuSection>
              <MenuSection title="Development">
                {KDS_APPS.filter(a => a.category === 'Development').map(app => <StartMenuRow key={app.id} app={app} onClick={() => openKdsApp(app)} />)}
              </MenuSection>
            </div>
            <div style={{ flex: 1, borderLeft: '1px solid #333', paddingLeft: 20 }}>
              <MenuSection title="Resources">
                {KDS_APPS.filter(a => a.category === 'Resources').map(app => <StartMenuRow key={app.id} app={app} onClick={() => openKdsApp(app)} />)}
              </MenuSection>
              <MenuSection title="System">
                <StartMenuRow app={{ name: 'File Explorer', icon: '📁' }} onClick={() => launchExe('explorer')} />
                <StartMenuRow app={{ name: 'Calculator', icon: '🧮' }} onClick={() => launchExe('calc.exe')} />
                <StartMenuRow app={{ name: 'Terminal', icon: '💻' }} onClick={() => launchExe('start cmd.exe')} />
              </MenuSection>
            </div>
          </div>
          <div style={{ marginTop: 20, borderTop: '1px solid #333', paddingTop: 20, display: 'flex', alignItems: 'center', gap: 15 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(to right, #d946ef, #8b5cf6)' }}></div>
            <div><div style={{ fontSize: 14, fontWeight: 'bold' }}>KDS User</div><div style={{ fontSize: 11, color: '#aaa' }}>Cordoval Business OS</div></div>
          </div>
        </div>
      )}

      {/* 5. Taskbar */}
      <div className="taskbar" onClick={(e) => e.stopPropagation()}>
        <div className={`taskbar-icon ${showStartMenu ? 'active' : ''}`} onClick={() => setShowStartMenu(!showStartMenu)} style={{ fontSize: 26 }}>💠</div>
        {windows.map(win => (
          <div key={win.id} className={`taskbar-icon ${activeWindowId === win.id && !win.isMinimized ? 'active' : ''}`}
            onClick={() => win.isMinimized ? focusWindow(win.id) : toggleMinimize(win.id)}>
            {win.icon}
          </div>
        ))}
        <div className="system-tray">
          <span style={{ color: '#d946ef', fontWeight: 'bold' }}>KDS CLOUD</span>
          <span>📶</span><span>🔊</span>
          <span style={{ color: 'white', fontWeight: 600 }}>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    </div>
  );
}

// --- SUB COMPONENTS ---

// 1. Web Frame (FIXED for Loading Issue)
const WebFrame = ({ url }: { url: string }) => (
  <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'white', position: 'relative' }}>
    {/* Loading Indicator: Z-index 0 means it sits behind the webview if webview loads */}
    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#888', zIndex: 0 }}>
      Connecting to {url}...
    </div>

    {/* The Browser View */}
    {/* @ts-ignore */}
    <webview
      src={url}
      style={{ width: '100%', height: '100%', flex: 1, border: 'none', position: 'relative', zIndex: 10 }}
      allowpopups={true}
      useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ></webview>
  </div>
);

// 2. Start Menu Components
const MenuSection = ({ title, children }: any) => (
  <div style={{ marginBottom: 25 }}>
    <h5 style={{ color: '#888', textTransform: 'uppercase', fontSize: 11, letterSpacing: 1, margin: '0 0 10px 0' }}>{title}</h5>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>{children}</div>
  </div>
);

const StartMenuRow = ({ app, onClick }: any) => (
  <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 10px', borderRadius: 6, cursor: 'pointer', transition: '0.2s' }}
    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
    <div style={{ fontSize: 20, width: 30, display: 'flex', justifyContent: 'center' }}>{app.icon}</div>
    <span style={{ fontSize: 14 }}>{app.name}</span>
  </div>
);

// 3. Desktop Icon
const DesktopIcon = ({ title, icon, onClick }: any) => (
  <div onClick={onClick} style={{ width: 85, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', padding: 8, borderRadius: 6, textShadow: '0 1px 3px black' }}
    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
    <div style={{ fontSize: 36, filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.5))' }}>{icon}</div>
    <div style={{ fontSize: 12, textAlign: 'center', fontWeight: 500, lineHeight: 1.2 }}>{title}</div>
  </div>
);

// 4. Draggable Window Logic with Resize
const DraggableWindow = ({ windowState, isActive, onFocus, onClose, onMinimize, onMaximize, onUpdateBounds }: any) => {
  const [pos, setPos] = useState({ x: windowState.x, y: windowState.y });
  const [size, setSize] = useState({ width: windowState.width, height: windowState.height });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0, startX: 0, startY: 0 });

  // Sync with parent state when maximized/restored
  useEffect(() => {
    setPos({ x: windowState.x, y: windowState.y });
    setSize({ width: windowState.width, height: windowState.height });
  }, [windowState.isMaximized, windowState.x, windowState.y, windowState.width, windowState.height]);

  if (windowState.isMinimized) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (windowState.isMaximized) return; // Don't allow dragging when maximized
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
        const newPos = { x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y };
        setPos(newPos);
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

        // Handle different resize directions
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
      boxShadow: isActive ? '0 25px 80px rgba(0,0,0,0.7)' : '0 10px 30px rgba(0,0,0,0.5)',
      borderColor: isActive ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'
    }} onMouseDown={onFocus}>

      {/* Resize Handles - Only show when not maximized */}
      {!windowState.isMaximized && (
        <>
          {/* Edges */}
          <div style={{ ...resizeHandleStyle(), top: 0, left: 0, right: 0, height: 4, cursor: 'n-resize' }}
            onMouseDown={(e) => handleResizeStart(e, 'n')} />
          <div style={{ ...resizeHandleStyle(), bottom: 0, left: 0, right: 0, height: 4, cursor: 's-resize' }}
            onMouseDown={(e) => handleResizeStart(e, 's')} />
          <div style={{ ...resizeHandleStyle(), left: 0, top: 0, bottom: 0, width: 4, cursor: 'w-resize' }}
            onMouseDown={(e) => handleResizeStart(e, 'w')} />
          <div style={{ ...resizeHandleStyle(), right: 0, top: 0, bottom: 0, width: 4, cursor: 'e-resize' }}
            onMouseDown={(e) => handleResizeStart(e, 'e')} />

          {/* Corners */}
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

export default App;