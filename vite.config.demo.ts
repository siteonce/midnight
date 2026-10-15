import { defineConfig } from 'vite';

export default defineConfig({
  root: 'demo',
  base: '/midnight/',
  build: {
    outDir: '../demo-dist',
    emptyOutDir: true,
  },
});
