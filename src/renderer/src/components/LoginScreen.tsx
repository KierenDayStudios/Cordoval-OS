import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import './LoginScreen.css';

const AVATAR_OPTIONS = ['👨‍💻', '🚀', '💼', '🎨', '🕹️', '🌐', '🤖', '👑', '🐯', '⚡', '🌟', '💎'];

export const LoginScreen = () => {
    const { profiles, createProfile, login, deleteProfile } = useUser();
    const [isSetupMode, setIsSetupMode] = useState(false);

    // Setup Wizard State
    const [newName, setNewName] = useState('');
    const [newAvatar, setNewAvatar] = useState(AVATAR_OPTIONS[0]);

    const handleCreate = () => {
        if (!newName.trim()) return;
        createProfile(newName, newAvatar);
        setIsSetupMode(false);
        setNewName('');
        setNewAvatar(AVATAR_OPTIONS[0]);
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this profile? This cannot be undone.')) {
            deleteProfile(id);
        }
    };

    return (
        <div className="login-container">
            {/* Background Animated Blobs could go here if using more complex CSS/Canvas */}

            <div className="login-glass-panel">
                {!isSetupMode ? (
                    <>
                        <h1 style={{ margin: '0 0 10px 0', fontSize: 32, fontWeight: 700 }}>Welcome Back</h1>
                        <p style={{ color: '#aaa', margin: '0 0 30px 0' }}>Select your profile to continue</p>

                        <div className="profile-grid">
                            {profiles.map(profile => (
                                <div key={profile.id} className="profile-card" onClick={() => login(profile.id)}>
                                    <div className="delete-btn" onClick={(e) => handleDelete(e, profile.id)}>✕</div>
                                    <div className="profile-avatar">{profile.avatar}</div>
                                    <div className="profile-name">{profile.name}</div>
                                </div>
                            ))}

                            {/* Add Profile Button */}
                            {profiles.length < 10 && (
                                <div className="profile-card add-profile-btn" onClick={() => setIsSetupMode(true)}>
                                    <div className="profile-avatar" style={{ background: 'transparent', border: '2px solid rgba(255,255,255,0.2)' }}>
                                        +
                                    </div>
                                    <div className="profile-name" style={{ color: '#aaa' }}>New Profile</div>
                                </div>
                            )}
                        </div>

                        {profiles.length === 0 && (
                            <div style={{ marginTop: 20, color: '#888', fontStyle: 'italic' }}>
                                No profiles found. Create one to get started.
                            </div>
                        )}
                    </>
                ) : (
                    <div className="setup-wizard">
                        <h2 style={{ textAlign: 'center', margin: 0 }}>Create New Profile</h2>
                        <p style={{ textAlign: 'center', color: '#aaa', fontSize: 14 }}>
                            Set up a separate workspace for your project.
                        </p>

                        <div className="input-group">
                            <label style={{ fontSize: 12, fontWeight: 600, color: '#ccc' }}>PROFILE NAME</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="e.g. Work, Gaming, Project X..."
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                            />
                        </div>

                        <div className="input-group">
                            <label style={{ fontSize: 12, fontWeight: 600, color: '#ccc' }}>CHOOSE AVATAR</label>
                            <div className="avatar-selector">
                                {AVATAR_OPTIONS.map(avi => (
                                    <div
                                        key={avi}
                                        className={`avatar-option ${newAvatar === avi ? 'selected' : ''}`}
                                        onClick={() => setNewAvatar(avi)}
                                    >
                                        {avi}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button className="action-btn" onClick={handleCreate}>
                            Start Workspace
                        </button>
                        <button className="secondary-btn" onClick={() => setIsSetupMode(false)}>
                            Cancel
                        </button>
                    </div>
                )}
            </div>

            <div style={{ position: 'absolute', bottom: 20, color: '#555', fontSize: 12 }}>
                KDS Cordoval-OS v1.0 • Secure Local Environment
            </div>
        </div>
    );
};
