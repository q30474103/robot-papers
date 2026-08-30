import path from 'node:path';
import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/postcss';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root: path.join(projectRoot, 'electron'),
  base: './',
  css: { postcss: { plugins: [tailwindcss()] } },
  plugins: [react()],
  resolve: {
    alias: { '@': projectRoot },
  },
  build: {
    outDir: path.join(projectRoot, 'dist-electron', 'renderer'),
    emptyOutDir: true,
    rollupOptions: {
      input: path.join(projectRoot, 'electron', 'index.html'),
    },
  },
});
