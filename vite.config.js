import { defineConfig } from 'vite';

export default defineConfig({
  base: '/MagicCrystal/',
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
