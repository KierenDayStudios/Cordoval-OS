import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// --- KDS Virtual File System Types ---
export interface VirtualFile {
    id: string;
    name: string;
    type: 'file' | 'folder';
    parentId: string | null;
    content?: string; // For files only
    mimeType?: string;
    size?: number;
    createdAt: Date;
    modifiedAt: Date;
    icon?: string;
}

export interface FileSystemState {
    files: VirtualFile[];
    currentFolderId: string | null;
}

// --- Default System Folders ---
const DEFAULT_FOLDERS: VirtualFile[] = [
    {
        id: 'root',
        name: 'My Files',
        type: 'folder',
        parentId: null,
        createdAt: new Date(),
        modifiedAt: new Date(),
        icon: '📁'
    },
    {
        id: 'documents',
        name: 'Documents',
        type: 'folder',
        parentId: 'root',
        createdAt: new Date(),
        modifiedAt: new Date(),
        icon: '📄'
    },
    {
        id: 'downloads',
        name: 'Downloads',
        type: 'folder',
        parentId: 'root',
        createdAt: new Date(),
        modifiedAt: new Date(),
        icon: '⬇️'
    },
    {
        id: 'bookmarks',
        name: 'Bookmarks',
        type: 'folder',
        parentId: 'root',
        createdAt: new Date(),
        modifiedAt: new Date(),
        icon: '⭐'
    },
    {
        id: 'pictures',
        name: 'Pictures',
        type: 'folder',
        parentId: 'root',
        createdAt: new Date(),
        modifiedAt: new Date(),
        icon: '🖼️'
    },
    {
        id: 'notes',
        name: 'Notes',
        type: 'folder',
        parentId: 'root',
        createdAt: new Date(),
        modifiedAt: new Date(),
        icon: '📝'
    },
    {
        id: 'wallpapers',
        name: 'Wallpapers',
        type: 'folder',
        parentId: 'root',
        createdAt: new Date(),
        modifiedAt: new Date(),
        icon: '🖼️'
    },
];

// --- File System Context ---
interface FileSystemContextType {
    files: VirtualFile[];
    currentFolder: VirtualFile | null;
    currentFolderId: string | null;

    // Navigation
    navigateToFolder: (folderId: string) => void;
    navigateUp: () => void;
    getBreadcrumbs: () => VirtualFile[];

    // File Operations
    createFile: (name: string, content: string, mimeType?: string, parentId?: string) => VirtualFile;
    createFolder: (name: string, parentId?: string) => VirtualFile;
    renameFile: (fileId: string, newName: string) => void;
    deleteFile: (fileId: string) => void;
    moveFile: (fileId: string, newParentId: string) => void;
    getFileContent: (fileId: string) => string | undefined;
    updateFileContent: (fileId: string, content: string) => void;

    // Queries
    getChildFiles: (folderId: string) => VirtualFile[];
    getFileById: (fileId: string) => VirtualFile | undefined;
    searchFiles: (query: string) => VirtualFile[];

    // Bookmark specific operations
    addBookmark: (name: string, url: string) => VirtualFile;
    getBookmarks: () => VirtualFile[];
    deleteBookmark: (bookmarkId: string) => void;
}

const FileSystemContext = createContext<FileSystemContextType | undefined>(undefined);

// --- Storage Keys ---
const BASE_STORAGE_KEY = 'kds-virtual-filesystem';

// --- File System Provider ---
export const FileSystemProvider: React.FC<{ children: ReactNode; userId?: string }> = ({ children, userId }) => {
    const getStorageKey = () => userId ? `${BASE_STORAGE_KEY}-${userId}` : BASE_STORAGE_KEY;

    const [files, setFiles] = useState<VirtualFile[]>(() => {
        // Initial load key
        const key = userId ? `${BASE_STORAGE_KEY}-${userId}` : BASE_STORAGE_KEY;
        const saved = localStorage.getItem(key);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return parsed.map((f: any) => ({
                    ...f,
                    createdAt: new Date(f.createdAt),
                    modifiedAt: new Date(f.modifiedAt)
                }));
            } catch {
                return DEFAULT_FOLDERS;
            }
        }
        return DEFAULT_FOLDERS;
    });

    const [currentFolderId, setCurrentFolderId] = useState<string>('root');

    // Handle user change
    useEffect(() => {
        const key = getStorageKey();
        const saved = localStorage.getItem(key);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setFiles(parsed.map((f: any) => ({
                    ...f,
                    createdAt: new Date(f.createdAt),
                    modifiedAt: new Date(f.modifiedAt)
                })));
            } catch {
                setFiles(DEFAULT_FOLDERS);
            }
        } else {
            setFiles(DEFAULT_FOLDERS);
        }
        setCurrentFolderId('root');
    }, [userId]);

    // Persist to localStorage
    useEffect(() => {
        localStorage.setItem(getStorageKey(), JSON.stringify(files));
    }, [files, userId]);

    // --- Helper Functions ---
    const generateId = () => `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const currentFolder = files.find(f => f.id === currentFolderId) || null;

    const navigateToFolder = (folderId: string) => {
        const folder = files.find(f => f.id === folderId && f.type === 'folder');
        if (folder) {
            setCurrentFolderId(folderId);
        }
    };

    const navigateUp = () => {
        if (currentFolder && currentFolder.parentId) {
            setCurrentFolderId(currentFolder.parentId);
        }
    };

    const getBreadcrumbs = (): VirtualFile[] => {
        const crumbs: VirtualFile[] = [];
        let current = currentFolder;
        while (current) {
            crumbs.unshift(current);
            current = files.find(f => f.id === current!.parentId) || null;
        }
        return crumbs;
    };

    const createFile = (name: string, content: string, mimeType = 'text/plain', parentId = currentFolderId): VirtualFile => {
        const newFile: VirtualFile = {
            id: generateId(),
            name,
            type: 'file',
            parentId,
            content,
            mimeType,
            size: content.length,
            createdAt: new Date(),
            modifiedAt: new Date(),
            icon: getFileIcon(name, mimeType)
        };
        setFiles(prev => [...prev, newFile]);
        return newFile;
    };

    const createFolder = (name: string, parentId = currentFolderId): VirtualFile => {
        const newFolder: VirtualFile = {
            id: generateId(),
            name,
            type: 'folder',
            parentId,
            createdAt: new Date(),
            modifiedAt: new Date(),
            icon: '📁'
        };
        setFiles(prev => [...prev, newFolder]);
        return newFolder;
    };

    const renameFile = (fileId: string, newName: string) => {
        setFiles(prev => prev.map(f =>
            f.id === fileId ? { ...f, name: newName, modifiedAt: new Date() } : f
        ));
    };

    const deleteFile = (fileId: string) => {
        // Also delete all children if it's a folder
        const toDelete = new Set<string>([fileId]);
        const findChildren = (parentId: string) => {
            files.forEach(f => {
                if (f.parentId === parentId) {
                    toDelete.add(f.id);
                    if (f.type === 'folder') {
                        findChildren(f.id);
                    }
                }
            });
        };
        const file = files.find(f => f.id === fileId);
        if (file?.type === 'folder') {
            findChildren(fileId);
        }
        setFiles(prev => prev.filter(f => !toDelete.has(f.id)));
    };

    const moveFile = (fileId: string, newParentId: string) => {
        setFiles(prev => prev.map(f =>
            f.id === fileId ? { ...f, parentId: newParentId, modifiedAt: new Date() } : f
        ));
    };

    const getFileContent = (fileId: string): string | undefined => {
        return files.find(f => f.id === fileId)?.content;
    };

    const updateFileContent = (fileId: string, content: string) => {
        setFiles(prev => prev.map(f =>
            f.id === fileId ? { ...f, content, size: content.length, modifiedAt: new Date() } : f
        ));
    };

    const getChildFiles = (folderId: string): VirtualFile[] => {
        return files.filter(f => f.parentId === folderId);
    };

    const getFileById = (fileId: string): VirtualFile | undefined => {
        return files.find(f => f.id === fileId);
    };

    const searchFiles = (query: string): VirtualFile[] => {
        const lowerQuery = query.toLowerCase();
        return files.filter(f => f.name.toLowerCase().includes(lowerQuery));
    };

    // --- Bookmark Specific ---
    const addBookmark = (name: string, url: string): VirtualFile => {
        const bookmark: VirtualFile = {
            id: generateId(),
            name,
            type: 'file',
            parentId: 'bookmarks',
            content: url,
            mimeType: 'application/x-bookmark',
            createdAt: new Date(),
            modifiedAt: new Date(),
            icon: '⭐'
        };
        setFiles(prev => [...prev, bookmark]);
        return bookmark;
    };

    const getBookmarks = (): VirtualFile[] => {
        return files.filter(f => f.parentId === 'bookmarks' && f.mimeType === 'application/x-bookmark');
    };

    const deleteBookmark = (bookmarkId: string) => {
        deleteFile(bookmarkId);
    };

    return (
        <FileSystemContext.Provider
            value={{
                files,
                currentFolder,
                currentFolderId,
                navigateToFolder,
                navigateUp,
                getBreadcrumbs,
                createFile,
                createFolder,
                renameFile,
                deleteFile,
                moveFile,
                getFileContent,
                updateFileContent,
                getChildFiles,
                getFileById,
                searchFiles,
                addBookmark,
                getBookmarks,
                deleteBookmark
            }}
        >
            {children}
        </FileSystemContext.Provider>
    );
};

// --- Hook to use File System ---
export const useFileSystem = () => {
    const context = useContext(FileSystemContext);
    if (!context) {
        throw new Error('useFileSystem must be used within a FileSystemProvider');
    }
    return context;
};

// --- Helper: Get icon for file type ---
function getFileIcon(name: string, mimeType?: string): string {
    if (mimeType === 'application/x-bookmark') return '⭐';

    const ext = name.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'txt': return '📄';
        case 'md': return '📝';
        case 'json': return '📋';
        case 'html': return '🌐';
        case 'css': return '🎨';
        case 'js': case 'ts': return '⚙️';
        case 'png': case 'jpg': case 'jpeg': case 'gif': case 'webp': return '🖼️';
        case 'pdf': return '📕';
        case 'zip': case 'rar': return '📦';
        default: return '📄';
    }
}

export { FileSystemContext };
