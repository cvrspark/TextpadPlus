import { ref, computed, watch } from 'vue';
import { CoreService } from '../../functions/core.ts';
import { open } from '@tauri-apps/plugin-dialog';

export interface EditorFile {
    path: string;
    name: string;
    content: string;
    dirty: boolean;
}

const STORAGE_KEY_EDITOR = 'textpad_open_files';

const openFiles = ref<EditorFile[]>([]);
const activePath = ref<string | null>(null);
let restored = false;

watch(openFiles, (files) => {
    const toStore = files.map(f => ({ path: f.path, dirty: f.dirty }));
    localStorage.setItem(STORAGE_KEY_EDITOR, JSON.stringify(toStore));
}, { deep: true });

const activeFile = computed(() =>
    openFiles.value.find(f => f.path === activePath.value) || null
);

async function openFile(path: string, dirty = false) {
    const existing = openFiles.value.find(f => f.path === path);
    if (existing) {
        activePath.value = path;
        return;
    }
    const response = await CoreService.sendCommand('OPEN', path);
    if (!response || response.status !== 'opened') return;

    const newFile: EditorFile = {
        path,
        name: path.split(/[\\/]/).pop() || path,
        content: response.content || '',
        dirty
    };
    openFiles.value.push(newFile);
    activePath.value = path;
}

async function openFileDialog() {
    const selected = await open({
        multiple: false,
        title: 'Open File'
    });
    if (selected && typeof selected === 'string') {
        await openFile(selected);
    }
}

function closeFile(path: string) {
    const index = openFiles.value.findIndex(f => f.path === path);
    if (index === -1) return;
    openFiles.value.splice(index, 1);
    if (activePath.value === path) {
        activePath.value = openFiles.value.length > 0 ? openFiles.value[0].path : null;
    }
}

function setActive(path: string) {
    if (openFiles.value.some(f => f.path === path)) {
        activePath.value = path;
    }
}

function updateContent(path: string, content: string) {
    const file = openFiles.value.find(f => f.path === path);
    if (file) {
        file.content = content;
        file.dirty = true;
    }
}

async function saveFile(path: string) {
    const file = openFiles.value.find(f => f.path === path);
    if (!file) return;
    const escapedContent = file.content
            .replace(/\\/g, '\\\\')
            .replace(/\n/g, '\\n')
            .replace(/\|/g, '\\|');
    const payload = `${path}|${escapedContent}`;
    const response = await CoreService.sendCommand('SAVE', payload);
    if (response && response.status === 'saved') {
        file.dirty = false;
    }
}

async function restoreEditor() {
    if (restored) return;
    restored = true;
    const stored = localStorage.getItem(STORAGE_KEY_EDITOR);
    if (!stored) return;
    let files: { path: string; dirty: boolean }[] = [];
    try { files = JSON.parse(stored); } catch { return; }
    if (!Array.isArray(files)) return;

    let attempts = 0;
    while (!CoreService.isReady && attempts < 25) {
        await new Promise(r => setTimeout(r, 200));
        attempts++;
    }
    if (!CoreService.isReady) return;

    for (const f of files) {
        await openFile(f.path, f.dirty || false);
    }
}
restoreEditor();

export function useEditor() {
    return {
        openFiles,
        activePath,
        activeFile,
        openFile,
        openFileDialog,
        closeFile,
        setActive,
        updateContent,
        saveFile
    };
}