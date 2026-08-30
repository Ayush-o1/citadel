import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Proxying /api in dev means the client can call fetch('/api/...') with no
// CORS setup and no base URL to configure. VITE_PROXY_TARGET lets Docker
// Compose point this at the `server` container instead of localhost.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_PROXY_TARGET || 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
