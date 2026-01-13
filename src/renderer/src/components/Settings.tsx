import React, { useState } from 'react';
import '../App.css'; // Ensure we have access to common styles
import { useUser } from '../context/UserContext';
import { useFileSystem } from './FileSystem';

interface SettingsProps {
    currentWallpaper: string;
    setWallpaper: (url: string) => void;
    currentAccentColor: string;
    setAccentColor: (color: string) => void;
    currentZoom: number;
    setZoom: (zoom: number) => void;
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
    setZoom
}) => {
    const { currentUser } = useUser();
    const { getChildFiles } = useFileSystem();
    const [activeTab, setActiveTab] = useState('personalization');

    // Load library wallpapers from the 'wallpapers' folder
    const libraryWallpapers = getChildFiles('wallpapers').filter(f =>
        f.type === 'file' && (f.name.match(/\.(png|jpg|jpeg|webp|gif)$/i) || f.mimeType?.startsWith('image/'))
    );

    return (
        <div style={{ display: 'flex', height: '100%', color: '#333', background: '#f5f5f5' }}>
            {/* Sidebar */}
            <div style={{ width: 200, background: '#e5e5e5', padding: '20px 10px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div style={{ padding: '10px 15px', fontWeight: 'bold', fontSize: 18, marginBottom: 10 }}>Settings</div>

                <SidebarItem
                    icon="🎨"
                    label="Personalization"
                    active={activeTab === 'personalization'}
                    onClick={() => setActiveTab('personalization')}
                />
                <SidebarItem
                    icon="ℹ️"
                    label="System Info"
                    active={activeTab === 'info'}
                    onClick={() => setActiveTab('info')}
                />
            </div>

            {/* Content Area */}
            <div style={{ flex: 1, padding: 40, overflowY: 'auto' }}>
                {activeTab === 'personalization' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
                        <div>
                            <h2 style={{ marginBottom: 20, borderBottom: '1px solid #ddd', paddingBottom: 10 }}>Background</h2>

                            <h3 style={{ fontSize: 16, marginBottom: 10, opacity: 0.8 }}>System Wallpapers</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 15, marginBottom: 30 }}>
                                {WALLPAPERS.map((wp) => (
                                    <div
                                        key={wp.url}
                                        onClick={() => setWallpaper(wp.url)}
                                        style={{
                                            cursor: 'pointer',
                                            borderRadius: 8,
                                            overflow: 'hidden',
                                            border: currentWallpaper === wp.url ? `3px solid ${currentAccentColor}` : '3px solid transparent',
                                            position: 'relative',
                                            filter: currentWallpaper === wp.url ? 'none' : 'grayscale(0.4)',
                                            transition: '0.2s'
                                        }}
                                    >
                                        <img src={wp.url} alt={wp.name} style={{ width: '100%', height: 100, objectFit: 'cover', display: 'block' }} />
                                        <div style={{ padding: 8, background: 'white', fontSize: 12, fontWeight: 500 }}>{wp.name}</div>
                                    </div>
                                ))}
                            </div>

                            {libraryWallpapers.length > 0 && (
                                <>
                                    <h3 style={{ fontSize: 16, marginBottom: 10, opacity: 0.8 }}>Library Wallpapers</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 15, marginBottom: 30 }}>
                                        {libraryWallpapers.map((f) => (
                                            <div
                                                key={f.id}
                                                onClick={() => setWallpaper(f.content || '')}
                                                style={{
                                                    cursor: 'pointer',
                                                    borderRadius: 8,
                                                    overflow: 'hidden',
                                                    border: currentWallpaper === f.content ? `3px solid ${currentAccentColor}` : '3px solid transparent',
                                                    position: 'relative',
                                                    filter: currentWallpaper === f.content ? 'none' : 'grayscale(0.4)',
                                                    transition: '0.2s'
                                                }}
                                            >
                                                <img src={f.content} alt={f.name} style={{ width: '100%', height: 100, objectFit: 'cover', display: 'block' }} />
                                                <div style={{ padding: 8, background: 'white', fontSize: 12, fontWeight: 500 }}>{f.name}</div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}

                            <div style={{ marginTop: 15 }}>
                                <label style={{ display: 'block', marginBottom: 5, fontSize: 14 }}>Custom Wallpaper URL:</label>
                                <input
                                    type="text"
                                    value={currentWallpaper}
                                    onChange={(e) => setWallpaper(e.target.value)}
                                    style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
                                />
                                <p style={{ fontSize: 11, color: '#666', marginTop: 5 }}>
                                    Tip: You can add wallpapers to your library by putting images in the &quot;Wallpapers&quot; folder using File Explorer.
                                </p>
                            </div>
                        </div>

                        <div>
                            <h2 style={{ marginBottom: 20, borderBottom: '1px solid #ddd', paddingBottom: 10 }}>Display Scaling</h2>
                            <div style={{ background: 'white', padding: 20, borderRadius: 8, border: '1px solid #eee' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                                    <span style={{ fontSize: 14, fontWeight: 500 }}>Zoom Level: {Math.round(currentZoom * 100)}%</span>
                                    <button
                                        onClick={() => setZoom(1.0)}
                                        style={{
                                            padding: '2px 8px', fontSize: 11, borderRadius: 4,
                                            background: '#eee', border: '1px solid #ccc', cursor: 'pointer'
                                        }}
                                    >
                                        Reset to 100%
                                    </button>
                                </div>
                                <input
                                    type="range"
                                    min="0.5"
                                    max="1.5"
                                    step="0.05"
                                    value={currentZoom}
                                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                                    style={{ width: '100%', accentColor: currentAccentColor }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#666', marginTop: 5 }}>
                                    <span>50% (Compact)</span>
                                    <span>100% (Standard)</span>
                                    <span>150% (Large)</span>
                                </div>
                                <p style={{ fontSize: 12, color: '#666', marginTop: 15 }}>
                                    Adjusting this will scale the entire interface. If things look "too zoomed in", try setting this to 80% or 90%.
                                </p>
                            </div>
                        </div>

                        <div>
                            <h2 style={{ marginBottom: 20, borderBottom: '1px solid #ddd', paddingBottom: 10 }}>Accent Color</h2>
                            <div style={{ display: 'flex', gap: 15, flexWrap: 'wrap' }}>
                                {ACCENT_COLORS.map((color) => (
                                    <div
                                        key={color.value}
                                        onClick={() => setAccentColor(color.value)}
                                        style={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: '50%',
                                            background: color.value,
                                            cursor: 'pointer',
                                            border: currentAccentColor === color.value ? '3px solid #333' : '3px solid transparent',
                                            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                                            transform: currentAccentColor === color.value ? 'scale(1.1)' : 'scale(1)',
                                            transition: '0.2s'
                                        }}
                                        title={color.name}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'info' && (
                    <div>
                        <h2 style={{ marginBottom: 20 }}>System Information</h2>
                        <div style={{ background: 'white', padding: 20, borderRadius: 8, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                            <p><strong>OS Version:</strong> Cordoval OS v1.0</p>
                            <p><strong>User:</strong> {currentUser?.name}</p>
                            <p><strong>Browser Engine:</strong> KDS WebKit</p>
                            <p><strong>Status:</strong> Online</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

interface SidebarItemProps {
    icon: string;
    label: string;
    active: boolean;
    onClick: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, active, onClick }) => (
    <div
        onClick={onClick}
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 15px',
            borderRadius: 6,
            cursor: 'pointer',
            background: active ? '#ddd' : 'transparent',
            fontWeight: active ? 600 : 400
        }}
    >
        <span>{icon}</span>
        <span>{label}</span>
    </div>
);
