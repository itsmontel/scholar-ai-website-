import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { vitePluginBlockUnusedPublicMedia } from './scripts/vite-plugin-block-unused-public-media.mjs'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), vitePluginBlockUnusedPublicMedia()],
  server: {
    port: 5173,
    open: true
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-stripe': ['@stripe/stripe-js'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})

