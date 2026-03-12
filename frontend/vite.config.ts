import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const envDir = path.resolve(__dirname);
  const env = loadEnv(mode, envDir, '');
  const apiUrl = env.VITE_API_URL;
  
  if (!apiUrl) {
    throw new Error('VITE_API_URL is required. Please set it in frontend/.env');
  }

  return {
    envDir,
    plugins: [react()],
    server: {
      port: 10311,
      allowedHosts: ['localhost', '.trycloudflare.com'],
      proxy: {
        '/api': {
          target: 'http://localhost:10302',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
    define: {
      __API_URL__: JSON.stringify(apiUrl),
    },
  };
});
