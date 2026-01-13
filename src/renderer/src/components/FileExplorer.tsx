import React, { useState } from 'react';
import { useFileSystem, VirtualFile } from './FileSystem';
import './FileExplorer.css';

interface FileExplorerProps {
    onOpenFile?: (file: VirtualFile) => void;
    compact?: boolean;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({ onOpenFile, compact = false }) => {
    const {
        currentFolder,
        currentFolderId,
        navigateToFolder,
        navigateUp,
        getBreadcrumbs,
        createFolder,
        renameFile,
        deleteFile,
        getChildFiles,
    } = useFileSystem();

    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('New Folder');
    const [editingFileId, setEditingFileId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file: VirtualFile } | null>(null);

    const childFiles = getChildFiles(currentFolderId || 'root');
    const breadcrumbs = getBreadcrumbs();

    // Sort: folders first, then files
    const sortedFiles = [...childFiles].sort((a, b) => {
        if (a.type === 'folder' && b.type !== 'folder') return -1;
        if (a.type !== 'folder' && b.type === 'folder') return 1;
        return a.name.localeCompare(b.name);
    });

    const handleFileClick = (file: VirtualFile) => {
        setSelectedFile(file.id);
        setContextMenu(null);
    };

    const handleFileDoubleClick = (file: VirtualFile) => {
        if (file.type === 'folder') {
            navigateToFolder(file.id);
        } else if (onOpenFile) {
            onOpenFile(file);
        }
    };

    const handleContextMenu = (e: React.MouseEvent, file: VirtualFile) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, file });
        setSelectedFile(file.id);
    };

    const handleRename = () => {
        if (contextMenu) {
            setEditingFileId(contextMenu.file.id);
            setEditingName(contextMenu.file.name);
            setContextMenu(null);
        }
    };

    const handleRenameSubmit = () => {
        if (editingFileId && editingName.trim()) {
            renameFile(editingFileId, editingName.trim());
        }
        setEditingFileId(null);
        setEditingName('');
    };

    const handleDelete = () => {
        if (contextMenu) {
            const isSystemFolder = ['root', 'documents', 'downloads', 'bookmarks', 'pictures', 'notes'].includes(contextMenu.file.id);
            if (!isSystemFolder) {
                deleteFile(contextMenu.file.id);
            }
            setContextMenu(null);
        }
    };

    const handleCreateFolder = () => {
        if (newFolderName.trim()) {
            createFolder(newFolderName.trim());
            setIsCreatingFolder(false);
            setNewFolderName('New Folder');
        }
    };

    const formatFileSize = (bytes?: number): string => {
        if (!bytes) return '-';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const formatDate = (date: Date): string => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className={`file-explorer ${compact ? 'compact' : ''}`} onClick={() => setContextMenu(null)}>
            {/* Toolbar */}
            <div className="explorer-toolbar">
                <div className="toolbar-nav">
                    <button
                        className="nav-btn"
                        onClick={navigateUp}
                        disabled={!currentFolder?.parentId}
                        title="Go up"
                    >
                        ⬆️
                    </button>
                    <button
                        className="nav-btn"
                        onClick={() => navigateToFolder('root')}
                        title="Go to root"
                    >
                        🏠
                    </button>
                </div>

                {/* Breadcrumbs */}
                <div className="breadcrumbs">
                    {breadcrumbs.map((crumb, i) => (
                        <React.Fragment key={crumb.id}>
                            {i > 0 && <span className="breadcrumb-separator">/</span>}
                            <button
                                className="breadcrumb-item"
                                onClick={() => navigateToFolder(crumb.id)}
                            >
                                {crumb.name}
                            </button>
                        </React.Fragment>
                    ))}
                </div>

                <div className="toolbar-actions">
                    <button
                        className="action-btn"
                        onClick={() => setIsCreatingFolder(true)}
                        title="New folder"
                    >
                        📁+
                    </button>
                    <button
                        className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                        onClick={() => setViewMode('grid')}
                        title="Grid view"
                    >
                        ⊞
                    </button>
                    <button
                        className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                        onClick={() => setViewMode('list')}
                        title="List view"
                    >
                        ☰
                    </button>
                </div>
            </div>

            {/* New Folder Dialog */}
            {isCreatingFolder && (
                <div className="new-folder-dialog">
                    <input
                        type="text"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                        autoFocus
                        placeholder="Folder name"
                    />
                    <button onClick={handleCreateFolder}>Create</button>
                    <button onClick={() => setIsCreatingFolder(false)}>Cancel</button>
                </div>
            )}

            {/* Files View */}
            {viewMode === 'grid' ? (
                <div className="files-grid">
                    {sortedFiles.length === 0 ? (
                        <div className="empty-folder">
                            <span className="empty-icon">📂</span>
                            <span>This folder is empty</span>
                        </div>
                    ) : (
                        sortedFiles.map(file => (
                            <div
                                key={file.id}
                                className={`file-item ${selectedFile === file.id ? 'selected' : ''}`}
                                onClick={() => handleFileClick(file)}
                                onDoubleClick={() => handleFileDoubleClick(file)}
                                onContextMenu={(e) => handleContextMenu(e, file)}
                            >
                                <div className="file-icon">{file.icon || (file.type === 'folder' ? '📁' : '📄')}</div>
                                {editingFileId === file.id ? (
                                    <input
                                        type="text"
                                        value={editingName}
                                        onChange={(e) => setEditingName(e.target.value)}
                                        onBlur={handleRenameSubmit}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleRenameSubmit();
                                            if (e.key === 'Escape') setEditingFileId(null);
                                        }}
                                        autoFocus
                                        className="rename-input"
                                    />
                                ) : (
                                    <span className="file-name">{file.name}</span>
                                )}
                            </div>
                        ))
                    )}
                </div>
            ) : (
                <div className="files-list">
                    <div className="list-header">
                        <span className="col-name">Name</span>
                        <span className="col-size">Size</span>
                        <span className="col-modified">Modified</span>
                    </div>
                    {sortedFiles.length === 0 ? (
                        <div className="empty-folder">
                            <span className="empty-icon">📂</span>
                            <span>This folder is empty</span>
                        </div>
                    ) : (
                        sortedFiles.map(file => (
                            <div
                                key={file.id}
                                className={`list-item ${selectedFile === file.id ? 'selected' : ''}`}
                                onClick={() => handleFileClick(file)}
                                onDoubleClick={() => handleFileDoubleClick(file)}
                                onContextMenu={(e) => handleContextMenu(e, file)}
                            >
                                <span className="col-name">
                                    <span className="list-icon">{file.icon || (file.type === 'folder' ? '📁' : '📄')}</span>
                                    {editingFileId === file.id ? (
                                        <input
                                            type="text"
                                            value={editingName}
                                            onChange={(e) => setEditingName(e.target.value)}
                                            onBlur={handleRenameSubmit}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleRenameSubmit();
                                                if (e.key === 'Escape') setEditingFileId(null);
                                            }}
                                            autoFocus
                                            className="rename-input"
                                        />
                                    ) : (
                                        <span>{file.name}</span>
                                    )}
                                </span>
                                <span className="col-size">{file.type === 'folder' ? '-' : formatFileSize(file.size)}</span>
                                <span className="col-modified">{formatDate(file.modifiedAt)}</span>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Context Menu */}
            {contextMenu && (
                <div
                    className="context-menu"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button onClick={() => handleFileDoubleClick(contextMenu.file)}>
                        {contextMenu.file.type === 'folder' ? 'Open' : 'Open'}
                    </button>
                    <button onClick={handleRename}>Rename</button>
                    <div className="context-divider" />
                    <button
                        onClick={handleDelete}
                        disabled={['root', 'documents', 'downloads', 'bookmarks', 'pictures', 'notes'].includes(contextMenu.file.id)}
                        className="delete"
                    >
                        Delete
                    </button>
                </div>
            )}
        </div>
    );
};

export default FileExplorer;
