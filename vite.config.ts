import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
    root: path.resolve(process.cwd(), 'app'),
    plugins: [vue(), tailwindcss()],
    clearScreen: false,
    server: {
        port: 1420,
        strictPort: true,
        host: host || false,
        hmr: host ? { protocol: "ws", host, port: 1420 } : undefined,
        watch: { ignored: ["**/src-tauri/**"] },
    },
    build: {
        chunkSizeWarningLimit: 6000, 
        outDir: path.resolve(process.cwd(), 'app/dist'),
        emptyOutDir: true,
        rollupOptions: {
            output: {
                manualChunks: {
                    monaco: ['monaco-editor']
                }
            }
        }
    },
    optimizeDeps: {
        include: ['monaco-editor']
    }
});