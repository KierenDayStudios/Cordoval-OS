import React, { useState } from 'react';
import '../App.css';
import { useUser } from '../context/UserContext';
import { useFileSystem } from './FileSystem';
import { ModernIcon } from './ModernIcon';
import { loadAIConfig, saveAIConfig, AIConfig } from '../services/AIService';

interface SettingsProps {
    currentWallpaper: string;
    setWallpaper: (url: string) => void;
    currentAccentColor: string;
    setAccentColor: (color: string) => void;
    currentZoom: number;
    setZoom: (zoom: number) => void;
    currentUpdateStatus: { status: string; version?: string; percent?: number; message?: string } | null;
    onCheckUpdate: () => void;
    onDownloadUpdate: () => void;
    onInstallUpdate: () => void;
}

const WALLPAPERS = [
    { name: 'Abstract Blue Wave', url: './wallpapers/abstract_blue_wave.png' },
    { name: 'Dark Mountain', url: './wallpapers/dark_mountain.png' },
    { name: 'Neon City', url: './wallpapers/neon_city.png' },
    { name: 'Blue Abstract (Classic)', url: 'https://storage.cloud.google.com/randingstorage/blue-abstract-5120x5120-25023.jpg' },
    { name: 'Dark Nebula', url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=2048&auto=format&fit=crop' },
];

const ACCENT_COLORS = [
    { name: 'Magenta', value: '#d946ef' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Teal', value: '#14b8a6' },
    { name: 'Green', value: '#22c55e' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Red', value: '#ef4444' },
];

export const Settings: React.FC<SettingsProps> = ({
    currentWallpaper,
    setWallpaper,
    currentAccentColor,
    setAccentColor,
    currentZoom,
    setZoom,
    currentUpdateStatus,
    onCheckUpdate,
    onDownloadUpdate,
    onInstallUpdate
}) => {
    const { currentUser } = useUser();
    const { getChildFiles, createFile } = useFileSystem();
    const [activeTab, setActiveTab] = useState('personalization');

    const userId = currentUser?.id || 'default';

    const libraryWallpapers = getChildFiles('wallpapers').filter(f =>
        f.type === 'file' && (f.name.match(/\.(png|jpg|jpeg|webp|gif)$/i) || f.mimeType?.startsWith('image/'))
    );

    const handleWallpaperUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;

            try {
                // We use 'wallpapers' as the parentId. 
                // If the folder doesn't exist, this might just assign the parentId property, which is fine for our filtering.
                // To be robust, one would create the folder, but for now this handles the "failing" part by not erroring out.
                // We also ensure a unique name to avoid collisions.
                const uniqueName = `${Date.now()}_${file.name}`;
                createFile(uniqueName, result, file.type, 'wallpapers');
                setWallpaper(result);
            } catch (error) {
                console.error("Failed to save wallpaper", error);
            }
        };
        reader.readAsDataURL(file);
    };

    return (
        <div style={{ display: 'flex', height: '100%', color: '#333', background: '#f5f5f5' }}>
            <div style={{
                width: 200,
                background: '#e5e5e5',
                padding: '20px 10px',
                display: 'flex',
                flexDirection: 'column',
                gap: 5,
                overflowY: 'auto',
                borderRight: '1px solid rgba(0,0,0,0.05)'
            }}>
                <div style={{ padding: '10px 15px', fontWeight: 'bold', fontSize: 18, marginBottom: 10 }}>Settings</div>

                <SidebarItem icon="Palette" label="Personalization" active={activeTab === 'personalization'} onClick={() => setActiveTab('personalization')} />
                <SidebarItem icon="Info" label="System Info" active={activeTab === 'info'} onClick={() => setActiveTab('info')} />
                <SidebarItem icon="RefreshCcw" label="Updates" active={activeTab === 'updates'} onClick={() => setActiveTab('updates')} />
                <SidebarItem icon="Sparkles" label="AI Assistant" active={activeTab === 'ai'} onClick={() => setActiveTab('ai')} />
            </div>

            <div style={{ flex: 1, padding: 40, overflowY: 'auto', minHeight: 0 }}>
                {activeTab === 'personalization' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
                        <div>
                            <h2 style={{ marginBottom: 20, borderBottom: '1px solid #ddd', paddingBottom: 10 }}>Background</h2>
                            <h3 style={{ fontSize: 16, marginBottom: 10, opacity: 0.8 }}>System Wallpapers</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 15, marginBottom: 30 }}>
                                {WALLPAPERS.map((wp) => (
                                    <div key={wp.url} onClick={() => setWallpaper(wp.url)} style={{ cursor: 'pointer', borderRadius: 8, overflow: 'hidden', border: currentWallpaper === wp.url ? `3px solid ${currentAccentColor}` : '3px solid transparent', position: 'relative', filter: currentWallpaper === wp.url ? 'none' : 'grayscale(0.4)', transition: '0.2s' }}>
                                        <img src={wp.url} alt={wp.name} style={{ width: '100%', height: 100, objectFit: 'cover', display: 'block' }} />
                                        <div style={{ padding: 8, background: 'white', fontSize: 12, fontWeight: 500 }}>{wp.name}</div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginBottom: 30 }}>
                                <h3 style={{ fontSize: 16, marginBottom: 10, opacity: 0.8 }}>Custom Wallpapers</h3>
                                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 15 }}>
                                    <label style={{
                                        padding: '10px 20px',
                                        background: currentAccentColor,
                                        color: 'white',
                                        borderRadius: 8,
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8
                                    }}>
                                        <ModernIcon iconName="Upload" size={18} gradient="transparent" />
                                        Upload Image
                                        <input
                                            type="file"
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                            onChange={handleWallpaperUpload}
                                        />
                                    </label>
                                    <p style={{ fontSize: 12, color: '#666' }}>Supported: JPG, PNG, WEBP</p>
                                </div>

                                {libraryWallpapers.length > 0 && (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 15 }}>
                                        {libraryWallpapers.map((f) => (
                                            <div key={f.id} onClick={() => setWallpaper(f.content || '')} style={{ cursor: 'pointer', borderRadius: 8, overflow: 'hidden', border: currentWallpaper === f.content ? `3px solid ${currentAccentColor}` : '3px solid transparent', position: 'relative', filter: currentWallpaper === f.content ? 'none' : 'grayscale(0.4)', transition: '0.2s' }}>
                                                <img src={f.content} alt={f.name} style={{ width: '100%', height: 100, objectFit: 'cover', display: 'block' }} />
                                                <div style={{ padding: 8, background: 'white', fontSize: 12, fontWeight: 500 }}>{f.name}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div style={{ marginTop: 15 }}>
                                <label style={{ display: 'block', marginBottom: 5, fontSize: 14 }}>Custom Wallpaper URL:</label>
                                <input type="text" value={currentWallpaper} onChange={(e) => setWallpaper(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }} />
                            </div>
                        </div>

                        <div>
                            <h2 style={{ marginBottom: 20, borderBottom: '1px solid #ddd', paddingBottom: 10 }}>Display Scaling</h2>
                            <div style={{ background: 'white', padding: 20, borderRadius: 8, border: '1px solid #eee' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                                    <span style={{ fontSize: 14, fontWeight: 500 }}>Zoom Level: {Math.round(currentZoom * 100)}%</span>
                                    <button onClick={() => setZoom(1.0)} style={{ padding: '2px 8px', fontSize: 11, borderRadius: 4, background: '#eee', border: '1px solid #ccc', cursor: 'pointer' }}>Reset to 100%</button>
                                </div>
                                <input type="range" min="0.5" max="1.5" step="0.05" value={currentZoom} onChange={(e) => setZoom(parseFloat(e.target.value))} style={{ width: '100%', accentColor: currentAccentColor }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#666', marginTop: 5 }}>
                                    <span>50% (Compact)</span>
                                    <span>100% (Standard)</span>
                                    <span>150% (Large)</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h2 style={{ marginBottom: 20, borderBottom: '1px solid #ddd', paddingBottom: 10 }}>Accent Color</h2>
                            <div style={{ display: 'flex', gap: 15, flexWrap: 'wrap' }}>
                                {ACCENT_COLORS.map((color) => (
                                    <div key={color.value} onClick={() => setAccentColor(color.value)} style={{ width: 40, height: 40, borderRadius: '50%', background: color.value, cursor: 'pointer', border: currentAccentColor === color.value ? '3px solid #333' : '3px solid transparent', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', transform: currentAccentColor === color.value ? 'scale(1.1)' : 'scale(1)', transition: '0.2s' }} title={color.name} />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'updates' && (
                    <div>
                        <h2 style={{ marginBottom: 20, borderBottom: '1px solid #ddd', paddingBottom: 10 }}>Software Updates</h2>
                        <div style={{ background: 'white', padding: 25, borderRadius: 12, border: '1px solid #eee' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 20 }}>
                                <div style={{ fontSize: 40 }}>🚀</div>
                                <div>
                                    <div style={{ fontSize: 18, fontWeight: 700 }}>Cordoval OS</div>
                                    <div style={{ fontSize: 13, color: '#666' }}>Version 1.0.0</div>
                                </div>
                            </div>
                            {!currentUpdateStatus || currentUpdateStatus.status === 'not-available' ? (
                                <>
                                    <div style={{ padding: '15px 20px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0', color: '#166534', fontSize: 14, marginBottom: 20 }}>🟢 Your system is up to date.</div>
                                    <button onClick={onCheckUpdate} style={{ padding: '10px 20px', borderRadius: 6, background: '#eee', border: '1px solid #ccc', cursor: 'pointer', fontWeight: 600 }}>Check for Updates</button>
                                </>
                            ) : null}
                            {currentUpdateStatus?.status === 'checking' && <div style={{ fontSize: 14, color: '#666' }}>Checking for updates...</div>}
                            {currentUpdateStatus?.status === 'available' && (
                                <>
                                    <div style={{ padding: '15px 20px', background: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe', color: '#1e40af', fontSize: 14, marginBottom: 20 }}>✨ A new version (v{currentUpdateStatus.version}) is available!</div>
                                    <button onClick={onDownloadUpdate} style={{ padding: '10px 20px', borderRadius: 6, background: currentAccentColor, color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Download Now</button>
                                </>
                            )}
                            {currentUpdateStatus?.status === 'downloading' && (
                                <div>
                                    <div style={{ fontSize: 14, marginBottom: 10 }}>Downloading update... {Math.round(currentUpdateStatus.percent || 0)}%</div>
                                    <div style={{ width: '100%', height: 8, background: '#eee', borderRadius: 4, overflow: 'hidden' }}>
                                        <div style={{ width: `${currentUpdateStatus.percent}%`, height: '100%', background: currentAccentColor, transition: '0.3s' }} />
                                    </div>
                                </div>
                            )}
                            {currentUpdateStatus?.status === 'downloaded' && (
                                <>
                                    <div style={{ padding: '15px 20px', background: '#faf5ff', borderRadius: 8, border: '1px solid #e9d5ff', color: '#6b21a8', fontSize: 14, marginBottom: 20 }}>✅ Update ready to install.</div>
                                    <button onClick={onInstallUpdate} style={{ padding: '10px 20px', borderRadius: 6, background: '#10b981', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Restart & Install</button>
                                </>
                            )}
                            {currentUpdateStatus?.status === 'error' && <div style={{ padding: '15px 20px', background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca', color: '#991b1b', fontSize: 14 }}>❌ Error: {currentUpdateStatus.message}</div>}
                        </div>
                    </div>
                )}

                {activeTab === 'ai' && <AIConfiguration userId={userId} accentColor={currentAccentColor} />}
            </div>
        </div>
    );
};

interface AIConfigurationProps { userId: string; accentColor: string; }

const AIConfiguration: React.FC<AIConfigurationProps> = ({ userId, accentColor }) => {
    const [config, setConfig] = useState<AIConfig>(() => loadAIConfig(userId) || { provider: 'gemini', apiKey: '' });
    const [saved, setSaved] = useState(false);

    // Memory State
    const { files, createFile, createFolder, updateFileContent, getFileContent } = useFileSystem();
    const [memory, setMemory] = useState<Record<string, string>>({});
    const [newKey, setNewKey] = useState('');
    const [newValue, setNewValue] = useState('');
    const [memoryFileId, setMemoryFileId] = useState<string | null>(null);

    // Load Memory on Mount
    useEffect(() => {
        const loadMemory = async () => {
            // Find or Create /system/ai/memory.json
            let systemFolder = files.find(f => f.name === 'System' && f.type === 'folder');
            if (!systemFolder) systemFolder = createFolder('System', 'root');

            let aiFolder = files.find(f => f.name === 'AI' && f.type === 'folder' && f.parentId === systemFolder.id);
            if (!aiFolder) aiFolder = createFolder('AI', systemFolder.id);

            let memFile = files.find(f => f.name === 'memory.json' && f.parentId === aiFolder!.id);
            if (!memFile) {
                memFile = createFile('memory.json', '{}', 'application/json', aiFolder!.id);
            }

            setMemoryFileId(memFile.id);
            if (memFile.content) {
                try {
                    setMemory(JSON.parse(memFile.content));
                } catch {
                    setMemory({});
                }
            }
        };
        loadMemory();
    }, [files]); // Reacting to files allows it to load after creation

    const handleSave = () => {
        saveAIConfig(userId, config);
        // Save Memory
        if (memoryFileId) {
            updateFileContent(memoryFileId, JSON.stringify(memory, null, 2));
        }
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const addMemory = () => {
        if (newKey && newValue) {
            setMemory(prev => ({ ...prev, [newKey]: newValue }));
            setNewKey('');
            setNewValue('');
        }
    };

    const deleteMemory = (key: string) => {
        const newMem = { ...memory };
        delete newMem[key];
        setMemory(newMem);
    };

    return (
        <div>
            <h2 style={{ marginBottom: 20, borderBottom: '1px solid #ddd', paddingBottom: 10 }}>AgentX Configuration</h2>
            <div style={{ background: 'white', padding: 25, borderRadius: 12, border: '1px solid #eee', display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Identity */}
                <div>
                    <h3 style={{ fontSize: 16, marginBottom: 15, color: '#333' }}>Identity</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600 }}>Agent Name</label>
                            <input type="text" value={config.agentName || ''} onChange={(e) => setConfig({ ...config, agentName: e.target.value })} placeholder="AgentX" style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid #ccc' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600 }}>AI Provider</label>
                            <select value={config.provider} onChange={(e) => setConfig({ ...config, provider: e.target.value as any })} style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid #ccc' }}>
                                <option value="gemini">Google Gemini (Recommended)</option>
                                <option value="openai">OpenAI (ChatGPT)</option>
                            </select>
                        </div>
                    </div>
                    <div style={{ marginTop: 15 }}>
                        <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600 }}>Personality (System Prompt)</label>
                        <textarea
                            value={config.systemPrompt || ''}
                            onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
                            placeholder="You are a helpful assistant..."
                            style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid #ccc', minHeight: 80, fontFamily: 'sans-serif' }}
                        />
                    </div>
                    <div style={{ marginTop: 15 }}>
                        <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600 }}>API Key</label>
                        <input type="password" value={config.apiKey} onChange={(e) => setConfig({ ...config, apiKey: e.target.value })} placeholder="sk-..." style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid #ccc' }} />
                    </div>
                </div>

                {/* Memory Management */}
                <div style={{ borderTop: '1px solid #eee', paddingTop: 20 }}>
                    <h3 style={{ fontSize: 16, marginBottom: 15, color: '#333' }}>Long-Term Memory</h3>
                    <p style={{ fontSize: 13, color: '#666', marginBottom: 15 }}>The AI remembers these facts about you and the platform. Stored in <code>/System/AI/memory.json</code>.</p>

                    <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
                        <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                            {Object.entries(memory).map(([k, v]) => (
                                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid #e5e7eb', fontSize: 13 }}>
                                    <div><span style={{ fontWeight: 600, color: '#374151' }}>{k}:</span> <span style={{ color: '#4b5563' }}>{v}</span></div>
                                    <button onClick={() => deleteMemory(k)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
                                </div>
                            ))}
                            {Object.keys(memory).length === 0 && <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No memories yet. Add one below!</div>}
                        </div>
                        <div style={{ display: 'flex', padding: 10, gap: 10, background: 'white', borderTop: '1px solid #e5e7eb' }}>
                            <input type="text" placeholder="Key (e.g. My Name)" value={newKey} onChange={(e) => setNewKey(e.target.value)} style={{ flex: 1, padding: '6px 10px', borderRadius: 4, border: '1px solid #ddd', fontSize: 13 }} />
                            <input type="text" placeholder="Value (e.g. Paul)" value={newValue} onChange={(e) => setNewValue(e.target.value)} style={{ flex: 2, padding: '6px 10px', borderRadius: 4, border: '1px solid #ddd', fontSize: 13 }} />
                            <button onClick={addMemory} style={{ padding: '6px 12px', background: accentColor, color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>Add</button>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                    <button onClick={handleSave} style={{ padding: '10px 25px', borderRadius: 6, background: accentColor, color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Save All Changes</button>
                    {saved && <span style={{ color: '#059669', fontSize: 13, fontWeight: 500 }}>✓ Settings Saved</span>}
                </div>
            </div>
        </div>
    );
};

interface SidebarItemProps { icon: string; label: string; active: boolean; onClick: () => void; }

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, active, onClick }) => (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 15px', borderRadius: 6, cursor: 'pointer', background: active ? '#ddd' : 'transparent', fontWeight: active ? 600 : 400 }}>
        <ModernIcon iconName={icon} size={24} gradient="transparent" />
        <span>{label}</span>
    </div>
);
