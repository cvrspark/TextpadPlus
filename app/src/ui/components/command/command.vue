<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { useEditor } from '../../scripts/useEditor';
import { useFileTree } from '../../scripts/useFileTree';

const emit = defineEmits<{
    (e: 'close'): void;
}>();

const isVisible = ref(false);
const searchQuery = ref('');
const filteredCommands = ref<Command[]>([]);
const selectedIndex = ref(0);
const inputRef = ref<HTMLInputElement | null>(null);

interface Command {
    id: string;
    label: string;
    icon?: string;
    shortcut?: string;
    action: () => void;
}

const { openFileDialog, saveFile, closeFile, activePath, openFiles } = useEditor();
const { selectWorkspace, reloadFolder, collapseAll } = useFileTree();

const props = defineProps<{
    toggleSidebar: () => void;
}>();

const allCommands: Command[] = [
    { id: 'open-file', label: 'Open File', icon: '📂', shortcut: 'Ctrl+O', action: openFileDialog },
    { id: 'open-folder', label: 'Open Folder (Workspace)', icon: '📁', shortcut: 'Ctrl+K Ctrl+O', action: selectWorkspace },
    { id: 'toggle-sidebar', label: 'Toggle Sidebar', icon: '📐', shortcut: 'Ctrl+B', action: props.toggleSidebar },
    { id: 'save', label: 'Save', icon: '💾', shortcut: 'Ctrl+S', action: () => { if (activePath.value) saveFile(activePath.value); } },
    { id: 'reload-folder', label: 'Reload Folder', icon: '⟳', action: reloadFolder },
    { id: 'collapse-all', label: 'Collapse All Folders', icon: '⊟', action: collapseAll },
    { id: 'close-file', label: 'Close Current File', icon: '✕', action: () => { if (activePath.value) closeFile(activePath.value); } },
    { id: 'close-all', label: 'Close All Files', icon: '✕✕', action: () => { openFiles.value.forEach(f => closeFile(f.path)); } },
];

function filterCommands() {
    const query = searchQuery.value.toLowerCase().trim();
    filteredCommands.value = query
        ? allCommands.filter(cmd =>
            cmd.label.toLowerCase().includes(query) ||
            (cmd.shortcut && cmd.shortcut.toLowerCase().includes(query))
        )
        : allCommands;
    selectedIndex.value = 0;
}

function selectNext() {
    if (filteredCommands.value.length) {
        selectedIndex.value = (selectedIndex.value + 1) % filteredCommands.value.length;
    }
}

function selectPrevious() {
    if (filteredCommands.value.length) {
        selectedIndex.value = (selectedIndex.value - 1 + filteredCommands.value.length) % filteredCommands.value.length;
    }
}

function executeSelected() {
    if (filteredCommands.value[selectedIndex.value]) {
        executeCommand(filteredCommands.value[selectedIndex.value]);
    }
}

function executeCommand(cmd: Command) {
    cmd.action();
    close();
}

function open() {
    isVisible.value = true;
    searchQuery.value = '';
    filterCommands();
    nextTick(() => {
        inputRef.value?.focus();
    });
}

function close() {
    isVisible.value = false;
    emit('close');
}

defineExpose({ open });

watch(isVisible, (visible) => {
    if (visible) selectedIndex.value = 0;
});


</script>


<template>
    <Teleport to="body">
        <div
            v-show="isVisible"
            class="command-palette-overlay fixed inset-0 z-100 flex items-start justify-center pt-20 bg-black/40 backdrop-blur-sm"
            @click.self="close"
            @keydown.esc="close"
        >
            <div class="command-palette w-140 max-w-[90vw] bg-[#000000af]/95 backdrop-blur-xl rounded-lg shadow-2xl border border-white/10 overflow-hidden">
                <div class="relative">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-lg">⌘</span>
                    <input
                        ref="inputRef"
                        v-model="searchQuery"
                        type="text"
                        placeholder="Type a command..."
                        class="w-full px-10 py-3 bg-transparent text-white/90 placeholder:text-white/30 outline-none font-mono text-sm"
                        @input="filterCommands"
                        @keydown.down.prevent="selectNext"
                        @keydown.up.prevent="selectPrevious"
                        @keydown.enter.prevent="executeSelected"
                    />
                    <span class="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 text-xs">
                        {{ filteredCommands.length }} commands
                    </span>
                </div>

                <div class="max-h-80 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    <div
                        v-for="(cmd, index) in filteredCommands"
                        :key="cmd.id"
                        class="command-item flex items-center justify-between px-4 py-2 cursor-pointer transition-colors"
                        :class="{
                            'bg-white/10': selectedIndex === index,
                            'hover:bg-white/5': selectedIndex !== index
                        }"
                        @mouseenter="selectedIndex = index"
                        @click="executeCommand(cmd)"
                    >
                        <div class="flex items-center gap-3 flex-1 min-w-0">
                            <span class="text-white/30 text-xs font-mono shrink-0">{{ cmd.icon || '▸' }}</span>
                            <span class="text-white/90 text-sm truncate">{{ cmd.label }}</span>
                        </div>
                        <span v-if="cmd.shortcut" class="text-white/30 text-xs font-mono shrink-0 ml-4">
                            {{ cmd.shortcut }}
                        </span>
                    </div>
                </div>
                
            </div>
        </div>
    </Teleport>
</template>


<style scoped>
.command-palette-overlay {
    animation: fadeIn 0.15s ease;
}
@keyframes fadeIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
}
.command-palette {
    box-shadow: 20px 20px rgba(0, 0, 0, 0.5);
}
.command-palette .max-h-80::-webkit-scrollbar {
    width: 4px;
}
.command-palette .max-h-80::-webkit-scrollbar-track {
    background: transparent;
}
.command-palette .max-h-80::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
}
</style>