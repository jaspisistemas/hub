import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    allowedHosts: ['portsmouth-tin-import-favour.trycloudflare.com', 'localhost'],
  },
  define: {
    __API_URL__: (() => {
      const apiUrl = process.env.VITE_API_URL;
      if (!apiUrl) {
        throw new Error('VITE_API_URL is required');
      }
      return JSON.stringify(apiUrl);
    })(),
  },
});
