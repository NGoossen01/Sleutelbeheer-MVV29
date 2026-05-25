import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    // Tijdens lokale ontwikkeling: stuur /api calls door naar de Node backend
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
});
