import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    css: false,
    exclude: ['e2e/**', 'node_modules/**', 'Proectos/**'],
  },
  resolve: {
    alias: {
      '@/content-collections': path.resolve(__dirname, './.content-collections/generated'),
      '@': path.resolve(__dirname, './src'),
    },
  },
});
