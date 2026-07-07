<template>
    <div ref="editorContainer" class="monaco-editor-container w-full h-full"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { loadMonaco } from '../../../functions/loadmonaco';
import type * as Monaco from 'monaco-editor';
import { shikiToMonaco } from '@shikijs/monaco';
import { createHighlighter } from 'shiki';
const props = defineProps<{
    modelValue: string;
    language?: string;
    path?: string;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void;
    (e: 'change', value: string): void;
}>();

const editorContainer = ref<HTMLElement | null>(null);
let editor: Monaco.editor.IStandaloneCodeEditor | null = null;
let model: Monaco.editor.ITextModel | null = null;

function getLanguageFromPath(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase() || '';
    const map: Record<string, string> = {
        ts: 'typescript', tsx: 'typescript',
        js: 'javascript', jsx: 'javascript',
        vue: 'vue', html: 'html', htm: 'html',
        css: 'css', scss: 'scss', less: 'less',
        json: 'json', jsonc: 'json', md: 'markdown',
        py: 'python', rs: 'rust', go: 'go',
        c: 'cpp', cc: 'cpp', cxx: 'cpp',
        cpp: 'cpp', h: 'cpp', hpp: 'cpp', hxx: "cpp",
        java: 'java', sh: 'shell', bash: 'shell',
        yaml: 'yaml', yml: 'yaml', toml: 'toml',
        xml: 'xml', svg: 'xml',
        txt: 'plaintext', log: 'plaintext',
    };
    return map[ext] || 'plaintext';
}

const DEFAULT_FONT_SIZE = 14;
let fontSize = DEFAULT_FONT_SIZE;

function zoomIn() {
    if (!editor) return;
    fontSize = Math.min(28, fontSize + 2);
    editor.updateOptions({ fontSize });
}
function zoomOut() {
    if (!editor) return;
    fontSize = Math.max(8, fontSize - 2);
    editor.updateOptions({ fontSize });
}
function zoomReset() {
    if (!editor) return;
    fontSize = DEFAULT_FONT_SIZE;
    editor.updateOptions({ fontSize });
}

async function setupEditor() {
    const container = editorContainer.value;
    if (!container) return;

    const monaco = await loadMonaco();
    const highlighter = await createHighlighter({
        themes: ['tokyo-night'],
        langs: [
            'typescript', 'javascript', 'vue', 'cpp', 'rust', 
            'json', 'css', 'html', 'python', 'markdown', 'plaintext'
        ]
    });

    shikiToMonaco(highlighter, monaco);

    const language = props.language || (props.path ? getLanguageFromPath(props.path) : 'plaintext');
    model = monaco.editor.createModel(props.modelValue || '', language);

    editor = monaco.editor.create(container, {
        model,
        theme: 'tokyo-night', 
        automaticLayout: true,
        fontSize: DEFAULT_FONT_SIZE,
        fontFamily: "'Cascadia Code', Consolas, 'Courier New', monospace",
        fontLigatures: true,
        lineNumbers: 'on',
        minimap: { enabled: false },
        bracketPairColorization: { enabled: true },
        autoClosingBrackets: 'always',
        autoClosingQuotes: 'always',
        autoIndent: 'full',
        formatOnPaste: true,
        formatOnType: true,
        tabSize: 4,
        insertSpaces: true,
        renderWhitespace: 'selection',
        wordWrap: 'off',
        guides: {
            bracketPairs: true,
            bracketPairsHorizontal: true,
            indentation: true,
        },
        scrollbar: { vertical: 'visible', horizontal: 'visible', useShadows: false },
    });

    // Shortcuts
    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.KeyZ, () => {
        const current = editor!.getOption(monaco.editor.EditorOption.wordWrap);
        editor!.updateOptions({ wordWrap: current === 'on' ? 'off' : 'on' });
    });
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Equal, zoomIn);
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Minus, zoomOut);
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Digit0, zoomReset);

    editor.onDidChangeModelContent(() => {
        if (model) {
            emit('update:modelValue', model.getValue());
            emit('change', model.getValue());
        }
    });

    editor.focus();
}

onMounted(() => setupEditor());

watch(() => props.path, async (newPath) => {
    if (model && newPath) {
        const monaco = await loadMonaco();
        const lang = getLanguageFromPath(newPath);
        monaco.editor.setModelLanguage(model, lang);
    }
});

watch(() => props.modelValue, (newVal) => {
    if (model && newVal !== model.getValue()) {
        model.setValue(newVal || '');
    }
});

onBeforeUnmount(() => {
    if (editor) { editor.dispose(); editor = null; }
    if (model) { model.dispose(); model = null; }
});

defineExpose({
    focus: () => editor?.focus(),
    zoomIn, zoomOut, zoomReset,
    toggleWordWrap: () => {
        if (editor) {
            const current = editor.getOption((window as any).monaco?.editor?.EditorOption?.wordWrap || 'wordWrap');
            editor.updateOptions({ wordWrap: current === 'on' ? 'off' : 'on' });
        }
    }
});
</script>
 
<style scoped>
.monaco-editor-container {
    width: 100%;
    height: 100%;
    background: transparent;
    min-width: 0px;
    overflow: hidden
}

:deep(.monaco-editor),
:deep(.monaco-editor-background),
:deep(.monaco-editor .margin) {
    background-color: transparent !important;
}
</style>