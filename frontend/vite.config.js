import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Defaults match the README (web :5173, API :4000). Override when those ports are taken:
//   API_PROXY_TARGET=http://localhost:4100 npm run dev -- --port 5180
const apiTarget = process.env.API_PROXY_TARGET || 'http://localhost:4000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
});
