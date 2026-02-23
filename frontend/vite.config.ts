import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiUrl = env.VITE_API_URL;
  
  if (!apiUrl) {
    throw new Error('VITE_API_URL is required. Please set it in frontend/.env');
  }

  return {
    plugins: [react()],
    server: {
      port: 5173,
      allowedHosts: ['portsmouth-tin-import-favour.trycloudflare.com', 'localhost'],
    },
    define: {
      __API_URL__: JSON.stringify(apiUrl),
    },
  };
});
