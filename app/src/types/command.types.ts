export interface DirectoryEntry {
    name: string;
    type: 'file' | 'folder';
    path: string;
    children?: DirectoryEntry[];
}

export interface EditorResponse {
    status?: string;
    error?: string;
    content?: string;
    entries?: DirectoryEntry[];
    positions?: number[];
    chars?: number;
    words?: number;
    lines?: number;
    data?: {
        entries: DirectoryEntry[]
    }
}