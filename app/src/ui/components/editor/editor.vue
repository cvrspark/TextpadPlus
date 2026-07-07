<script setup lang="ts">
import { useEditor } from '../../scripts/useEditor';
import MonacoEditor from './monaco.vue';

const {
    openFiles,
    activePath,
    activeFile,
    closeFile,
    setActive,
    updateContent,
} = useEditor();


function onEditorChange(newContent: string) {
    const path = activePath.value;
    if (path) {
        updateContent(path, newContent);
    }
}
</script>

<template>
    <div class="editor-container flex flex-col h-full w-full text-white">
        <div class="tab-bar flex items-center bg-white/5 border-b border-white/10 shrink-0 overflow-x-auto">
            <div
                v-for="file in openFiles"
                :key="file.path"
                class="tab flex items-center gap-1 px-3 py-1.5 text-sm cursor-pointer border-r border-white/5 hover:bg-white/5 transition"
                :class="{
                    'bg-white/10': activePath === file.path,
                    'text-white/50': activePath !== file.path
                }"
                @click="setActive(file.path)"
            >
                <span class="truncate max-w-30">{{ file.name }}</span>
                <span v-if="file.dirty" class="text-yellow-400 text-xs">●</span>
                <button
                    class="close-btn ml-1 text-white/30 hover:text-white/80 transition"
                    @click.stop="closeFile(file.path)"
                >✕</button>
            </div>
            
        </div>

        <div class="editor-area flex-1 overflow-hidden relative">
            <div v-if="!activeFile" class="placeholder flex items-center justify-center w-full h-full text-white/30 text-lg">
                <div class="text-center">
                    <div class="text-4xl mb-4">📄</div>
                    <div>No file open</div>
                    <div class="text-sm mt-2 text-white/20">Press <kbd>Ctrl+O</kbd> to open a file</div>
                </div>
            </div>

            <MonacoEditor
                v-else
                :model-value="activeFile.content"
                :path="activeFile.path"
                @update:model-value="onEditorChange"
                class="w-full h-full"
            />
        </div>
    </div>
</template>

<style scoped>
.editor-container {
    background: rgba(255, 255, 255, 0.02);
    backdrop-filter: blur(20px) saturate(1.2);
    -webkit-backdrop-filter: blur(20px) saturate(1.2);
}
.tab-bar::-webkit-scrollbar {
    height: 2px;
}
.tab-bar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
}
.tab {
    min-width: 80px;
    white-space: nowrap;
}
.tab .close-btn {
    font-size: 0.7rem;
    line-height: 1;
}
.editor-area {
    position: relative;
}
.placeholder {
    backdrop-filter: blur(4px);
}
kbd {
    background: rgba(255,255,255,0.1);
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.8rem;
    font-family: monospace;
}
</style>