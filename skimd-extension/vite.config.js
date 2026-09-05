import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

// Chrome Extension MV3 multi-entry build strategy:
//
// The popup HTML lives at the project root (popup.html) so Vite outputs
// it to dist/popup.html — Chrome's manifest references it there.
// JS entries (content-script, service-worker) are output flat to dist/.
// Static files (manifest.json, icons/) are copied from public/ via publicDir.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
        'content-script': resolve(__dirname, 'src/content/index.js'),
        'service-worker': resolve(__dirname, 'src/background/service-worker.js'),
      },
      output: {
        // Flat JS output so Chrome sees popup.js, content-script.js etc. at root.
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
  },
});
