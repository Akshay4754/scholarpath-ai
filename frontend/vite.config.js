import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development the API runs separately; proxy /api so the browser talks to one origin, exactly like production.
const proxy = { '/api': { target: process.env.VITE_DEV_API_TARGET || 'http://localhost:4000', changeOrigin: true } };

export default defineConfig({
  plugins: [react()],
  server: { host: '0.0.0.0', proxy },
  preview: { proxy }
});
