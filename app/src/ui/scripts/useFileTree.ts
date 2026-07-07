import { ref, computed, watch } from 'vue';
import { open } from '@tauri-apps/plugin-dialog';
import { CoreService } from '../../functions/core.ts';
import { DirectoryEntry } from '../../types/command.types.ts';

const STORAGE_KEY_WORKSPACE = 'textpad_workspace_path';
const STORAGE_KEY_EXPANDED = 'textpad_expanded_folders';

function sortEntries(entries: DirectoryEntry[]): DirectoryEntry[] {
    const folders = entries.filter(e => e.type === 'folder');
    const files = entries.filter(e => e.type === 'file');
    const sortFn = (a: DirectoryEntry, b: DirectoryEntry) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    folders.sort(sortFn);
    files.sort(sortFn);
    return [...folders, ...files];
}

const fileTree = ref<DirectoryEntry[]>([]);
const currentPath = ref<string | null>(null);
const expandedFolders = ref<Set<string>>(new Set());
const selectedPath = ref<string | null>(null);
const loadedFolders = ref<Set<string>>(new Set());
let restored = false;

watch(expandedFolders, (set) => {
    localStorage.setItem(STORAGE_KEY_EXPANDED, JSON.stringify([...set]));
}, { deep: true });

export function useFileTree() {
    const folderName = computed(() => {
        if (!currentPath.value) return 'No folder selected';
        const name = currentPath.value.split(/[\\/]/).pop();
        return name || currentPath.value;
    });
    const headerPath = computed(() => {
        if (!currentPath.value) return 'No folder selected';
        return folderName.value;
    });

    async function loadFolder(path: string) {
        currentPath.value = path;
        loadedFolders.value = new Set();
        try {
            const response = await CoreService.sendCommand('SCAN', path);
            if (!response || response.error) {
                fileTree.value = [];
                localStorage.removeItem(STORAGE_KEY_WORKSPACE);
                currentPath.value = null;
                return;
            }
            const entries = response.entries || response.data?.entries || [];
            if (!Array.isArray(entries)) {
                fileTree.value = [];
                localStorage.removeItem(STORAGE_KEY_WORKSPACE);
                currentPath.value = null;
                return;
            }
            fileTree.value = sortEntries(entries);
            localStorage.setItem(STORAGE_KEY_WORKSPACE, path);
            loadedFolders.value.add(path);
        } catch {
            fileTree.value = [];
            localStorage.removeItem(STORAGE_KEY_WORKSPACE);
            currentPath.value = null;
        }
    }

    async function loadExpandedChildren() {
        for (const p of expandedFolders.value) {
            if (!loadedFolders.value.has(p)) {
                await fetchChildren(p);
            }
        }
    }

    async function selectWorkspace() {
        if (!CoreService.isReady) return;
        try {
            const selected = await open({
                directory: true,
                multiple: false,
                title: 'Select Project Workspace'
            });
            if (!selected || typeof selected !== 'string' || selected.trim() === '') return;
            await loadFolder(selected);
            selectedPath.value = selected;
            expandedFolders.value = new Set();
            await loadExpandedChildren();
        } catch (error) {
            console.error('Failed to select folder:', error);
        }
    }

    async function reloadFolder() {
        if (!currentPath.value) return;
        const savedExpanded = new Set(expandedFolders.value);
        await loadFolder(currentPath.value);
        expandedFolders.value = savedExpanded;
        await loadExpandedChildren();
    }

    function collapseAll() {
        expandedFolders.value = new Set();
    }

    async function fetchChildren(folderPath: string): Promise<boolean> {
        try {
            const response = await CoreService.sendCommand('SCAN', folderPath);
            if (!response || response.error) return false;
            const children = response.entries || response.data?.entries || [];
            if (!Array.isArray(children)) return false;

            function updateNode(entries: DirectoryEntry[], path: string): boolean {
                for (const entry of entries) {
                    if (entry.path === path) {
                        entry.children = sortEntries(children);
                        return true;
                    }
                    if (entry.children && updateNode(entry.children, path)) return true;
                }
                return false;
            }
            const found = updateNode(fileTree.value, folderPath);
            if (found) loadedFolders.value.add(folderPath);
            return found;
        } catch {
            return false;
        }
    }

    async function toggleFolder(path: string) {
        const set = new Set(expandedFolders.value);
        if (set.has(path)) {
            set.delete(path);
        } else {
            if (!loadedFolders.value.has(path)) {
                await fetchChildren(path);
            }
            set.add(path);
        }
        expandedFolders.value = set;
    }

    function selectFolder(path: string) { selectedPath.value = path; }
    function clearSelection() { selectedPath.value = null; }

    async function openFile(path: string) {
        const response = await CoreService.sendCommand("OPEN", path);
        if (!response || response.status !== "opened") return;
        return response.content;
    }

    async function createFile(name: string, targetPath?: string) {
        const target = targetPath || selectedPath.value || currentPath.value;
        if (!target) return;
        const payload = `${target}|${name}|file`;
        const response = await CoreService.sendCommand('CREATE', payload);
        if (response?.status === 'success') await reloadFolder();
        else console.error('Create file failed:', response?.error);
    }

    async function createFolder(name: string, targetPath?: string) {
        const target = targetPath || selectedPath.value || currentPath.value;
        if (!target) return;
        const payload = `${target}|${name}|folder`;
        const response = await CoreService.sendCommand('CREATE', payload);
        if (response?.status === 'success') await reloadFolder();
        else console.error('Create folder failed:', response?.error);
    }

    async function deleteItem(targetPath: string) {
        if (!targetPath) return;
        if (!window.confirm(`Delete "${targetPath}"?`)) return;
        const response = await CoreService.sendCommand('DELETE', targetPath);
        if (response?.status === 'deleted' || response?.status === 'success') {
            await reloadFolder();
            if (selectedPath.value === targetPath) selectedPath.value = null;
        } else {
            console.error('Delete failed:', response?.error);
        }
    }

    async function restoreWorkspace() {
        if (restored) return;
        restored = true;
        const storedPath = localStorage.getItem(STORAGE_KEY_WORKSPACE);
        if (!storedPath) return;
        let attempts = 0;
        while (!CoreService.isReady && attempts < 25) {
            await new Promise(r => setTimeout(r, 200));
            attempts++;
        }
        if (!CoreService.isReady) return;
        await loadFolder(storedPath);
        const storedExpanded = localStorage.getItem(STORAGE_KEY_EXPANDED);
        if (storedExpanded) {
            try {
                const parsed = JSON.parse(storedExpanded);
                if (Array.isArray(parsed)) {
                    expandedFolders.value = new Set(parsed);
                }
            } catch {}
        }
        await loadExpandedChildren();
    }
    restoreWorkspace();

    return {
        openFile,
        fileTree,
        currentPath,
        expandedFolders,
        selectedPath,
        folderName,
        headerPath,
        selectWorkspace,
        loadFolder,
        reloadFolder,
        collapseAll,
        toggleFolder,
        selectFolder,
        clearSelection,
        createFile,
        createFolder,
        deleteItem
    };
}