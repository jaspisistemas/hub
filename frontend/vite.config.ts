import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    allowedHosts: [
      'panel-joshua-norfolk-molecular.trycloudflare.com',
      'localhost',
    ],
  },
});
