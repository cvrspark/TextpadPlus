<script setup lang="ts">
import { ref, onUnmounted, nextTick, onMounted } from 'vue';
import { useFileTree } from '../../scripts/useFileTree';
import { useEditor } from '../../scripts/useEditor';
import FileNode from './aside.filenode.vue';

defineProps<{
    visible: boolean;
}>();

const {
    fileTree,
    currentPath,
    expandedFolders,
    selectedPath,
    headerPath,
    selectWorkspace,
    reloadFolder,
    collapseAll,
    toggleFolder,
    selectFolder,
    clearSelection,
    createFile,
    createFolder,
    deleteItem
} = useFileTree();

const { openFile } = useEditor();

const creating = ref<{ type: 'file' | 'folder' | null, name: string }>({
    type: null,
    name: ''
});
const inputRef = ref<HTMLInputElement | null>(null);

function startCreate(type: 'file' | 'folder') {
    creating.value = { type, name: '' };
    nextTick(() => {
        inputRef.value?.focus();
    });
}

async function confirmCreate() {
    const name = creating.value.name.trim();
    if (!name) {
        cancelCreate();
        return;
    }
    const type = creating.value.type;
    if (!type) return;
    if (type === 'file') {
        await createFile(name);
    } else {
        await createFolder(name);
    }
    cancelCreate();
}

function cancelCreate() {
    creating.value = { type: null, name: '' };
}

const loadingFolders = ref<Set<string>>(new Set());

async function handleToggle(path: string) {
    if (expandedFolders.value.has(path)) {
        expandedFolders.value.delete(path);
        return;
    }
    loadingFolders.value.add(path);
    await toggleFolder(path);
    loadingFolders.value.delete(path);
}

const contextMenu = ref({
    visible: false,
    x: 0,
    y: 0,
    path: ''
});

function openContextMenu(path: string, event: MouseEvent) {
    contextMenu.value = {
        visible: true,
        x: event.clientX,
        y: event.clientY,
        path
    };
}

function closeContextMenu() {
    contextMenu.value.visible = false;
}

async function handleDeleteFromMenu() {
    if (!contextMenu.value.path) return;
    await deleteItem(contextMenu.value.path);
    closeContextMenu();
}

function handleGlobalClick(e: MouseEvent) {
    if (!contextMenu.value.visible) return;
    const target = e.target as HTMLElement;
    if (target.closest('.context-menu')) return;
    closeContextMenu();
}

onMounted(() => {
    document.addEventListener('click', handleGlobalClick);
});

onUnmounted(() => {
    document.removeEventListener('click', handleGlobalClick);
});

// ---- Resize ----
const width = ref(320);
const isResizing = ref(false);
const startX = ref(0);
const startWidth = ref(0);

function startResize(e: MouseEvent) {
    isResizing.value = true;
    startX.value = e.clientX;
    startWidth.value = width.value;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'ew-resize';
    window.addEventListener('mousemove', onResize);
    window.addEventListener('mouseup', stopResize);
}
function onResize(e: MouseEvent) {
    if (!isResizing.value) return;
    const delta = e.clientX - startX.value;
    let newWidth = startWidth.value + delta;
    newWidth = Math.max(200, Math.min(600, newWidth));
    width.value = newWidth;
}
function stopResize() {
    isResizing.value = false;
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    window.removeEventListener('mousemove', onResize);
    window.removeEventListener('mouseup', stopResize);
}

onUnmounted(() => {
    stopResize();
});
</script>

<template>
    <div
        class="aside-container h-screen overflow-hidden text-white flex flex-col shrink-0"
        :class="{ 'no-transition': isResizing }"
        :style="{ width: visible ? width + 'px' : '0px' }"
    >
        <div class="header flex items-center justify-between px-3 py-2 border-b border-white/10 shrink-0">
            <span class="text-sm font-medium truncate" :title="currentPath || ''">
                {{ headerPath }}
            </span>
            <div class="flex gap-1">
                <button @click="startCreate('file')" class="p-1 rounded hover:bg-white/10 transition" title="New file">
                    <span class="text-sm">📄</span>
                </button>
                <button @click="startCreate('folder')" class="p-1 rounded hover:bg-white/10 transition" title="New folder">
                    <span class="text-sm">📁</span>
                </button>
                <button @click="reloadFolder" class="p-1 rounded hover:bg-white/10 transition" title="Reload">
                    <span class="text-sm">⟳</span>
                </button>
                <button @click="collapseAll" class="p-1 rounded hover:bg-white/10 transition" title="Collapse all">
                    <span class="text-sm">⊟</span>
                </button>
            </div>
        </div>

        <div class="tree-viewport flex-1 overflow-y-auto p-3" @click="clearSelection">
            <div v-if="currentPath === null" class="flex items-center justify-center h-full">
                <button @click.stop="selectWorkspace" class="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-sm transition">
                    📂 Select a folder
                </button>
            </div>
            <div v-else>
                <div v-if="creating.type" class="create-input-row flex items-center gap-2 py-1 px-2">
                    <span class="custom-icon text-sm">
                        {{ creating.type === 'file' ? '📄' : '📁' }}
                    </span>
                    <input
                        ref="inputRef"
                        v-model="creating.name"
                        type="text"
                        :placeholder="`${creating.type === 'file' ? 'file' : 'folder'} name...`"
                        class="create-input bg-transparent border-b border-white/30 focus:border-blue-400 outline-none text-sm w-full"
                        @keydown.enter="confirmCreate"
                        @keydown.escape="cancelCreate"
                    />
                    <button @click.stop="confirmCreate" class="text-green-400 hover:text-green-300">✓</button>
                    <button @click.stop="cancelCreate" class="text-red-400 hover:text-red-300">✕</button>
                </div>

                <div v-if="fileTree.length === 0 && !creating.type" class="flex items-center justify-center h-full text-white/50 text-sm">
                    📭 Empty folder
                </div>
                <FileNode
                    v-for="(rootNode, index) in fileTree"
                    :key="index"
                    :node="rootNode"
                    :expanded="expandedFolders"
                    :selected="selectedPath"
                    :loading="loadingFolders"
                    @toggle="handleToggle"
                    @select="selectFolder"
                    @open="openFile"
                    @contextmenu="openContextMenu"
                />
            </div>
        </div>

        <div
            class="resize-handle absolute top-0 right-0 w-1.5 h-full cursor-ew-resize
                   hover:bg-white/20 transition-colors"
            @mousedown="startResize"
            :style="{ display: visible ? 'block' : 'none' }"
        ></div>

        <div
            v-if="contextMenu.visible"
            class="context-menu fixed bg-[#2d2d2d] border border-white/10 rounded shadow-lg py-1 min-w-40 z-50"
            :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
            @click.stop
        >
            <button
                @click="handleDeleteFromMenu"
                class="w-full text-left px-4 py-1.5 text-sm hover:bg-white/10 text-red-400 flex items-center gap-2"
            >
                <span>🗑️</span> Delete
            </button>
        </div>
    </div>
</template>

<style scoped>
.aside-container {
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(40px) saturate(1.5);
    -webkit-backdrop-filter: blur(40px) saturate(1.5);
    border-right: 1px solid rgba(255, 255, 255, 0.08);
    position: relative;
    transition: width 0.2s ease;
    will-change: width;
}
.aside-container.no-transition {
    transition: none !important;
}
.header {
    min-height: 33px;
    max-height: 33px;
    background: rgba(255, 255, 255, 0.03);
}
.tree-viewport {
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
}
.tree-viewport::-webkit-scrollbar {
    width: 5px;
}
.tree-viewport::-webkit-scrollbar-track {
    background: transparent;
}
.tree-viewport::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 10px;
}
.resize-handle {
    width: 4px;
    background: transparent;
    z-index: 60;
}
.resize-handle:hover {
    background: rgba(255, 255, 255, 0.15);
}
.resize-handle:active {
    background: rgba(255, 255, 255, 0.25);
}
button {
    font-size: 0.9rem;
    line-height: 1;
}
.create-input-row {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
    margin-bottom: 4px;
}
.create-input {
    padding: 2px 4px;
}
.create-input:focus {
    border-bottom-color: #60a5fa;
}
.context-menu {
    backdrop-filter: blur(10px);
}
</style>