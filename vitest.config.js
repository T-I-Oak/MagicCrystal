import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    define: {
      __APP_VERSION__: '"0.1.1"',
    },
  },
});
