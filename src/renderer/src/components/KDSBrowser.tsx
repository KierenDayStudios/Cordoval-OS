import React, { useState, useRef, useEffect } from 'react';
import { useFileSystem, VirtualFile } from './FileSystem';
import './KDSBrowser.css';

// --- Browser Tab Type ---
interface BrowserTab {
    id: string;
    title: string;
    url: string;
    favicon?: string;
    isLoading: boolean;
    canGoBack: boolean;
    canGoForward: boolean;
}

// --- History Item ---
interface HistoryItem {
    url: string;
    title: string;
    timestamp: Date;
    favicon?: string;
}

// --- Browser Props ---
interface KDSBrowserProps {
    initialUrl?: string;
}

// --- Default Home Page ---
const HOME_PAGE = 'https://www.google.com';
const SEARCH_ENGINE = 'https://www.google.com/search?q=';

// --- Quick Access Sites ---
const QUICK_ACCESS = [
    { name: 'KDS Workspace', url: 'https://workspace.kierendaystudios.co.uk/', icon: '💼' },
    { name: 'Retbuild', url: 'https://retbuild.co.uk/', icon: '🛠️' },
    { name: 'KDS Code', url: 'https://codestudio.kierendaystudios.co.uk/', icon: '💻' },
    { name: 'Founders OS', url: 'https://founders.kierendaystudios.co.uk/', icon: '🚀' },
    { name: 'Web Academy', url: 'https://academy.kierendaystudios.co.uk/', icon: '🎓' },
    { name: 'Stock Images', url: 'https://stock.kierendaystudios.co.uk/', icon: '📸' },
];

export const KDSBrowser: React.FC<KDSBrowserProps> = ({ initialUrl }) => {
    const { addBookmark, getBookmarks, deleteBookmark } = useFileSystem();

    // --- Tab Management ---
    const [tabs, setTabs] = useState<BrowserTab[]>([
        {
            id: 'tab_1',
            title: 'New Tab',
            url: initialUrl || '',
            isLoading: false,
            canGoBack: false,
            canGoForward: false
        }
    ]);
    const [activeTabId, setActiveTabId] = useState('tab_1');

    // --- URL Bar ---
    const [urlInput, setUrlInput] = useState(initialUrl || '');
    const [isUrlFocused, setIsUrlFocused] = useState(false);

    // --- UI State ---
    const [showBookmarksPanel, setShowBookmarksPanel] = useState(false);
    const [showHistoryPanel, setShowHistoryPanel] = useState(false);
    const [showSettingsMenu, setShowSettingsMenu] = useState(false);
    const [showDownloadsPanel, setShowDownloadsPanel] = useState(false);
    const [isIncognito, setIsIncognito] = useState(false);
    const [mostVisited, setMostVisited] = useState<{ url: string, title: string, visits: number }[]>(() => {
        const saved = localStorage.getItem('kds-browser-most-visited');
        return saved ? JSON.parse(saved) : [];
    });

    // --- History ---
    const [history, setHistory] = useState<HistoryItem[]>(() => {
        const saved = localStorage.getItem('kds-browser-history');
        if (saved) {
            try {
                return JSON.parse(saved).map((h: any) => ({
                    ...h,
                    timestamp: new Date(h.timestamp)
                }));
            } catch {
                return [];
            }
        }
        return [];
    });

    // --- Refs ---
    const webviewRefs = useRef<{ [key: string]: any }>({});
    const urlInputRef = useRef<HTMLInputElement>(null);

    // Get active tab
    const activeTab = tabs.find(t => t.id === activeTabId);
    const bookmarks = getBookmarks();

    // Persist history
    useEffect(() => {
        localStorage.setItem('kds-browser-history', JSON.stringify(history.slice(0, 100)));
    }, [history]);

    // Update URL input when tab changes
    useEffect(() => {
        if (activeTab) {
            setUrlInput(activeTab.url);
        }
    }, [activeTabId, activeTab?.url]);

    // --- Tab Actions ---
    const createTab = (url = '') => {
        const newTab: BrowserTab = {
            id: `tab_${Date.now()}`,
            title: url ? 'Loading...' : (isIncognito ? 'Incognito Tab' : 'New Tab'),
            url,
            isLoading: !!url,
            canGoBack: false,
            canGoForward: false
        };
        setTabs([...tabs, newTab]);
        setActiveTabId(newTab.id);
        setUrlInput(url);
    };

    const toggleIncognito = () => {
        const newIncognito = !isIncognito;
        setIsIncognito(newIncognito);
        // If entering incognito, start with a fresh new tab
        if (newIncognito) {
            setTabs([{
                id: `tab_${Date.now()}`,
                title: 'Incognito Tab',
                url: '',
                isLoading: false,
                canGoBack: false,
                canGoForward: false
            }]);
            setActiveTabId(`tab_${Date.now()}`);
            setUrlInput('');
        }
    };

    const closeTab = (tabId: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        const tabIndex = tabs.findIndex(t => t.id === tabId);
        const newTabs = tabs.filter(t => t.id !== tabId);

        if (newTabs.length === 0) {
            // Create a new tab if closing the last one
            createTab();
        } else if (tabId === activeTabId) {
            // Switch to adjacent tab
            const newIndex = Math.min(tabIndex, newTabs.length - 1);
            setActiveTabId(newTabs[newIndex].id);
        }

        setTabs(newTabs.length === 0 ? tabs : newTabs);
        delete webviewRefs.current[tabId];
    };

    const updateTab = (tabId: string, updates: Partial<BrowserTab>) => {
        setTabs(prev => prev.map(t => t.id === tabId ? { ...t, ...updates } : t));
    };

    // --- Navigation ---
    const navigate = (url: string) => {
        if (!activeTab) return;

        let finalUrl = url.trim();

        // Handle empty URL
        if (!finalUrl) {
            finalUrl = HOME_PAGE;
        }
        // Handle search queries
        else if (!finalUrl.includes('.') && !finalUrl.startsWith('http')) {
            finalUrl = SEARCH_ENGINE + encodeURIComponent(finalUrl);
        }
        // Add protocol if missing
        else if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
            finalUrl = 'https://' + finalUrl;
        }

        updateTab(activeTab.id, { url: finalUrl, isLoading: true, title: 'Loading...' });
        setUrlInput(finalUrl);

        // Add to history
        addToHistory(finalUrl, 'Loading...');
    };

    const addToHistory = (url: string, title: string) => {
        if (isIncognito) return;

        const item: HistoryItem = {
            url,
            title,
            timestamp: new Date()
        };
        setHistory(prev => [item, ...prev.filter(h => h.url !== url).slice(0, 99)]);

        // Update Most Visited
        setMostVisited(prev => {
            const existing = prev.find(mv => mv.url === url);
            let updated;
            if (existing) {
                updated = prev.map(mv => mv.url === url ? { ...mv, visits: mv.visits + 1 } : mv);
            } else {
                updated = [...prev, { url, title, visits: 1 }];
            }
            const sorted = updated.sort((a, b) => b.visits - a.visits).slice(0, 10);
            localStorage.setItem('kds-browser-most-visited', JSON.stringify(sorted));
            return sorted;
        });
    };

    const handleUrlSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        navigate(urlInput);
        urlInputRef.current?.blur();
    };

    const goBack = () => {
        const webview = webviewRefs.current[activeTabId];
        if (webview?.canGoBack()) {
            webview.goBack();
        }
    };

    const goForward = () => {
        const webview = webviewRefs.current[activeTabId];
        if (webview?.canGoForward()) {
            webview.goForward();
        }
    };

    const refresh = () => {
        const webview = webviewRefs.current[activeTabId];
        if (webview) {
            webview.reload();
        }
    };

    const goHome = () => {
        navigate(HOME_PAGE);
    };

    // --- Webview Event Handlers ---
    const handleWebviewReady = (tabId: string, webview: any) => {
        webviewRefs.current[tabId] = webview;

        webview.addEventListener('did-start-loading', () => {
            updateTab(tabId, { isLoading: true });
        });

        webview.addEventListener('did-stop-loading', () => {
            updateTab(tabId, {
                isLoading: false,
                canGoBack: webview.canGoBack(),
                canGoForward: webview.canGoForward()
            });
        });

        webview.addEventListener('did-navigate', (e: any) => {
            updateTab(tabId, { url: e.url });
            if (tabId === activeTabId) {
                setUrlInput(e.url);
            }
        });

        webview.addEventListener('did-navigate-in-page', (e: any) => {
            if (e.isMainFrame) {
                updateTab(tabId, { url: e.url });
                if (tabId === activeTabId) {
                    setUrlInput(e.url);
                }
            }
        });

        webview.addEventListener('page-title-updated', (e: any) => {
            updateTab(tabId, { title: e.title });
            // Update history with title
            const tab = tabs.find(t => t.id === tabId);
            if (tab?.url) {
                setHistory(prev => prev.map(h =>
                    h.url === tab.url ? { ...h, title: e.title } : h
                ));
            }
        });

        webview.addEventListener('page-favicon-updated', (e: any) => {
            if (e.favicons && e.favicons.length > 0) {
                updateTab(tabId, { favicon: e.favicons[0] });
            }
        });

        // Handle new window requests
        webview.addEventListener('new-window', (e: any) => {
            createTab(e.url);
        });
    };

    // --- Bookmark Actions ---
    const isCurrentPageBookmarked = () => {
        return bookmarks.some(b => b.content === activeTab?.url);
    };

    const toggleBookmark = () => {
        if (!activeTab?.url) return;

        if (isCurrentPageBookmarked()) {
            const bookmark = bookmarks.find(b => b.content === activeTab.url);
            if (bookmark) {
                deleteBookmark(bookmark.id);
            }
        } else {
            addBookmark(activeTab.title || activeTab.url, activeTab.url);
        }
    };

    const openBookmark = (bookmark: VirtualFile) => {
        if (bookmark.content) {
            navigate(bookmark.content);
        }
        setShowBookmarksPanel(false);
    };

    // --- Clear History ---
    const clearHistory = () => {
        setHistory([]);
        localStorage.removeItem('kds-browser-history');
    };

    // --- Format URL for display ---
    const formatUrl = (url: string) => {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname.replace('www.', '');
        } catch {
            return url;
        }
    };

    // --- Render New Tab Page ---
    const renderNewTabPage = () => (
        <div className="new-tab-page">
            <div className="new-tab-content">
                <div className="browser-logo">
                    <span className="logo-icon">🌐</span>
                    <span className="logo-text">KDS Browser</span>
                </div>

                <form className="search-box" onSubmit={(e) => {
                    e.preventDefault();
                    const input = (e.target as HTMLFormElement).querySelector('input') as HTMLInputElement;
                    navigate(input.value);
                }}>
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="Search the web or enter URL..."
                        autoFocus
                    />
                </form>

                <div className="quick-access">
                    <h3>Quick Access</h3>
                    <div className="quick-access-grid">
                        {QUICK_ACCESS.map((site, i) => (
                            <button
                                key={i}
                                className="quick-access-item"
                                onClick={() => navigate(site.url)}
                            >
                                <span className="item-icon">{site.icon}</span>
                                <span className="item-name">{site.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {bookmarks.length > 0 && (
                    <div className="quick-bookmarks">
                        <h3>⭐ Bookmarks</h3>
                        <div className="bookmarks-row">
                            {bookmarks.slice(0, 8).map(bookmark => (
                                <button
                                    key={bookmark.id}
                                    className="bookmark-chip"
                                    onClick={() => openBookmark(bookmark)}
                                >
                                    {bookmark.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="kds-browser">
            {/* Tab Bar */}
            <div className="browser-tabs">
                <div className="tabs-container">
                    {tabs.map(tab => (
                        <div
                            key={tab.id}
                            className={`browser-tab ${tab.id === activeTabId ? 'active' : ''}`}
                            onClick={() => setActiveTabId(tab.id)}
                        >
                            {tab.isLoading ? (
                                <span className="tab-spinner">⟳</span>
                            ) : tab.favicon ? (
                                <img src={tab.favicon} alt="" className="tab-favicon" />
                            ) : (
                                <span className="tab-icon">🌐</span>
                            )}
                            <span className="tab-title">{tab.title || 'New Tab'}</span>
                            <button
                                className="tab-close"
                                onClick={(e) => closeTab(tab.id, e)}
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                    <button className="new-tab-btn" onClick={() => createTab()}>
                        +
                    </button>
                </div>
            </div>

            {/* Navigation Bar */}
            <div className="browser-navbar">
                <div className="nav-buttons">
                    <button
                        className="nav-btn"
                        onClick={goBack}
                        disabled={!activeTab?.canGoBack}
                        title="Go back"
                    >
                        ←
                    </button>
                    <button
                        className="nav-btn"
                        onClick={goForward}
                        disabled={!activeTab?.canGoForward}
                        title="Go forward"
                    >
                        →
                    </button>
                    <button
                        className="nav-btn"
                        onClick={refresh}
                        title="Refresh"
                    >
                        {activeTab?.isLoading ? '✕' : '↻'}
                    </button>
                    <button
                        className="nav-btn"
                        onClick={goHome}
                        title="Home"
                    >
                        🏠
                    </button>
                </div>

                {/* URL Bar */}
                <form className="url-bar" onSubmit={handleUrlSubmit}>
                    <span className="url-icon" style={{ color: isIncognito ? '#a78bfa' : '#64748b' }}>
                        {isIncognito ? '🕶️' : (activeTab?.url?.startsWith('https') ? '🔒' : '🌐')}
                    </span>
                    <input
                        ref={urlInputRef}
                        type="text"
                        value={isUrlFocused ? urlInput : (activeTab?.url ? formatUrl(activeTab.url) : urlInput)}
                        onChange={(e) => setUrlInput(e.target.value)}
                        onFocus={() => {
                            setIsUrlFocused(true);
                            setUrlInput(activeTab?.url || '');
                            urlInputRef.current?.select();
                        }}
                        onBlur={() => setIsUrlFocused(false)}
                        placeholder={isIncognito ? "Incognito Search" : "Search or enter URL"}
                        style={{ color: isIncognito ? '#e9d5ff' : '#e2e8f0' }}
                    />

                    <div className="url-tools">
                        <button type="button" className="url-tool-btn" title="Copy URL" onClick={() => {
                            navigator.clipboard.writeText(activeTab?.url || '');
                            // Optional: Show a subtle "Copied" toast
                        }}>📋</button>
                        <button type="button" className="url-tool-btn" title="Share" onClick={() => {
                            // In a real OS this might open a share menu, for now just copy
                            navigator.clipboard.writeText(activeTab?.url || '');
                        }}>🔗</button>
                        <button
                            type="button"
                            className={`bookmark-btn ${isCurrentPageBookmarked() ? 'bookmarked' : ''}`}
                            onClick={toggleBookmark}
                            title={isCurrentPageBookmarked() ? 'Remove bookmark' : 'Add bookmark'}
                        >
                            {isCurrentPageBookmarked() ? '★' : '☆'}
                        </button>
                    </div>
                </form>

                {/* Toolbar Buttons */}
                <div className="toolbar-buttons">
                    <button
                        className={`toolbar-btn ${showBookmarksPanel ? 'active' : ''}`}
                        onClick={() => {
                            setShowBookmarksPanel(!showBookmarksPanel);
                            setShowHistoryPanel(false);
                            setShowDownloadsPanel(false);
                            setShowSettingsMenu(false);
                        }}
                        title="Bookmarks"
                    >
                        ⭐
                    </button>
                    <button
                        className={`toolbar-btn ${showHistoryPanel ? 'active' : ''}`}
                        onClick={() => {
                            setShowHistoryPanel(!showHistoryPanel);
                            setShowBookmarksPanel(false);
                            setShowDownloadsPanel(false);
                            setShowSettingsMenu(false);
                        }}
                        title="History"
                    >
                        🕐
                    </button>
                    <button
                        className={`toolbar-btn ${showDownloadsPanel ? 'active' : ''}`}
                        onClick={() => {
                            setShowDownloadsPanel(!showDownloadsPanel);
                            setShowBookmarksPanel(false);
                            setShowHistoryPanel(false);
                            setShowSettingsMenu(false);
                        }}
                        title="Downloads"
                    >
                        ⬇️
                    </button>
                    <button
                        className={`toolbar-btn ${showSettingsMenu ? 'active' : ''}`}
                        onClick={() => {
                            setShowSettingsMenu(!showSettingsMenu);
                            setShowBookmarksPanel(false);
                            setShowHistoryPanel(false);
                            setShowDownloadsPanel(false);
                        }}
                        title="Menu"
                    >
                        ⋮
                    </button>
                </div>
            </div>

            {/* Bookmarks Bar (when bookmarks exist) */}
            {bookmarks.length > 0 && (
                <div className="bookmarks-bar">
                    {bookmarks.slice(0, 12).map(bookmark => (
                        <button
                            key={bookmark.id}
                            className="bookmarks-bar-item"
                            onClick={() => openBookmark(bookmark)}
                            title={bookmark.content}
                        >
                            <span>⭐</span>
                            <span>{bookmark.name.length > 15 ? bookmark.name.slice(0, 15) + '...' : bookmark.name}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Main Browser Layout */}
            <div className="browser-layout">
                {/* Most Visited Sidebar */}
                <div className="most-visited-sidebar">
                    <div className="sidebar-title" title="Most Visited This Week">⭐</div>
                    {mostVisited.slice(0, 8).map((site, i) => (
                        <button
                            key={i}
                            className="sidebar-item"
                            title={site.title}
                            onClick={() => navigate(site.url)}
                        >
                            <span className="sidebar-icon">{site.url.includes('google') ? '🔍' : '📄'}</span>
                        </button>
                    ))}
                    {mostVisited.length === 0 && (
                        <div className="sidebar-empty">...</div>
                    )}
                </div>

                <div className="browser-main-content">
                    {tabs.map(tab => (
                        <div
                            key={tab.id}
                            className={`tab-content ${tab.id === activeTabId ? 'active' : ''}`}
                        >
                            {tab.url ? (
                                <webview
                                    ref={(el) => {
                                        if (el && !webviewRefs.current[tab.id]) {
                                            handleWebviewReady(tab.id, el);
                                        }
                                    }}
                                    src={tab.url}
                                    style={{ width: '100%', height: '100%' }}
                                    // @ts-ignore
                                    allowpopups="true"
                                    useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                                />
                            ) : (
                                renderNewTabPage()
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Bookmarks Panel */}
            {showBookmarksPanel && (
                <div className="side-panel bookmarks-panel">
                    <div className="panel-header">
                        <h3>⭐ Bookmarks</h3>
                        <button onClick={() => setShowBookmarksPanel(false)}>✕</button>
                    </div>
                    <div className="panel-content">
                        {bookmarks.length === 0 ? (
                            <div className="empty-panel">
                                <span className="empty-icon">⭐</span>
                                <span>No bookmarks yet</span>
                                <span className="empty-hint">Click the star in the URL bar to bookmark a page</span>
                            </div>
                        ) : (
                            bookmarks.map(bookmark => (
                                <div key={bookmark.id} className="panel-item">
                                    <button
                                        className="item-main"
                                        onClick={() => openBookmark(bookmark)}
                                    >
                                        <span className="item-icon">⭐</span>
                                        <div className="item-info">
                                            <span className="item-title">{bookmark.name}</span>
                                            <span className="item-url">{bookmark.content}</span>
                                        </div>
                                    </button>
                                    <button
                                        className="item-delete"
                                        onClick={() => deleteBookmark(bookmark.id)}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* History Panel */}
            {showHistoryPanel && (
                <div className="side-panel history-panel">
                    <div className="panel-header">
                        <h3>🕐 History</h3>
                        <div className="panel-actions">
                            <button onClick={clearHistory} className="clear-btn">Clear All</button>
                            <button onClick={() => setShowHistoryPanel(false)}>✕</button>
                        </div>
                    </div>
                    <div className="panel-content">
                        {history.length === 0 ? (
                            <div className="empty-panel">
                                <span className="empty-icon">🕐</span>
                                <span>No browsing history</span>
                            </div>
                        ) : (
                            history.map((item, i) => (
                                <div key={i} className="panel-item">
                                    <button
                                        className="item-main"
                                        onClick={() => {
                                            navigate(item.url);
                                            setShowHistoryPanel(false);
                                        }}
                                    >
                                        <span className="item-icon">📄</span>
                                        <div className="item-info">
                                            <span className="item-title">{item.title}</span>
                                            <span className="item-url">{item.url}</span>
                                            <span className="item-time">
                                                {new Date(item.timestamp).toLocaleString()}
                                            </span>
                                        </div>
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Downloads Panel */}
            {showDownloadsPanel && (
                <div className="side-panel downloads-panel">
                    <div className="panel-header">
                        <h3>⬇️ Downloads</h3>
                        <button onClick={() => setShowDownloadsPanel(false)}>✕</button>
                    </div>
                    <div className="panel-content">
                        <div className="empty-panel">
                            <span className="empty-icon">⬇️</span>
                            <span>No downloads</span>
                            <span className="empty-hint">Downloaded files will appear here</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Settings Menu */}
            {showSettingsMenu && (
                <div className="settings-menu">
                    <button onClick={() => createTab()}>
                        <span>➕</span> New Tab
                    </button>
                    <button onClick={toggleIncognito} style={{ color: isIncognito ? '#a78bfa' : 'inherit' }}>
                        <span>🕶️</span> {isIncognito ? 'Exit Incognito' : 'New Incognito Window'}
                    </button>
                    <button onClick={() => window.print()}>
                        <span>🖨️</span> Print Page
                    </button>
                    <button onClick={() => {
                        // Logic to share/install "app" from website
                        const appName = activeTab?.title || "Web App";
                        alert(`Shortcut for "${appName}" added to Desktop!`);
                    }}>
                        <span>📱</span> Create App
                    </button>
                    <div className="menu-divider" />
                    <button onClick={() => {
                        setShowBookmarksPanel(true);
                        setShowSettingsMenu(false);
                    }}>
                        <span>⭐</span> Bookmarks
                    </button>
                    <button onClick={() => {
                        setShowHistoryPanel(true);
                        setShowSettingsMenu(false);
                    }}>
                        <span>🕐</span> History
                    </button>
                    <button onClick={() => {
                        setShowDownloadsPanel(true);
                        setShowSettingsMenu(false);
                    }}>
                        <span>⬇️</span> Downloads
                    </button>
                    <div className="menu-divider" />
                    <button onClick={() => navigate('https://www.google.com')}>
                        <span>🔍</span> Google
                    </button>
                    <button onClick={() => navigate('https://github.com')}>
                        <span>🐙</span> GitHub
                    </button>
                    <div className="menu-divider" />
                    <button onClick={clearHistory}>
                        <span>🗑️</span> Clear History
                    </button>
                </div>
            )}
        </div>
    );
};

export default KDSBrowser;
