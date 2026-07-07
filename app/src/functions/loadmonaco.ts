import * as monaco from 'monaco-editor';

let monacoInstance: typeof monaco | null = null;
let loadingPromise: Promise<typeof monaco> | null = null;

export async function loadMonaco(): Promise<typeof monaco> {
    if (monacoInstance) return monacoInstance;
    if (loadingPromise) return loadingPromise;

    loadingPromise = (async () => {
        const module = await import('monaco-editor');
        monacoInstance = module.default || module;
        return monacoInstance;
    })();

    return loadingPromise;
}

export function preloadMonaco() {
    loadMonaco().then(() => console.log('Monaco preloaded'));
}