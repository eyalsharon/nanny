import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/nanny/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Nanny Tracker',
        short_name: 'Nanny',
        description: 'Track nanny hours and payments',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/nanny/',
        icons: [
          { src: '/nanny/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/nanny/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
})
