import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      },
      manifest: {
        name: '11FUT MANAGER',
        short_name: '11FUT',
        description: 'La herramienta definitiva para entrenadores.',
        theme_color: '#141414',
        background_color: '#0a0a0a',
        display: 'standalone',
        icons: [
          {
            src: '/favicon.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/favicon.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  build: {
    rollupOptions: {
      external: [/^core-js/],
      output: {
        manualChunks: {
          'vendor-firebase': ['firebase/app', 'firebase/firestore', 'firebase/auth'],
          'vendor-pdf': ['jspdf', 'html2canvas']
        }
      }
    }
  },
  optimizeDeps: {
    exclude: ['canvg', 'html2canvas']
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.js']
  }
});
