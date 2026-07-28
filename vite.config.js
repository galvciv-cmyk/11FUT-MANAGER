import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      external: [/^core-js/]
    }
  },
  optimizeDeps: {
    exclude: ['canvg', 'html2canvas']
  }
});
