import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
<<<<<<< HEAD
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Support both frontend/.env (local) and parent ThermoScope/.env (global root)
  const rootDir = path.resolve(__dirname, '..');
  const parentEnv = loadEnv(mode, rootDir, '');
  const localEnv = loadEnv(mode, __dirname, '');

  const cartoApiKey = (
    localEnv.VITE_CARTO_API_KEY ||
    parentEnv.VITE_CARTO_API_KEY ||
    process.env.VITE_CARTO_API_KEY ||
    ''
  ).trim();

  const apiTarget =
    process.env.VITE_API_BASE_URL ||
    localEnv.VITE_API_BASE_URL ||
    parentEnv.VITE_API_BASE_URL ||
    'http://127.0.0.1:8000';

  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_CARTO_API_KEY': JSON.stringify(cartoApiKey),
    },
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
=======
import tailwindConfig from './tailwind.config';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(),],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
>>>>>>> 8006a97 (frontend)
});
