import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'midnight',
      formats: ['umd'],
      fileName: () => 'midnight.umd.js',
    },
  },
});
