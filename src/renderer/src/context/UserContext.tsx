import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// --- Types ---
export interface UserProfile {
    id: string;
    name: string;
    avatar: string; // Emoji or URL
    theme: 'light' | 'dark'; // Basic theme preference if needed
    createdAt: number;
}

interface UserContextType {
    profiles: UserProfile[];
    currentUser: UserProfile | null;
    createProfile: (name: string, avatar: string) => void;
    deleteProfile: (id: string) => void;
    login: (id: string) => void;
    logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const PROFILES_STORAGE_KEY = 'cordoval-profiles';
const LAST_USER_KEY = 'cordoval-last-user';

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [profiles, setProfiles] = useState<UserProfile[]>(() => {
        try {
            const saved = localStorage.getItem(PROFILES_STORAGE_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

    // Persist profiles
    useEffect(() => {
        localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
    }, [profiles]);

    // Actions
    const createProfile = (name: string, avatar: string) => {
        if (profiles.length >= 10) {
            alert("Maximum 10 profiles allowed.");
            return;
        }
        const newProfile: UserProfile = {
            id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            name,
            avatar,
            theme: 'dark', // Default
            createdAt: Date.now(),
        };
        setProfiles([...profiles, newProfile]);
        // Auto login on create? Maybe not, let user choose.
        // setCurrentUser(newProfile); 
    };

    const deleteProfile = (id: string) => {
        setProfiles(profiles.filter(p => p.id !== id));
        if (currentUser?.id === id) {
            logout();
        }
    };

    const login = (id: string) => {
        const profile = profiles.find(p => p.id === id);
        if (profile) {
            setCurrentUser(profile);
            localStorage.setItem(LAST_USER_KEY, id);
        }
    };

    const logout = () => {
        setCurrentUser(null);
        localStorage.removeItem(LAST_USER_KEY);
    };

    return (
        <UserContext.Provider value={{ profiles, currentUser, createProfile, deleteProfile, login, logout }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
