import { defineConfig } from 'vite';
import { readFileSync } from 'fs';
const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));

export default defineConfig({
  base: './', // GitHub Pages support
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  build: {
    target: 'esnext',
    cssTarget: 'chrome100',
    cssMinify: false,
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
});
