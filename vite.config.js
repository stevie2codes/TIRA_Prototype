import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  base: process.env.NETLIFY ? '/' : '/TIRA_Prototype/',
  plugins: [react()],
  server: {
    open: true,
  },
  resolve: {
    dedupe: ['react', 'react-dom', '@tylertech/forge', '@tylertech/tyler-icons'],
  },
  build: {
    emptyOutDir: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        'report-canvas': resolve(__dirname, 'report-canvas/index.html'),
      },
    },
  },
});
