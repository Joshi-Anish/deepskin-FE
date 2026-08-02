import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_URL || 'http://localhost:8000',
        // Preserve the original Host so DRF's build_absolute_uri() produces
        // URLs the browser can reach (proxied back through Vite below).
        changeOrigin: false,
        // Only honoured by Django when DEEPSKIN_TRUST_PROXY_SSL=True; the
        // hosted preview terminates TLS, so media URLs must be https.
        headers: { 'X-Forwarded-Proto': 'https' },
      },
      '/media': {
        target: process.env.VITE_BACKEND_URL || 'http://localhost:8000',
        changeOrigin: false,
        headers: { 'X-Forwarded-Proto': 'https' },
      },
    },
  },
});
