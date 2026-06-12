import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
    plugins: [
        tailwindcss(),
        react(),
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    root: '.',
    // Load .env from the project root (shared with PHP).
    // Only VITE_-prefixed variables are exposed to client-side code.
    envDir: '../',
    build: {
        outDir: 'dist',
        emptyOutDir: true,
    },
    server: {
        host: 'localhost',
        port: 5173,
        strictPort: true,
        proxy: {
            '/api': {
                target: 'http://localhost',
                changeOrigin: true,
                secure: false,
                cookieDomainRewrite: { '*': '' },
            },
            '/uploads': {
                target: 'http://localhost',
                changeOrigin: true,
                secure: false,
            },
            '/assets': {
                target: 'http://localhost',
                changeOrigin: true,
                secure: false,
            },
        },
    },
});
