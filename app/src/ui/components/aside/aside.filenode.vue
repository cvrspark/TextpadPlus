<script lang="ts">
export default {
    name: 'FileNode'
}
</script>

<script setup lang="ts">
import { computed } from 'vue';
import { DirectoryEntry } from '../../../types/command.types.ts';

const props = defineProps<{
    node: DirectoryEntry;
    expanded: Set<string>;
    selected: string | null;
    loading: Set<string>;
}>();

const emit = defineEmits<{
    (e: 'toggle', path: string): void;
    (e: 'select', path: string): void;
    (e: 'open', path: string): void;
    (e: 'contextmenu', path: string, event: MouseEvent): void;
}>();

const isSelected = computed(() => props.selected === props.node.path);
const isExpanded = computed(() => props.expanded.has(props.node.path));
const isLoading = computed(() => props.loading.has(props.node.path));

const icon = computed(() => props.node.type === 'folder' ? '📁' : '📄');
const iconColor = computed(() => props.node.type === 'folder' ? '#ece071' : '#cccccc');

function onFolderClick(e: MouseEvent) {
    e.stopPropagation();
    emit('select', props.node.path);
    emit('toggle', props.node.path);
}

function onFileClick(e: MouseEvent) {
    e.stopPropagation();
    emit('select', props.node.path);
}

function onFileDblClick(e: MouseEvent) {
    e.stopPropagation();
    emit('open', props.node.path);
}

function onContextMenu(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    emit('select', props.node.path);
    emit('contextmenu', props.node.path, e);
}
</script>

<template>
    <div class="file-node" style="padding-left: 8px;">
        <div
            v-if="node.type === 'folder'"
            class="node-item folder"
            :class="{ 'selected': isSelected }"
            @click="onFolderClick"
            @contextmenu.prevent.stop="onContextMenu"
        >
            <span class="chevron">
                <span v-if="isLoading" class="spinner">⏳</span>
                <span v-else>{{ isExpanded ? '▼' : '▶' }}</span>
            </span>
            <span class="custom-icon" :style="{ color: iconColor }">
                {{ icon }}
            </span>
            <span class="name">{{ node.name }}</span>
        </div>

        <div
            v-else
            class="node-item file"
            :class="{ 'selected': isSelected }"
            @click="onFileClick"
            @dblclick="onFileDblClick"
            @contextmenu.prevent.stop="onContextMenu"
        >
            <span class="chevron-placeholder"></span>
            <span class="custom-icon" :style="{ color: iconColor }">
                {{ icon }}
            </span>
            <span class="name">{{ node.name }}</span>
        </div>

        <div v-if="node.type === 'folder' && isExpanded && node.children" class="node-children">
            <FileNode
                v-for="(child, index) in node.children"
                :key="index"
                :node="child"
                :expanded="expanded"
                :selected="selected"
                :loading="loading"
                @toggle="(path: string) => emit('toggle', path)"
                @select="(path: string) => emit('select', path)"
                @open="(path: string) => emit('open', path)"
                @contextmenu="(path: string, e: MouseEvent) => emit('contextmenu', path, e)"
            />
        </div>
    </div>
</template>

<style scoped>
.node-item {
    display: flex;
    align-items: center;
    padding: 4px 8px;
    border-radius: 4px;
    user-select: none;
    font-family: ui-monospace, monospace;
    font-size: 0.85rem;
    transition: background 0.1s ease;
    cursor: pointer;
    height: 24px;
}
.node-item:hover {
    background: rgba(255, 255, 255, 0.06);
}
.node-item.selected {
    background: rgba(255, 255, 255, 0.12);
}
.custom-icon {
    margin-right: 8px;
    font-size: 1rem;
    display: inline-flex;
    align-items: center;
    filter: drop-shadow(0px 1px 2px rgba(0,0,0,0.2));
}
.chevron {
    margin-right: 6px;
    font-size: 0.65rem;
    color: rgba(255, 255, 255, 0.4);
    width: 12px;
    text-align: center;
}
.chevron-placeholder {
    width: 18px;
}
.name {
    color: rgba(255, 255, 255, 0.85);
    white-space: nowrap;
}
.spinner {
    display: inline-block;
    animation: spin 1s linear infinite;
    font-size: 0.7rem;
    color: #aaa;
}
@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}
</style>