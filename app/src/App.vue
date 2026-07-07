<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { CoreService } from './functions/core';
import { useFileTree } from './ui/scripts/useFileTree';
import { useEditor } from './ui/scripts/useEditor';
import Aside from './ui/components/aside/aside.vue';
import Editor from './ui/components/editor/editor.vue';
import CommandPalette from './ui/components/command/command.vue'

const { openFileDialog, saveFile, activePath } = useEditor();
const { selectWorkspace } = useFileTree();

// ---------- Sidebar ----------
const isSidebarVisible = ref(true);
function toggleSidebar() {
    isSidebarVisible.value = !isSidebarVisible.value;
}

// ---------- Command Palette ----------
const commandPaletteRef = ref<InstanceType<typeof CommandPalette> | null>(null);
function openCommandPalette() {
    commandPaletteRef.value?.open();
}

// ---------- Backend init ----------
onMounted(async () => {
    try {
        await CoreService.initialize();
        console.log("C++ Backend Sidecar successfully initialized.");
    } catch (error) {
        console.error("Failed to boot C++ background engine:", error);
    }
});

// ---------- Keyboard shortcuts ----------
let ctrlKFlag = false;
let ctrlKTimeout: number | null = null;

function handleKeydown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'p' && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        openCommandPalette();
        return;
    }

    // Ctrl+Shift+P – also open command palette (fallback)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'p' && !e.altKey) {
        e.preventDefault();
        openCommandPalette();
        return;
    }

    // Ctrl+B – toggle sidebar
    if (e.ctrlKey && e.key === 'b' && !e.shiftKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        toggleSidebar();
        return;
    }

    // Ctrl+K – flag for Ctrl+K Ctrl+O
    if (e.ctrlKey && e.key === 'k' && !e.shiftKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        ctrlKFlag = true;
        if (ctrlKTimeout) clearTimeout(ctrlKTimeout);
        ctrlKTimeout = window.setTimeout(() => {
            ctrlKFlag = false;
            ctrlKTimeout = null;
        }, 1000);
        return;
    }

    // Ctrl+K Ctrl+O – open workspace
    if (ctrlKFlag && e.ctrlKey && e.key === 'o' && !e.shiftKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        ctrlKFlag = false;
        if (ctrlKTimeout) {
            clearTimeout(ctrlKTimeout);
            ctrlKTimeout = null;
        }
        selectWorkspace();
        return;
    }

    // Ctrl+O (alone) – open file
    if ((e.ctrlKey || e.metaKey) && e.key === 'o' && !e.shiftKey && !e.altKey && !e.metaKey) {
        if (!ctrlKFlag) {
            e.preventDefault();
            openFileDialog();
        }
        return;
    }

    // Ctrl+S – save
    if ((e.ctrlKey || e.metaKey) && e.key === 's' && !e.shiftKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        if (activePath.value) {
            saveFile(activePath.value);
        }
        return;
    }

    // Reset Ctrl+K flag on any other key
    if (ctrlKFlag) {
        ctrlKFlag = false;
        if (ctrlKTimeout) {
            clearTimeout(ctrlKTimeout);
            ctrlKTimeout = null;
        }
    }
}

onMounted(() => {
    window.addEventListener('keydown', handleKeydown);
});
onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown);
    if (ctrlKTimeout) {
        clearTimeout(ctrlKTimeout);
        ctrlKTimeout = null;
    }
});
</script>

<template>
   


    <div class="app-shell flex h-screen w-screen overflow-hidden backdrop-blur-sm" >
        <Aside :visible="isSidebarVisible" />
        
        <Editor class="flex-1 min-w-0 overflow-hidden" />
        
        <CommandPalette ref="commandPaletteRef" :toggle-sidebar="toggleSidebar"/>
    </div>
</template>

<style>

html, body, #app {
    margin: 0;
    padding: 0;
    height: 100%;
    width: 100%;
    overflow: hidden;
}

.app-shell {
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);

}
body{
    background-color: #0f1118d2;
}
</style>